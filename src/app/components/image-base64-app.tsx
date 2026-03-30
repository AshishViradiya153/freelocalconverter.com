"use client";

import { Copy, Download, FileImage, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/download-blob";

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message || "Error";
  if (typeof error === "string") return error;
  return "Unknown error";
}

function guessExtFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "bin";
}

export function ImageBase64App() {
  const [dataUrl, setDataUrl] = React.useState("");
  const [decodeInput, setDecodeInput] = React.useState("");
  const [decodePreviewUrl, setDecodePreviewUrl] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    return () => {
      if (decodePreviewUrl) URL.revokeObjectURL(decodePreviewUrl);
    };
  }, [decodePreviewUrl]);

  const onFile = React.useCallback((list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setDataUrl(r);
    };
    reader.onerror = () => toast.error("Could not read file.");
    reader.readAsDataURL(file);
  }, []);

  const onCopyDataUrl = React.useCallback(async () => {
    if (!dataUrl.trim()) {
      toast.error("Nothing to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(dataUrl);
      toast.success("Copied data URL.");
    } catch (e) {
      toast.error(errorToMessage(e));
    }
  }, [dataUrl]);

  const onDecode = React.useCallback(() => {
    const raw = decodeInput.trim();
    if (!raw) {
      toast.error("Paste a data URL or raw Base64.");
      return;
    }

    let b64 = raw;
    let mime = "application/octet-stream";

    const dataUrlMatch = raw.match(/^data:([^;]+);base64,(.+)$/is);
    if (dataUrlMatch) {
      mime = dataUrlMatch[1] ?? mime;
      b64 = dataUrlMatch[2] ?? "";
    } else {
      b64 = raw.replace(/\s/g, "");
    }

    try {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      if (decodePreviewUrl) URL.revokeObjectURL(decodePreviewUrl);
      const url = URL.createObjectURL(blob);
      setDecodePreviewUrl(url);
      if (mime.startsWith("image/")) toast.success("Decoded image ready.");
      else toast.success("Decoded binary — download to inspect.");
    } catch {
      toast.error("Invalid Base64.");
    }
  }, [decodeInput, decodePreviewUrl]);

  const onDownloadDecoded = React.useCallback(async () => {
    if (!decodePreviewUrl) return;
    const raw = decodeInput.trim();
    let mime = "application/octet-stream";
    const m = raw.match(/^data:([^;]+);base64,/i);
    if (m) mime = m[1] ?? mime;
    const ext = guessExtFromMime(mime);
    try {
      const b = await fetch(decodePreviewUrl).then((r) => r.blob());
      downloadBlob(b, `decoded.${ext}`);
    } catch {
      toast.error("Download failed.");
    }
  }, [decodeInput, decodePreviewUrl]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <FileImage className="size-5" aria-hidden />
          </div>
          <h1 className={toolHeroTitleClassName}>Image → Base64</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Turn an image into a data URL or raw Base64 for CSS, HTML, or JSON —
          and decode a data URL back to a file. Everything runs in your browser.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <h2 className="font-semibold text-sm tracking-tight">Encode</h2>
        <FileDropZone
          disabled={false}
          busy={false}
          inputId="image-b64-encode"
          accept="image/*"
          multiple={false}
          onFiles={onFile}
          fileIcon={(p) => <FileImage {...p} />}
          dropTitle="Drop an image or click to browse"
          dropHint="PNG, JPG, WebP, GIF, SVG…"
          chooseLabel="Choose image"
          fileHint="Output appears as a data URL below"
          size="md"
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm">Data URL</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={!dataUrl}
              onClick={() => void onCopyDataUrl()}
            >
              <Copy className="size-3.5" aria-hidden />
              Copy
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!dataUrl}
              onClick={() => setDataUrl("")}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Clear
            </Button>
          </div>
          <Textarea
            value={dataUrl}
            readOnly
            placeholder="data:image/png;base64,…"
            className="min-h-[120px] font-mono text-xs"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <h2 className="font-semibold text-sm tracking-tight">Decode</h2>
        <p className="text-muted-foreground text-xs">
          Paste a full{" "}
          <code className="rounded bg-muted px-1">data:image/…;base64,…</code>{" "}
          URL or raw Base64 (you can set download type from the data URL
          prefix).
        </p>
        <Textarea
          value={decodeInput}
          onChange={(e) => setDecodeInput(e.target.value)}
          placeholder="data:image/png;base64,iVBORw0KGgo..."
          className="min-h-[120px] font-mono text-xs"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onDecode}>
            Decode
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!decodePreviewUrl}
            onClick={onDownloadDecoded}
            className="gap-2"
          >
            <Download className="size-4" aria-hidden />
            Download file
          </Button>
        </div>
        {decodePreviewUrl ? (
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Preview</Label>
            {/* biome-ignore lint/performance/noImgElement: blob URL decoded preview */}
            <img
              src={decodePreviewUrl}
              alt="Decoded preview"
              className="max-h-64 max-w-full rounded-md border object-contain"
              onError={() => {
                /* non-image binary */
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
