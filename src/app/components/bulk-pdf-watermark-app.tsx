"use client";

import { Download, Image as ImageIcon, Loader2, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { zipSync } from "fflate";

import { FilePdfGlyph } from "@/components/file-glyphs";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { downloadBlob } from "@/lib/download-blob";
import {
  addWatermarkToPdf,
  type PdfWatermarkOptions,
  type WatermarkPlacement,
  type WatermarkType,
} from "@/lib/pdf/pdf-watermark";
import { getPdfJs } from "@/lib/pdf/pdfjs";
import { Link } from "@/i18n/navigation";

interface BulkPdfItem {
  id: string;
  file: File;
  pageCount: number | null;
  loadError: string | null;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) return msg;
    return error.name || "Unknown error";
  }
  if (typeof error === "string" && error.trim()) return error.trim();
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.pdf$/i, "");
  return leaf || "export";
}

function sanitizeZipBaseName(name: string) {
  const s = name.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 80);
  return s || "document";
}

async function readImageBytes(
  file: File,
): Promise<{ bytes: Uint8Array; mime: "image/png" | "image/jpeg" }> {
  const mime =
    file.type === "image/png"
      ? "image/png"
      : file.type === "image/jpeg"
        ? "image/jpeg"
        : null;
  if (!mime) throw new Error("unsupported_image_format");
  const buf = await file.arrayBuffer();
  return { bytes: new Uint8Array(buf), mime };
}

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || /\.pdf$/i.test(file.name)
  );
}

export function BulkPdfWatermarkApp() {
  const [items, setItems] = React.useState<BulkPdfItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<null | { phase: string }>(
    null,
  );
  const [applyError, setApplyError] = React.useState<string | null>(null);
  const [skippedFiles, setSkippedFiles] = React.useState<
    Array<{ fileName: string; error: string }>
  >([]);

  const [watermarkType, setWatermarkType] =
    React.useState<WatermarkType>("text");
  const [placement, setPlacement] =
    React.useState<WatermarkPlacement>("center");
  const [rotateDeg, setRotateDeg] = React.useState(-35);
  const [opacity, setOpacity] = React.useState(0.18);
  const [tile, setTile] = React.useState(true);
  const [tileGapPx, setTileGapPx] = React.useState(120);

  const [wmText, setWmText] = React.useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = React.useState(56);
  const [colorHex, setColorHex] = React.useState("#111827");

  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imageWidthPercent, setImageWidthPercent] = React.useState(35);

  const loadMeta = React.useCallback(async (id: string, file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const pdfjs = await getPdfJs();
      const pdf = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
      setItems((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, pageCount: pdf.numPages, loadError: null } : x,
        ),
      );
    } catch (e) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? { ...x, pageCount: null, loadError: errorToMessage(e) }
            : x,
        ),
      );
    }
  }, []);

  const onAddFiles = React.useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const pdfFiles = Array.from(files).filter(isPdfFile);
      if (pdfFiles.length === 0) {
        toast.error("Add PDF files only.");
        return;
      }
      const newItems: BulkPdfItem[] = pdfFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        pageCount: null,
        loadError: null,
      }));
      setItems((prev) => [...prev, ...newItems]);
      for (const it of newItems) {
        void loadMeta(it.id, it.file);
      }
    },
    [loadMeta],
  );

  const onRemoveItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const onClearAll = React.useCallback(() => {
    setItems([]);
    setApplyError(null);
    setSkippedFiles([]);
  }, []);

  const metaPending = items.some(
    (i) => i.pageCount === null && i.loadError === null,
  );
  const readyItems = items.filter(
    (i) => i.pageCount !== null && i.pageCount > 0 && !i.loadError,
  );

  const canApply =
    readyItems.length > 0 &&
    !busy &&
    !metaPending &&
    (watermarkType === "text" ? wmText.trim().length > 0 : Boolean(imageFile));

  async function onApplyBulk() {
    if (!canApply) return;

    setBusy(true);
    setApplyError(null);
    setSkippedFiles([]);
    setProgress({ phase: "Preparing watermark…" });

    try {
      const watermark: PdfWatermarkOptions =
        watermarkType === "text"
          ? {
            type: "text",
            text: wmText,
            fontSize,
            colorHex,
            opacity,
            rotateDeg,
            placement,
            tile,
            tileGapPx,
          }
          : (() => {
            const f = imageFile;
            if (!f) throw new Error("missing_watermark_image");
            return {
              type: "image",
              imageBytes: new Uint8Array(),
              imageMime: "image/png",
              opacity,
              rotateDeg,
              placement,
              widthPercent: imageWidthPercent,
              tile,
              tileGapPx,
            } satisfies PdfWatermarkOptions;
          })();

      const resolvedWatermark =
        watermark.type === "image"
          ? (() => {
            const f = imageFile;
            if (!f) throw new Error("missing_watermark_image");
            return readImageBytes(f).then((img) => {
              return {
                ...watermark,
                imageBytes: img.bytes,
                imageMime: img.mime,
              } as const;
            });
          })()
          : Promise.resolve(watermark);

      const wm = await resolvedWatermark;

      const zipFiles: Record<string, Uint8Array> = {};
      const total = readyItems.length;
      const skipped: Array<{ fileName: string; error: string }> = [];

      for (let i = 0; i < readyItems.length; i++) {
        const item = readyItems[i];
        if (!item) continue;
        const pc = item.pageCount;
        if (!pc) continue;

        setProgress({ phase: `Watermarking ${i + 1} / ${total}…` });

        const buf = await item.file.arrayBuffer();
        const pageNumbers = Array.from({ length: pc }, (_, n) => n + 1);
        try {
          const out = await addWatermarkToPdf({
            pdfBytes: buf.slice(0),
            pageNumbers,
            watermark: wm,
          });

          const base = sanitizeZipBaseName(
            baseNameFromFileName(item.file.name),
          );
          const key = `${String(i + 1).padStart(3, "0")}-${base}-watermarked.pdf`;
          zipFiles[key] = out;
        } catch (e) {
          skipped.push({ fileName: item.file.name, error: errorToMessage(e) });
        }
      }

      setProgress({ phase: "Creating ZIP…" });
      setSkippedFiles(skipped);

      const keys = Object.keys(zipFiles);
      if (keys.length === 0) {
        throw new Error(
          skipped.length > 0
            ? `All PDFs failed to watermark (first error: ${skipped[0]?.error}).`
            : "No PDFs were successfully watermarked.",
        );
      }

      const zipped = zipSync(zipFiles, { level: 6 });
      const zipBlob = new Blob([zipped.slice().buffer], {
        type: "application/zip",
      });
      downloadBlob(zipBlob, "watermarked-pdfs.zip");
      toast.success(
        `Downloaded ZIP with ${keys.length} watermarked PDF${keys.length === 1 ? "" : "s"}`,
      );

      if (skipped.length > 0) {
        toast.warning(
          `Skipped ${skipped.length} PDF${skipped.length === 1 ? "" : "s"} due to watermarking errors.`,
        );
      }
    } catch (e) {
      const message = errorToMessage(e);
      console.error({ bulkWatermarkError: e });
      setApplyError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FilePdfGlyph className="size-8 text-muted-foreground" aria-hidden />
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
            Bulk PDF Watermark
          </h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Upload many PDFs, set one watermark, and download every file
          watermarked on all pages — packaged as a ZIP. Everything stays in your
          browser.
        </p>
      </header>

      <FileDropZone
        disabled={busy}
        busy={busy}
        inputId="bulk-pdf-watermark-input"
        accept=".pdf,application/pdf"
        multiple
        onFiles={onAddFiles}
        fileIcon={FilePdfGlyph}
        dropTitle={
          items.length
            ? "Drop more PDFs or click to add"
            : "Drop PDFs here or click to browse"
        }
        dropHint="Same watermark on every file · all pages · local-only"
        chooseLabel={items.length ? "Add PDFs" : "Choose PDFs"}
        fileHint="Your files never leave this device."
        size={items.length ? "sm" : "md"}
      />

      {items.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={busy}
          >
            <Trash2 className="size-4" aria-hidden />
            Clear all
          </Button>
          <span className="text-muted-foreground text-sm">
            {items.length} file{items.length === 1 ? "" : "s"}
            {readyItems.length !== items.length && !metaPending
              ? ` · ${readyItems.length} ready`
              : ""}
          </span>
        </div>
      ) : null}

      {busy || metaPending ? (
        <div
          className="flex items-center gap-2 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>
            {busy ? (progress?.phase ?? "Working…") : "Reading PDFs…"}
          </span>
        </div>
      ) : null}

      {applyError ? (
        <p className="text-destructive text-sm" role="alert">
          {applyError}
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <section className="flex min-w-0 flex-col gap-2">
            <div className="font-medium text-sm">Files</div>
            <ul
              className="divide-y overflow-y-auto rounded-xl border"
              aria-label="PDF list"
            >
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 bg-background p-3 first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm">
                      {item.file.name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {item.loadError ? (
                        <span className="text-destructive">{item.loadError}</span>
                      ) : item.pageCount === null ? (
                        "Reading…"
                      ) : (
                        `${item.pageCount} page${item.pageCount === 1 ? "" : "s"}`
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={busy}
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs">
              Watermark applies to every page in each PDF. For page-level
              control, use the single-file{" "}
              <Link className="text-primary underline" href="/pdf-watermark">
                PDF Watermark
              </Link>{" "}
              tool.
            </p>

            {skippedFiles.length > 0 ? (
              <div className="mt-2 space-y-2">
                <div className="text-muted-foreground text-xs">
                  Skipped {skippedFiles.length} PDF{skippedFiles.length === 1 ? "" : "s"}:
                </div>
                <div className="space-y-1 text-muted-foreground text-xs">
                  {skippedFiles.slice(0, 5).map((s) => (
                    <div key={s.fileName} className="truncate">
                      {s.fileName}: {s.error}
                    </div>
                  ))}
                  {skippedFiles.length > 5 ? (
                    <div className="truncate">
                      +{skippedFiles.length - 5} more…
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="rounded-xl border bg-background p-4">
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label className="text-sm">Type</Label>
                <Select
                  value={watermarkType}
                  onValueChange={(v) => setWatermarkType(v as WatermarkType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {watermarkType === "text" ? (
                <div
                  key="bulk-watermark-text-fields"
                  className="grid gap-3 rounded-lg border bg-muted/10 p-3"
                >
                  <div className="grid gap-2">
                    <Label className="text-sm">Text</Label>
                    <Input
                      value={wmText ?? ""}
                      onChange={(e) => setWmText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm">Font size</Label>
                      <span className="text-muted-foreground text-xs">
                        {fontSize}
                      </span>
                    </div>
                    <Slider
                      value={[fontSize]}
                      min={10}
                      max={140}
                      step={2}
                      onValueChange={(v) => setFontSize(v[0] ?? 56)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm">Color</Label>
                    <Input
                      type="color"
                      value={colorHex ?? "#000000"}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              ) : (
                <div
                  key="bulk-watermark-image-fields"
                  className="grid gap-3 rounded-lg border bg-muted/10 p-3"
                >
                  <div className="grid gap-2">
                    <Label className="text-sm">Image (PNG/JPG)</Label>
                    <Input
                      key="bulk-watermark-image-file"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setImageFile(f);
                      }}
                    />
                    <div className="text-muted-foreground text-xs">
                      Tip: use a transparent PNG for best results.
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm">Width</Label>
                      <span className="text-muted-foreground text-xs">
                        {imageWidthPercent}%
                      </span>
                    </div>
                    <Slider
                      value={[imageWidthPercent]}
                      min={5}
                      max={90}
                      step={1}
                      onValueChange={(v) => setImageWidthPercent(v[0] ?? 35)}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label className="text-sm">Placement</Label>
                <Select
                  value={placement}
                  onValueChange={(v) => setPlacement(v as WatermarkPlacement)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top-left">Top left</SelectItem>
                    <SelectItem value="top-right">Top right</SelectItem>
                    <SelectItem value="bottom-left">Bottom left</SelectItem>
                    <SelectItem value="bottom-right">Bottom right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Opacity</Label>
                  <span className="text-muted-foreground text-xs">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>
                <Slider
                  value={[Math.round(opacity * 100)]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(v) =>
                    setOpacity(clamp((v[0] ?? 18) / 100, 0.01, 1))
                  }
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Rotation</Label>
                  <span className="text-muted-foreground text-xs">
                    {rotateDeg}°
                  </span>
                </div>
                <Slider
                  value={[rotateDeg]}
                  min={-90}
                  max={90}
                  step={1}
                  onValueChange={(v) => setRotateDeg(v[0] ?? -35)}
                />
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/10 p-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm">Tile</div>
                  <div className="text-muted-foreground text-xs">
                    Repeat the watermark across the page.
                  </div>
                </div>
                <Button
                  type="button"
                  variant={tile ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTile((v) => !v)}
                  aria-pressed={tile}
                >
                  {tile ? "On" : "Off"}
                </Button>
              </div>

              {tile ? (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Tile gap</Label>
                    <span className="text-muted-foreground text-xs">
                      {tileGapPx}px
                    </span>
                  </div>
                  <Slider
                    value={[tileGapPx]}
                    min={0}
                    max={400}
                    step={5}
                    onValueChange={(v) => setTileGapPx(v[0] ?? 120)}
                  />
                </div>
              ) : null}

              <Separator />

              <Button
                type="button"
                variant="default"
                disabled={!canApply}
                onClick={() => void onApplyBulk()}
              >
                <Download className="size-4" aria-hidden />
                Watermark all &amp; download ZIP
              </Button>

              <div className="flex items-start gap-2 rounded-lg border bg-muted/10 p-3 text-muted-foreground text-xs">
                <ImageIcon className="mt-0.5 size-4" aria-hidden />
                <div className="min-w-0">
                  PDFs that fail to load are skipped from the ZIP. Fix or remove
                  them and try again.
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
