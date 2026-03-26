"use client";

import {
  Download,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Button } from "@/components/ui/button";
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

type OutputFormat = "auto" | "webp" | "avif" | "jpeg" | "png";
type ItemStatus = "idle" | "fetching" | "queued" | "running" | "done" | "error";

interface ImageItem {
  id: string;
  sourceLabel: string;
  file: File | null;
  status: ItemStatus;
  progress: number | null;
  error: string | null;
  originalBytes: number | null;
  outputBytes: number | null;
  outputBlob: Blob | null;
  outputName: string | null;
  selectedFormat: Exclude<OutputFormat, "auto"> | null;
  ssim: number | null;
}

interface EncodedCandidate {
  format: Exclude<OutputFormat, "auto">;
  blob: Blob;
  ssim: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatBytes(bytes: number) {
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"] as const;
  let v = bytes / k;
  let i = 0;
  while (v >= k && i < units.length - 1) {
    v /= k;
    i += 1;
  }
  const unit = units[i] ?? "KB";
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${unit}`;
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

function safeNameFromUrl(url: string) {
  try {
    const u = new URL(url);
    const leaf = u.pathname.split("/").filter(Boolean).pop() ?? "image";
    const base = leaf.replace(/[/?%*:|"<>\\]/g, "-").slice(0, 80) || "image";
    return /\.(png|jpe?g|webp|avif|gif|bmp|tiff?)$/i.test(base) ? base : `${base}.png`;
  } catch {
    return "image.png";
  }
}

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.[a-z0-9]+$/i, "");
  return leaf || "image";
}

function isProbablyImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|avif|gif|bmp|tiff?)$/i.test(file.name);
}

function outputMime(format: Exclude<OutputFormat, "auto">) {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  if (format === "avif") return "image/avif";
  return "image/png";
}

function outputExt(format: Exclude<OutputFormat, "auto">) {
  if (format === "jpeg") return "jpg";
  return format;
}

function toLuma(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calcSsimLuma(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  const c1 = 6.5025;
  const c2 = 58.5225;
  const n = a.length / 4;

  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < a.length; i += 4) {
    const ar = a[i] ?? 0;
    const ag = a[i + 1] ?? 0;
    const ab = a[i + 2] ?? 0;
    const br = b[i] ?? 0;
    const bg = b[i + 1] ?? 0;
    const bb = b[i + 2] ?? 0;
    meanA += toLuma(ar, ag, ab);
    meanB += toLuma(br, bg, bb);
  }
  meanA /= n;
  meanB /= n;

  let varA = 0;
  let varB = 0;
  let covAB = 0;
  for (let i = 0; i < a.length; i += 4) {
    const ar = a[i] ?? 0;
    const ag = a[i + 1] ?? 0;
    const ab = a[i + 2] ?? 0;
    const br = b[i] ?? 0;
    const bg = b[i + 1] ?? 0;
    const bb = b[i + 2] ?? 0;
    const la = toLuma(ar, ag, ab) - meanA;
    const lb = toLuma(br, bg, bb) - meanB;
    varA += la * la;
    varB += lb * lb;
    covAB += la * lb;
  }

  const denom = n - 1;
  if (denom > 0) {
    varA /= denom;
    varB /= denom;
    covAB /= denom;
  }

  const num = (2 * meanA * meanB + c1) * (2 * covAB + c2);
  const den = (meanA * meanA + meanB * meanB + c1) * (varA + varB + c2);
  return den === 0 ? 0 : num / den;
}

function hasAnyAlpha(data: Uint8ClampedArray) {
  for (let i = 3; i < data.length; i += 4) {
    if ((data[i] ?? 255) < 255) return true;
  }
  return false;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Your browser could not encode ${mimeType}`));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

async function decodeBitmap(blob: Blob) {
  return createImageBitmap(blob);
}

async function encodeCandidate(args: {
  sourceCanvas: HTMLCanvasElement;
  format: Exclude<OutputFormat, "auto">;
  quality: number;
}) {
  const mimeType = outputMime(args.format);
  const quality01 = clamp(args.quality / 100, 0.1, 1);
  const blob = await canvasToBlob(
    args.sourceCanvas,
    mimeType,
    args.format === "png" ? undefined : quality01,
  );
  return blob;
}

function resolveCompareSize(width: number, height: number, maxPixels = 1_200_000) {
  const px = width * height;
  if (px <= maxPixels) return { width, height };
  const scale = Math.sqrt(maxPixels / px);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

function ImageFileGlyph(props: { className?: string; "aria-hidden"?: boolean }) {
  return <ImageIcon className={props.className} aria-hidden={props["aria-hidden"]} />;
}

export function ImageCompressApp() {
  const [items, setItems] = React.useState<ImageItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [engineStatus, setEngineStatus] = React.useState<null | { phase: string }>(
    null,
  );
  const [engineError, setEngineError] = React.useState<string | null>(null);

  const [linkInput, setLinkInput] = React.useState("");
  const [format, setFormat] = React.useState<OutputFormat>("auto");
  const [quality, setQuality] = React.useState(75);
  const [minSsim, setMinSsim] = React.useState(985);

  const hasQueued = items.some((item) => item.status === "queued" && item.file);

  const onAddFiles = React.useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const next = Array.from(files).filter(isProbablyImageFile);
    if (next.length === 0) {
      toast.error("Add image files only.");
      return;
    }

    setItems((prev) => [
      ...prev,
      ...next.map((file) => ({
        id: crypto.randomUUID(),
        sourceLabel: "upload",
        file,
        status: "queued" as const,
        progress: null,
        error: null,
        originalBytes: file.size,
        outputBytes: null,
        outputBlob: null,
        outputName: null,
        selectedFormat: null,
        ssim: null,
      })),
    ]);
  }, []);

  const onRemoveItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const onClearAll = React.useCallback(() => {
    setItems([]);
  }, []);

  const onAddLink = React.useCallback(async () => {
    const url = linkInput.trim();
    if (!url) return;

    setBusy(true);
    setEngineError(null);
    setEngineStatus({ phase: "Fetching image from link…" });

    const id = crypto.randomUUID();
    setItems((prev) => [
      {
        id,
        sourceLabel: "link",
        file: null,
        status: "fetching",
        progress: null,
        error: null,
        originalBytes: null,
        outputBytes: null,
        outputBlob: null,
        outputName: safeNameFromUrl(url),
        selectedFormat: null,
        ssim: null,
      },
      ...prev,
    ]);

    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const name = safeNameFromUrl(url);
      const file = new File([blob], name, { type: blob.type || "image/png" });

      if (!isProbablyImageFile(file)) {
        throw new Error("The link did not return a supported image file.");
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              file,
              status: "queued",
              originalBytes: file.size,
              error: null,
            }
            : item,
        ),
      );
      setLinkInput("");
    } catch (error) {
      const msg = errorToMessage(error);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "error", error: msg } : item,
        ),
      );
      toast.error("Could not fetch that link. Some hosts block CORS access.");
    } finally {
      setBusy(false);
      setEngineStatus(null);
    }
  }, [linkInput]);

  const compressOne = React.useCallback(
    async (id: string) => {
      const current = items.find((item) => item.id === id) ?? null;
      const file = current?.file ?? null;
      if (!file) return;

      setBusy(true);
      setEngineError(null);
      setEngineStatus({ phase: `Compressing ${file.name}…` });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "running", progress: 0.05, error: null }
            : item,
        ),
      );

      try {
        const sourceBitmap = await decodeBitmap(file);
        const sourceWidth = sourceBitmap.width;
        const sourceHeight = sourceBitmap.height;
        if (sourceWidth <= 0 || sourceHeight <= 0) {
          sourceBitmap.close();
          throw new Error("Could not decode image dimensions.");
        }

        const sourceCanvas = createCanvas(sourceWidth, sourceHeight);
        const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
        if (!sourceCtx) throw new Error("Could not initialize image canvas");
        sourceCtx.drawImage(sourceBitmap, 0, 0);
        sourceBitmap.close();

        const compareSize = resolveCompareSize(sourceWidth, sourceHeight);
        const compareSourceCanvas = createCanvas(compareSize.width, compareSize.height);
        const compareSourceCtx = compareSourceCanvas.getContext("2d", {
          willReadFrequently: true,
        });
        if (!compareSourceCtx) throw new Error("Could not initialize compare canvas");
        compareSourceCtx.drawImage(sourceCanvas, 0, 0, compareSize.width, compareSize.height);
        const sourceRgba = compareSourceCtx.getImageData(
          0,
          0,
          compareSize.width,
          compareSize.height,
        ).data;
        const hasAlpha = hasAnyAlpha(sourceRgba);

        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, progress: 0.3 } : item,
          ),
        );

        const ladder = [
          quality,
          clamp(quality - 10, 40, 95),
          clamp(quality - 20, 35, 95),
          clamp(quality - 30, 30, 95),
        ];

        const candidates: Array<{ format: Exclude<OutputFormat, "auto">; quality: number }> = [];
        if (format === "auto") {
          for (const q of ladder) {
            candidates.push({ format: "webp", quality: q });
            candidates.push({ format: "avif", quality: q });
            if (!hasAlpha) candidates.push({ format: "jpeg", quality: q });
          }
          candidates.push({ format: "png", quality: 100 });
        } else {
          candidates.push({ format, quality });
        }

        const targetSsim = minSsim / 1000;
        let best: EncodedCandidate | null = null;
        let fallback: EncodedCandidate | null = null;
        let processed = 0;

        for (const candidate of candidates) {
          try {
            const blob = await encodeCandidate({
              sourceCanvas,
              format: candidate.format,
              quality: candidate.quality,
            });

            const encodedBitmap = await decodeBitmap(blob);
            const compareEncodedCanvas = createCanvas(compareSize.width, compareSize.height);
            const compareEncodedCtx = compareEncodedCanvas.getContext("2d", {
              willReadFrequently: true,
            });
            if (!compareEncodedCtx) throw new Error("Could not compare output image");
            compareEncodedCtx.drawImage(encodedBitmap, 0, 0, compareSize.width, compareSize.height);
            encodedBitmap.close();
            const encodedRgba = compareEncodedCtx.getImageData(
              0,
              0,
              compareSize.width,
              compareSize.height,
            ).data;
            const ssim = calcSsimLuma(sourceRgba, encodedRgba);
            const currentCandidate: EncodedCandidate = { format: candidate.format, blob, ssim };

            if (!fallback || currentCandidate.ssim > fallback.ssim) fallback = currentCandidate;
            if (ssim >= targetSsim) {
              if (!best || blob.size < best.blob.size) best = currentCandidate;
            }
          } catch {
            // Skip unsupported encoders for the current browser/platform.
          } finally {
            processed += 1;
            const progress = 0.3 + (processed / Math.max(candidates.length, 1)) * 0.65;
            setItems((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, progress } : item,
              ),
            );
          }
        }

        const selected = best ?? fallback;
        if (!selected) {
          throw new Error("No image encoder was available in this browser.");
        }

        const base = baseNameFromFileName(file.name).replace(/[/?%*:|"<>\\]/g, "-");
        const ext = outputExt(selected.format);
        const outName = `${base}-compressed.${ext}`;

        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                ...item,
                status: "done",
                progress: 1,
                outputBlob: selected.blob,
                outputBytes: selected.blob.size,
                outputName: outName,
                selectedFormat: selected.format,
                ssim: selected.ssim,
              }
              : item,
          ),
        );

        toast.success(`Compressed: ${file.name}`);
      } catch (error) {
        const msg = errorToMessage(error);
        setEngineError(msg);
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "error", error: msg } : item,
          ),
        );
        toast.error(msg);
      } finally {
        setBusy(false);
        setEngineStatus(null);
      }
    },
    [format, items, minSsim, quality],
  );

  const onCompressAll = React.useCallback(async () => {
    const queue = items.filter((item) => item.status === "queued" && item.file);
    if (queue.length === 0) return;
    for (const item of queue) {
      await compressOne(item.id);
    }
  }, [compressOne, items]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <span className="font-semibold text-sm">IMG</span>
          </div>
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
            Image Compressor
          </h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Compress images locally in your browser. Upload many files or paste a
          direct link, then download smaller outputs.
        </p>
      </header>

      <div className="grid gap-3 rounded-xl border bg-background p-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm">Add by link</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={linkInput}
              onChange={(event) => setLinkInput(event.target.value)}
              placeholder="https://example.com/image.png"
              inputMode="url"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void onAddLink()}
              disabled={busy || !linkInput.trim()}
              className="sm:w-40"
            >
              <LinkIcon className="size-4" aria-hidden />
              Add link
            </Button>
          </div>
          <div className="text-muted-foreground text-xs">
            Works only if the host allows browser downloads (CORS). If it fails,
            download the image first, then upload it here.
          </div>
        </div>
      </div>

      <FileDropZone
        disabled={busy}
        busy={busy}
        inputId="image-compress-input"
        accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.gif,.bmp,.tif,.tiff"
        multiple
        onFiles={onAddFiles}
        fileIcon={ImageFileGlyph}
        dropTitle={items.length ? "Drop more images or click to add" : "Drop images here or click to browse"}
        dropHint="Bulk queue · local-only compression"
        chooseLabel={items.length ? "Add images" : "Choose images"}
        fileHint="Compression happens locally in your browser."
        size={items.length ? "sm" : "md"}
      />

      {engineStatus ? (
        <div
          className="flex items-center gap-2 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>{engineStatus.phase}</span>
        </div>
      ) : null}

      {engineError ? (
        <p className="text-destructive text-sm" role="alert">
          {engineError}
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <section className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium text-sm">Queue</div>
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
            </div>

            <ul className="max-h-[min(460px,55vh)] divide-y overflow-y-auto rounded-xl border">
              {items.map((item) => {
                const outName = item.outputName ?? "compressed.webp";
                const savings =
                  item.originalBytes && item.outputBytes
                    ? Math.max(0, (item.originalBytes - item.outputBytes) / item.originalBytes)
                    : null;

                return (
                  <li key={item.id} className="flex items-start gap-3 bg-background p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-medium text-sm">
                          {item.file?.name ?? outName}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          disabled={busy}
                          onClick={() => onRemoveItem(item.id)}
                          aria-label="Remove"
                        >
                          <X className="size-4" aria-hidden />
                        </Button>
                      </div>

                      <div className="text-muted-foreground text-xs">
                        {item.status === "fetching"
                          ? "Fetching…"
                          : item.status === "queued"
                            ? "Ready"
                            : item.status === "running"
                              ? `Compressing… ${Math.round((item.progress ?? 0) * 100)}%`
                              : item.status === "done"
                                ? "Done"
                                : item.status === "error"
                                  ? `Error: ${item.error ?? "Failed"}`
                                  : "Idle"}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                        {item.originalBytes ? <span>In: {formatBytes(item.originalBytes)}</span> : null}
                        {item.outputBytes ? <span>Out: {formatBytes(item.outputBytes)}</span> : null}
                        {savings != null && item.outputBytes ? (
                          <span>Saved: {Math.round(savings * 100)}%</span>
                        ) : null}
                        {item.selectedFormat ? <span>Format: {item.selectedFormat}</span> : null}
                        {item.ssim ? <span>SSIM: {item.ssim.toFixed(4)}</span> : null}
                      </div>

                      {item.status === "running" ? (
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-[width]"
                            style={{ width: `${Math.round((item.progress ?? 0) * 100)}%` }}
                          />
                        </div>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busy || item.status !== "queued" || !item.file}
                          onClick={() => void compressOne(item.id)}
                        >
                          Compress
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!item.outputBlob || !item.outputName}
                          onClick={() => {
                            if (!item.outputBlob || !item.outputName) return;
                            downloadBlob(item.outputBlob, item.outputName);
                          }}
                        >
                          <Download className="size-4" aria-hidden />
                          Download
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="rounded-xl border bg-background p-4">
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label className="text-sm">Output format</Label>
                <Select value={format} onValueChange={(value) => setFormat(value as OutputFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (smallest that looks good)</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Base quality</Label>
                  <span className="text-muted-foreground text-xs">{quality}</span>
                </div>
                <Slider
                  value={[quality]}
                  min={40}
                  max={95}
                  step={1}
                  onValueChange={(value) => setQuality(value[0] ?? 75)}
                />
                <div className="text-muted-foreground text-xs">
                  Higher quality means larger output files.
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Min visual score (SSIM)</Label>
                  <span className="text-muted-foreground text-xs">
                    {(minSsim / 1000).toFixed(3)}
                  </span>
                </div>
                <Slider
                  value={[minSsim]}
                  min={960}
                  max={998}
                  step={1}
                  onValueChange={(value) => setMinSsim(value[0] ?? 985)}
                />
                <div className="text-muted-foreground text-xs">
                  Used when format is Auto to keep quality close to the source.
                </div>
              </div>

              <Separator />

              <Button type="button" disabled={busy || !hasQueued} onClick={() => void onCompressAll()}>
                Compress all
              </Button>

              <div className="text-muted-foreground text-xs">
                Runs 100% in your browser. AVIF support depends on your browser.
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
