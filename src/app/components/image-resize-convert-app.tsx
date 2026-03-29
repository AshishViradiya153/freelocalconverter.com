"use client";

import { Download, Image as ImageIcon, Loader2, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";

import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

type OutputFormat = "webp" | "avif" | "jpeg" | "png";
type ConvertEngine = "auto" | "browser" | "ffmpeg";
type ItemStatus = "queued" | "running" | "done" | "error";

type CropPreset = "none" | "1:1" | "4:3" | "16:9" | "9:16";
type ResizeMode = "none" | "width" | "height" | "fit";
type FitMode = "contain" | "cover";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  error: string | null;
  originalBytes: number;
  outputBytes: number | null;
  outputBlob: Blob | null;
  outputName: string | null;
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

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.[a-z0-9]+$/i, "");
  return leaf || "image";
}

function outputMime(format: OutputFormat) {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  if (format === "avif") return "image/avif";
  return "image/png";
}

function outputExt(format: OutputFormat) {
  if (format === "jpeg") return "jpg";
  return format;
}

function isProbablyImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|avif|gif|bmp|tiff?|ico|heic|heif|svg)$/i.test(
    file.name,
  );
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
) {
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

function isCanvasEncodable(format: OutputFormat) {
  return (
    format === "png" ||
    format === "jpeg" ||
    format === "webp" ||
    format === "avif"
  );
}

function isQualityRelevant(format: OutputFormat) {
  return format === "jpeg" || format === "webp" || format === "avif";
}

function cropRatio(preset: CropPreset): number | null {
  if (preset === "1:1") return 1;
  if (preset === "4:3") return 4 / 3;
  if (preset === "16:9") return 16 / 9;
  if (preset === "9:16") return 9 / 16;
  return null;
}

function computeSourceCrop(args: {
  sw: number;
  sh: number;
  ratio: number | null;
}) {
  if (!args.ratio) return { sx: 0, sy: 0, sWidth: args.sw, sHeight: args.sh };
  const srcRatio = args.sw / args.sh;
  if (srcRatio > args.ratio) {
    const sWidth = Math.round(args.sh * args.ratio);
    const sx = Math.round((args.sw - sWidth) / 2);
    return { sx, sy: 0, sWidth, sHeight: args.sh };
  }
  const sHeight = Math.round(args.sw / args.ratio);
  const sy = Math.round((args.sh - sHeight) / 2);
  return { sx: 0, sy, sWidth: args.sw, sHeight };
}

function computeTargetSize(args: {
  sw: number;
  sh: number;
  resizeMode: ResizeMode;
  width: number;
  height: number;
}) {
  if (args.resizeMode === "none") return { tw: args.sw, th: args.sh };
  if (args.resizeMode === "width") {
    const tw = Math.max(1, Math.round(args.width));
    const th = Math.max(1, Math.round((args.sh / args.sw) * tw));
    return { tw, th };
  }
  if (args.resizeMode === "height") {
    const th = Math.max(1, Math.round(args.height));
    const tw = Math.max(1, Math.round((args.sw / args.sh) * th));
    return { tw, th };
  }
  const tw = Math.max(1, Math.round(args.width));
  const th = Math.max(1, Math.round(args.height));
  return { tw, th };
}

async function ensureFfmpegLoaded(args: {
  ffmpegRef: React.MutableRefObject<null | import("@ffmpeg/ffmpeg").FFmpeg>;
}) {
  if (args.ffmpegRef.current) return args.ffmpegRef.current;

  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);
  const ffmpeg = new FFmpeg();
  const base = `${location.origin}/ffmpeg-core/umd`;
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });
  args.ffmpegRef.current = ffmpeg;
  return ffmpeg;
}

async function encodeWithFfmpeg(args: {
  ffmpeg: import("@ffmpeg/ffmpeg").FFmpeg;
  pngBytes: Uint8Array;
  format: OutputFormat;
  quality: number;
}) {
  const inName = "in.png";
  const outName = `out.${outputExt(args.format)}`;
  await args.ffmpeg.writeFile(inName, args.pngBytes);

  const q = clamp(args.quality, 1, 100);
  const cmd: string[] = ["-hide_banner", "-y", "-i", inName];

  if (args.format === "jpeg") {
    const qscale = clamp(Math.round(31 - (q / 100) * 29), 2, 31);
    cmd.push("-q:v", String(qscale));
  } else if (args.format === "webp") {
    cmd.push("-q:v", String(q));
  } else if (args.format === "avif") {
    const crf = clamp(Math.round(63 - (q / 100) * 55), 8, 63);
    cmd.push("-crf", String(crf));
  }

  cmd.push(outName);
  await args.ffmpeg.exec(cmd);
  const out = (await args.ffmpeg.readFile(outName)) as Uint8Array;
  const outBytes = new Uint8Array(out);
  try {
    await args.ffmpeg.deleteFile(inName);
    await args.ffmpeg.deleteFile(outName);
  } catch {
    // ignore
  }
  return new Blob([outBytes], { type: outputMime(args.format) });
}

async function renderToPngBytes(args: {
  file: File;
  cropPreset: CropPreset;
  resizeMode: ResizeMode;
  fitMode: FitMode;
  width: number;
  height: number;
}) {
  const bitmap = await createImageBitmap(args.file);
  const sw = bitmap.width;
  const sh = bitmap.height;
  if (sw <= 0 || sh <= 0) {
    bitmap.close();
    throw new Error("Could not decode image dimensions.");
  }

  const ratio = cropRatio(args.cropPreset);
  const crop = computeSourceCrop({ sw, sh, ratio });
  const { tw, th } = computeTargetSize({
    sw: crop.sWidth,
    sh: crop.sHeight,
    resizeMode: args.resizeMode,
    width: args.width,
    height: args.height,
  });

  const canvas = createCanvas(tw, th);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize canvas.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (args.resizeMode === "fit") {
    const sx = crop.sx;
    const sy = crop.sy;
    const sWidth = crop.sWidth;
    const sHeight = crop.sHeight;
    const scale =
      args.fitMode === "cover"
        ? Math.max(tw / sWidth, th / sHeight)
        : Math.min(tw / sWidth, th / sHeight);
    const dw = Math.round(sWidth * scale);
    const dh = Math.round(sHeight * scale);
    const dx = Math.round((tw - dw) / 2);
    const dy = Math.round((th - dh) / 2);
    ctx.drawImage(bitmap, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
  } else {
    ctx.drawImage(
      bitmap,
      crop.sx,
      crop.sy,
      crop.sWidth,
      crop.sHeight,
      0,
      0,
      tw,
      th,
    );
  }

  bitmap.close();

  const blob = await canvasToBlob(canvas, "image/png");
  return new Uint8Array(await blob.arrayBuffer());
}

function ImageThumb(props: { url: string }) {
  return (
    <div className="grid size-12 place-items-center overflow-hidden rounded-lg border bg-muted/20 sm:size-14">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {/* biome-ignore lint/performance/noImgElement: object URL thumbnail */}
      <img
        src={props.url}
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}

export function ImageResizeConvertApp() {
  const [items, setItems] = React.useState<ImageItem[]>([]);
  const itemsRef = React.useRef<ImageItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [engineStatus, setEngineStatus] = React.useState<string | null>(null);
  const [engineError, setEngineError] = React.useState<string | null>(null);

  const ffmpegRef = React.useRef<null | import("@ffmpeg/ffmpeg").FFmpeg>(null);

  const [outputFormat, setOutputFormat] = React.useState<OutputFormat>("webp");
  const [engine, setEngine] = React.useState<ConvertEngine>("auto");
  const [quality, setQuality] = React.useState(85);

  const [cropPreset, setCropPreset] = React.useState<CropPreset>("none");
  const [resizeMode, setResizeMode] = React.useState<ResizeMode>("fit");
  const [fitMode, setFitMode] = React.useState<FitMode>("contain");
  const [width, setWidth] = React.useState(1920);
  const [height, setHeight] = React.useState(1080);

  const [nameTemplate, setNameTemplate] = React.useState("{name}-{index}");
  const [startIndex, setStartIndex] = React.useState(1);
  const [pad, setPad] = React.useState(2);

  const hasQueued = items.some((i) => i.status === "queued");

  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  React.useEffect(() => {
    return () => {
      for (const it of itemsRef.current) URL.revokeObjectURL(it.previewUrl);
    };
  }, []);

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setEngineError(null);
    const next: ImageItem[] = [];
    for (const f of Array.from(files)) {
      if (!isProbablyImageFile(f)) continue;
      next.push({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "queued",
        error: null,
        originalBytes: f.size,
        outputBytes: null,
        outputBlob: null,
        outputName: null,
      });
    }
    if (next.length === 0) {
      toast.error("Add image files only.");
      return;
    }
    setItems((prev) => prev.concat(next));
  }

  const buildOutputName = React.useCallback(
    (file: File, index0: number) => {
      const base = baseNameFromFileName(file.name).replace(
        /[/?%*:|"<>\\]/g,
        "-",
      );
      const n = startIndex + index0;
      const idx = String(n).padStart(clamp(pad, 1, 6), "0");
      const stem = (nameTemplate || "{name}-{index}")
        .replaceAll("{name}", base)
        .replaceAll("{index}", idx);
      return `${stem}.${outputExt(outputFormat)}`;
    },
    [startIndex, pad, nameTemplate, outputFormat],
  );

  const convertOne = React.useCallback(
    async (itemId: string, index0: number) => {
      const current = items.find((x) => x.id === itemId);
      if (!current) return;

      setItems((prev) =>
        prev.map((x) =>
          x.id === itemId ? { ...x, status: "running", error: null } : x,
        ),
      );

      try {
        const pngBytes = await renderToPngBytes({
          file: current.file,
          cropPreset,
          resizeMode,
          fitMode,
          width,
          height,
        });

        const selectedEngine: ConvertEngine =
          engine === "auto"
            ? isCanvasEncodable(outputFormat)
              ? "browser"
              : "ffmpeg"
            : engine;

        let blob: Blob;
        if (selectedEngine === "browser") {
          const canvasBlob = new Blob([pngBytes], { type: "image/png" });
          const bitmap = await createImageBitmap(canvasBlob);
          const canvas = createCanvas(bitmap.width, bitmap.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not initialize canvas.");
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          const q01 = clamp(quality / 100, 0.1, 1);
          blob = await canvasToBlob(
            canvas,
            outputMime(outputFormat),
            isQualityRelevant(outputFormat) ? q01 : undefined,
          );
        } else {
          blob = await encodeWithFfmpeg({
            ffmpeg: await ensureFfmpegLoaded({ ffmpegRef }),
            pngBytes,
            format: outputFormat,
            quality,
          });
        }

        const outName = buildOutputName(current.file, index0);
        setItems((prev) =>
          prev.map((x) =>
            x.id === itemId
              ? {
                  ...x,
                  status: "done",
                  outputBlob: blob,
                  outputBytes: blob.size,
                  outputName: outName,
                }
              : x,
          ),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Conversion failed";
        setItems((prev) =>
          prev.map((x) =>
            x.id === itemId ? { ...x, status: "error", error: msg } : x,
          ),
        );
        setEngineError(msg);
      }
    },
    [
      items,
      cropPreset,
      resizeMode,
      fitMode,
      width,
      height,
      engine,
      outputFormat,
      quality,
      buildOutputName,
    ],
  );

  const onConvertAll = React.useCallback(async () => {
    const queue = items.filter((i) => i.status === "queued");
    if (queue.length === 0) return;
    setBusy(true);
    setEngineError(null);
    setEngineStatus("Processing images…");

    try {
      for (let i = 0; i < queue.length; i += 1) {
        await convertOne(queue[i]?.id, i);
      }
      toast.success("Done");
    } finally {
      setBusy(false);
      setEngineStatus(null);
    }
  }, [items, convertOne]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <span className="font-semibold text-sm">IMG</span>
          </div>
          <div className="min-w-0">
            <h1 className={cn(toolHeroTitleClassName, "truncate")}>
              Resize/Crop + Convert
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Local-only</Badge>
          </div>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Bulk resize, center-crop (preset ratios), convert, and bulk rename
          images locally in your browser, no uploads.
        </p>
      </header>

      <FileDropZone
        disabled={busy}
        busy={busy}
        inputId="image-resize-input"
        accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.gif,.bmp,.tif,.tiff,.ico,.heic,.heif,.svg"
        multiple
        onFiles={addFiles}
        fileIcon={ImageIcon}
        dropTitle={
          items.length
            ? "Drop more images or click to add"
            : "Drop images here or click to browse"
        }
        dropHint="Bulk queue · resize/crop/convert · local-only"
        chooseLabel={items.length ? "Add images" : "Choose images"}
        fileHint="Bulk add: PNG, JPG/JPEG, WebP, AVIF, HEIC/HEIF and more. Everything stays on this device."
        size={items.length ? "sm" : "md"}
      />

      {engineStatus ? (
        <div
          className="flex items-center gap-2 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>{engineStatus}</span>
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
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm">Queue</div>
                <Badge variant="outline">{items.length} items</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  disabled={busy || !hasQueued}
                  onClick={() => void onConvertAll()}
                >
                  Convert all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    for (const it of items) URL.revokeObjectURL(it.previewUrl);
                    setItems([]);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Clear all
                </Button>
              </div>
            </div>

            <ul className="max-h-[min(520px,60vh)] divide-y overflow-y-auto rounded-xl border bg-background">
              {items.map((it, idx) => (
                <li key={it.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <ImageThumb url={it.previewUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-sm">
                            {it.file.name}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                it.status === "error"
                                  ? "destructive"
                                  : it.status === "done"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {it.status}
                            </Badge>
                            <Badge variant="outline">
                              {outputFormat.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">#{idx + 1}</Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          disabled={busy}
                          onClick={() => {
                            setItems((prev) => {
                              const target = prev.find((x) => x.id === it.id);
                              if (target)
                                URL.revokeObjectURL(target.previewUrl);
                              return prev.filter((x) => x.id !== it.id);
                            });
                          }}
                          aria-label="Remove"
                        >
                          <X className="size-4" aria-hidden />
                        </Button>
                      </div>

                      {it.error ? (
                        <div className="mt-2 text-destructive text-xs">
                          {it.error}
                        </div>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                        <span>In: {formatBytes(it.originalBytes)}</span>
                        {it.outputBytes ? (
                          <span>Out: {formatBytes(it.outputBytes)}</span>
                        ) : null}
                        {it.outputName ? (
                          <span className="truncate">
                            Name: {it.outputName}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={it.status === "done" ? "default" : "outline"}
                          disabled={!it.outputBlob || !it.outputName}
                          onClick={() => {
                            if (!it.outputBlob || !it.outputName) return;
                            downloadBlob(it.outputBlob, it.outputName);
                          }}
                        >
                          <Download className="size-4" aria-hidden />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="rounded-xl border bg-background p-4 lg:sticky lg:top-20">
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-semibold text-sm">Settings</div>
                <div className="mt-1 text-muted-foreground text-xs">
                  Center-crop uses safe presets (no manual crop UI yet).
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label className="text-sm">Crop</Label>
                  <Select
                    value={cropPreset}
                    onValueChange={(v) => setCropPreset(v as CropPreset)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                      <SelectItem value="16:9">16:9</SelectItem>
                      <SelectItem value="9:16">9:16</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm">Resize</Label>
                  <Select
                    value={resizeMode}
                    onValueChange={(v) => setResizeMode(v as ResizeMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to box</SelectItem>
                      <SelectItem value="width">Width only</SelectItem>
                      <SelectItem value="height">Height only</SelectItem>
                      <SelectItem value="none">No resize</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm">Fit</Label>
                  <Select
                    value={fitMode}
                    onValueChange={(v) => setFitMode(v as FitMode)}
                    disabled={resizeMode !== "fit"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contain">Contain</SelectItem>
                      <SelectItem value="cover">Cover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {resizeMode !== "none" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-sm">Width</Label>
                    <Input
                      inputMode="numeric"
                      value={String(width)}
                      onChange={(e) =>
                        setWidth(Number(e.target.value) || width)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm">Height</Label>
                    <Input
                      inputMode="numeric"
                      value={String(height)}
                      onChange={(e) =>
                        setHeight(Number(e.target.value) || height)
                      }
                    />
                  </div>
                </div>
              ) : null}

              <Separator />

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label className="text-sm">Output</Label>
                  <Select
                    value={outputFormat}
                    onValueChange={(v) => setOutputFormat(v as OutputFormat)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="avif">AVIF</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm">Conversion mode</Label>
                  <Select
                    value={engine}
                    onValueChange={(v) => setEngine(v as ConvertEngine)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Recommended</SelectItem>
                      <SelectItem value="browser">Fast</SelectItem>
                      <SelectItem value="ffmpeg">
                        Works with more formats
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 sm:col-span-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Quality</Label>
                    <span className="text-muted-foreground text-xs">
                      {quality}
                    </span>
                  </div>
                  <Slider
                    value={[quality]}
                    min={40}
                    max={95}
                    step={1}
                    onValueChange={(v) => setQuality(v[0] ?? 85)}
                    disabled={!isQualityRelevant(outputFormat)}
                  />
                </div>
              </div>

              <div className="text-muted-foreground text-xs">
                {isQualityRelevant(outputFormat)
                  ? "Higher quality means larger output files."
                  : "Quality is ignored for this format."}
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label className="text-sm">Bulk rename template</Label>
                <Input
                  value={nameTemplate}
                  onChange={(e) => setNameTemplate(e.target.value)}
                  placeholder="{name}-{index}"
                />
                <div className="text-muted-foreground text-xs">
                  Use{" "}
                  <code className={cn("rounded bg-muted px-1 py-0.5")}>
                    {"{name}"}
                  </code>{" "}
                  and{" "}
                  <code className={cn("rounded bg-muted px-1 py-0.5")}>
                    {"{index}"}
                  </code>
                  .
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label className="text-sm">Start</Label>
                  <Input
                    inputMode="numeric"
                    value={String(startIndex)}
                    onChange={(e) => setStartIndex(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Pad</Label>
                  <Input
                    inputMode="numeric"
                    value={String(pad)}
                    onChange={(e) => setPad(Number(e.target.value) || 2)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Example</Label>
                  <div className="rounded-md border bg-muted/10 px-3 py-2 text-muted-foreground text-xs">
                    {items[0]
                      ? buildOutputName(items[0].file, 0)
                      : `photo-01.${outputExt(outputFormat)}`}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
