"use client";

import { zipSync } from "fflate";
import { Download, FileCode2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/download-blob";

const SIZE_PRESETS = [16, 32, 48, 64, 128, 192, 256, 512, 1024] as const;

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message || "Error";
  if (typeof error === "string") return error;
  return "Unknown error";
}

async function rasterizeSvgToPng(
  svgSource: string,
  size: number,
): Promise<Blob> {
  const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not rasterize SVG."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG export failed."))),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function SvgToPngApp() {
  const [svgText, setSvgText] = React.useState("");
  const [sizes, setSizes] = React.useState<Record<number, boolean>>(() => {
    const o: Record<number, boolean> = {};
    for (const s of SIZE_PRESETS) o[s] = [192, 512].includes(s);
    return o;
  });
  const [busy, setBusy] = React.useState(false);

  const onSvgFile = React.useCallback((list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const t = reader.result;
      if (typeof t === "string") setSvgText(t);
    };
    reader.onerror = () => toast.error("Could not read SVG.");
    reader.readAsText(f);
  }, []);

  const activeSizes = SIZE_PRESETS.filter((s) => sizes[s]);

  const onExportZip = React.useCallback(async () => {
    const src = svgText.trim();
    if (!src.includes("<svg")) {
      toast.error("Paste valid SVG markup or upload an .svg file.");
      return;
    }
    const picked = SIZE_PRESETS.filter((s) => sizes[s]);
    if (picked.length === 0) {
      toast.error("Pick at least one size.");
      return;
    }
    setBusy(true);
    try {
      const zipObj: Record<string, Uint8Array> = {};
      for (const s of picked) {
        const png = await rasterizeSvgToPng(src, s);
        const buf = await png.arrayBuffer();
        zipObj[`icon-${s}.png`] = new Uint8Array(buf);
      }
      const zipped = zipSync(zipObj);
      downloadBlob(
        new Blob([zipped], { type: "application/zip" }),
        "svg-png-sizes.zip",
      );
      toast.success(`ZIP with ${picked.length} PNG files.`);
    } catch (e) {
      toast.error(errorToMessage(e));
    } finally {
      setBusy(false);
    }
  }, [sizes, svgText]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <FileCode2 className="size-5" aria-hidden />
          </div>
          <h1 className={toolHeroTitleClassName}>SVG to PNG (multi-size)</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Rasterize one SVG to square PNGs at common icon and asset sizes. Handy
          next to the favicon generator: export 192/512 for PWA, or a full set
          for app stores. Canvas runs locally in your browser.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <FileDropZone
          disabled={busy}
          busy={busy}
          inputId="svg-to-png-file"
          accept=".svg,image/svg+xml"
          multiple={false}
          onFiles={onSvgFile}
          fileIcon={(p) => <FileCode2 {...p} />}
          dropTitle="Drop an .svg file or paste below"
          dropHint="Vectors only"
          chooseLabel="Choose SVG"
          fileHint={svgText ? "SVG loaded" : "No SVG yet"}
          size={svgText ? "sm" : "md"}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="svg-source" className="text-sm">
            SVG source
          </Label>
          <Textarea
            id="svg-source"
            value={svgText}
            onChange={(e) => setSvgText(e.target.value)}
            placeholder="<svg xmlns='http://www.w3.org/2000/svg' ...>"
            className="min-h-[160px] font-mono text-xs"
            disabled={busy}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-sm tracking-tight">Output sizes</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              const allOn = SIZE_PRESETS.every((s) => sizes[s]);
              const next: Record<number, boolean> = {};
              for (const s of SIZE_PRESETS) next[s] = !allOn;
              setSizes(next);
            }}
          >
            Toggle all
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {SIZE_PRESETS.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={sizes[s]}
                disabled={busy}
                onCheckedChange={(v) =>
                  setSizes((prev) => ({ ...prev, [s]: Boolean(v) }))
                }
              />
              <span>
                {s}×{s}
              </span>
            </label>
          ))}
        </div>
        <Button
          type="button"
          disabled={busy || activeSizes.length === 0}
          onClick={() => void onExportZip()}
          className="w-fit gap-2"
        >
          <Download className="size-4" aria-hidden />
          Download ZIP ({activeSizes.length} files)
        </Button>
      </section>
    </div>
  );
}
