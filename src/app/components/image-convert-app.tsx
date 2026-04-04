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
import { clamp } from "@/lib/clamp";
import { downloadBlob } from "@/lib/download-blob";
import {
  type SvgTracePreset,
  traceRasterCanvasToSvg,
} from "@/lib/image/raster-to-svg";
import { cn } from "@/lib/utils";

type OutputFormat =
  | "webp"
  | "avif"
  | "jpeg"
  | "png"
  | "gif"
  | "bmp"
  | "tiff"
  | "ico"
  | "svg";
type ConvertEngine = "auto" | "browser" | "ffmpeg";
type ItemStatus = "idle" | "fetching" | "queued" | "running" | "done" | "error";

interface ImageConvertAppProps {
  title?: string;
  subtitle?: string;
  inputId?: string;
  accept?: string;
  dropTitleEmpty?: string;
  dropTitleHasItems?: string;
  dropHint?: string;
  fileHint?: string;
  allowedFormats?: OutputFormat[];
  initialFormat?: OutputFormat;
  initialEngine?: ConvertEngine;
}

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
    return /\.(png|jpe?g|webp|avif|gif|bmp|tiff?|ico|heic|heif|svg)$/i.test(
      base,
    )
      ? base
      : `${base}.png`;
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
  return /\.(png|jpe?g|webp|avif|gif|bmp|tiff?|ico|heic|heif|svg)$/i.test(
    file.name,
  );
}

function outputMime(format: OutputFormat) {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  if (format === "avif") return "image/avif";
  if (format === "gif") return "image/gif";
  if (format === "bmp") return "image/bmp";
  if (format === "tiff") return "image/tiff";
  if (format === "ico") return "image/x-icon";
  if (format === "svg") return "image/svg+xml";
  return "image/png";
}

function outputExt(format: OutputFormat) {
  if (format === "jpeg") return "jpg";
  if (format === "tiff") return "tif";
  if (format === "svg") return "svg";
  return format;
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

async function decodeBitmap(blob: Blob) {
  return createImageBitmap(blob);
}

function isHeicFile(file: File) {
  if (file.type === "image/heic" || file.type === "image/heif") return true;
  return /\.(heic|heif)$/i.test(file.name);
}

function isSvgFile(file: File) {
  if (file.type === "image/svg+xml") return true;
  return /\.svg$/i.test(file.name);
}

async function decodeToRgbaCanvas(file: File) {
  if (isHeicFile(file)) {
    const mod = await import("heic-decode");
    const decode = (mod as unknown as { default?: unknown }).default ?? mod;
    const buf = await file.arrayBuffer();
    const u8 = new Uint8Array(buf);
    const { width, height, data } = await (
      decode as (args: { buffer: Uint8Array }) => Promise<{
        width: number;
        height: number;
        data: Uint8ClampedArray;
      }>
    )({ buffer: u8 });

    if (!width || !height)
      throw new Error("Could not decode HEIC image dimensions.");
    const rgba = new Uint8ClampedArray(data);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not initialize canvas.");
    ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
    return canvas;
  }

  const sourceBitmap = await decodeBitmap(file);
  const sourceWidth = sourceBitmap.width;
  const sourceHeight = sourceBitmap.height;
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    sourceBitmap.close();
    throw new Error("Could not decode image dimensions.");
  }

  const canvas = createCanvas(sourceWidth, sourceHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize canvas.");
  ctx.drawImage(sourceBitmap, 0, 0);
  sourceBitmap.close();
  return canvas;
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

async function ensureFfmpegLoaded(args: {
  ffmpegRef: React.MutableRefObject<null | import("@ffmpeg/ffmpeg").FFmpeg>;
}) {
  if (args.ffmpegRef.current) return args.ffmpegRef.current;

  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);

  const ffmpeg = new FFmpeg();
  try {
    const base = `${location.origin}/ffmpeg-core/umd`;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
  } catch (error) {
    const msg = errorToMessage(error);
    throw new Error(
      `Could not start the advanced conversion mode on this device. ${msg}. If you're running behind a strict CSP/adblocker, allow loading from this site origin.`,
    );
  }

  args.ffmpegRef.current = ffmpeg;
  return ffmpeg;
}

async function convertImageBrowser(args: {
  file: File;
  format: OutputFormat;
  quality: number;
}) {
  if (!isCanvasEncodable(args.format)) {
    throw new Error(`Fast mode can't encode ${args.format.toUpperCase()}.`);
  }
  const canvas = await decodeToRgbaCanvas(args.file);

  const mimeType = outputMime(args.format);
  const quality01 = clamp(args.quality / 100, 0.1, 1);
  const blob = await canvasToBlob(
    canvas,
    mimeType,
    isQualityRelevant(args.format) ? quality01 : undefined,
  );
  return blob;
}

/**
 * Raster → SVG via real vector tracing (paths), local-only.
 * Existing SVG files are passed through as UTF-8 text.
 */
async function convertImageToSvg(
  file: File,
  svgPreset: SvgTracePreset,
): Promise<Blob> {
  if (isSvgFile(file)) {
    const text = await file.text();
    const trimmed = text.trim();
    if (!trimmed.startsWith("<")) {
      throw new Error("This file doesn't look like SVG markup.");
    }
    return new Blob([text], { type: "image/svg+xml;charset=utf-8" });
  }

  const canvas = await decodeToRgbaCanvas(file);
  const svg = await traceRasterCanvasToSvg(canvas, { preset: svgPreset });
  return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
}

async function convertImageFfmpeg(args: {
  ffmpeg: import("@ffmpeg/ffmpeg").FFmpeg;
  file: File;
  format: OutputFormat;
  quality: number;
}) {
  const { fetchFile } = await import("@ffmpeg/util");
  const nameExt = args.file.name
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const mimeExt =
    args.file.type === "image/heic"
      ? "heic"
      : args.file.type === "image/heif"
        ? "heif"
        : null;
  const inExt = mimeExt ?? nameExt ?? "bin";
  const runId = crypto.randomUUID();
  const inName = `in-${runId}.${inExt}`;
  const outExt = outputExt(args.format);
  const outName = `out-${runId}.${outExt}`;

  let wroteInput = false;
  let wroteOutput = false;
  try {
    const data = await fetchFile(args.file);
    await args.ffmpeg.writeFile(inName, data);
    wroteInput = true;

    const q = clamp(args.quality, 1, 100);
    const argsList: string[] = ["-hide_banner", "-y", "-i", inName];

    if (args.format === "jpeg") {
      // ffmpeg jpeg: 2 (best) .. 31 (worst)
      const qscale = clamp(Math.round(31 - (q / 100) * 29), 2, 31);
      argsList.push("-q:v", String(qscale));
    } else if (args.format === "webp") {
      // libwebp: 0..100
      argsList.push("-q:v", String(q));
    } else if (args.format === "avif") {
      // libaom-av1 / svt-av1 behavior varies; try CRF-ish mapping
      const crf = clamp(Math.round(63 - (q / 100) * 55), 8, 63);
      argsList.push("-crf", String(crf));
    } else if (args.format === "gif") {
      // Basic gif encode (keeps it simple; palette mode could be added later)
      argsList.push("-loop", "0");
    } else if (args.format === "ico") {
      // Common ICO size; ffmpeg will scale.
      argsList.push("-vf", "scale=256:256:flags=lanczos");
    }

    argsList.push(outName);
    await args.ffmpeg.exec(argsList);
    wroteOutput = true;

    const out = (await args.ffmpeg.readFile(outName)) as Uint8Array;
    const outBytes = new Uint8Array(out);

    return new Blob([outBytes], { type: outputMime(args.format) });
  } catch (error) {
    const msg = errorToMessage(error);
    // A common failure mode is that ffmpeg didn't generate the expected output file,
    // which surfaces as an FS error when reading it.
    throw new Error(
      `Could not convert "${args.file.name}" to ${args.format.toUpperCase()} in “works with more formats” mode. ${msg}`,
    );
  } finally {
    // best-effort cleanup
    try {
      if (wroteInput) await args.ffmpeg.deleteFile(inName);
      if (wroteOutput) await args.ffmpeg.deleteFile(outName);
    } catch {
      // ignore
    }
  }
}

function ImageFileGlyph(props: {
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <ImageIcon className={props.className} aria-hidden={props["aria-hidden"]} />
  );
}

function statusBadgeVariant(
  status: ItemStatus,
): React.ComponentProps<typeof Badge>["variant"] {
  if (status === "done") return "secondary";
  if (status === "error") return "destructive";
  if (status === "running" || status === "fetching") return "default";
  return "outline";
}

function statusLabel(status: ItemStatus) {
  if (status === "fetching") return "Fetching";
  if (status === "queued") return "Ready";
  if (status === "running") return "Converting";
  if (status === "done") return "Done";
  if (status === "error") return "Error";
  return "Idle";
}

function ImageThumb(props: { file: File | null; label: string }) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [isDecoding, setIsDecoding] = React.useState(false);

  React.useEffect(() => {
    const fileOrNull = props.file;
    if (!fileOrNull) {
      setUrl(null);
      return;
    }

    let cancelled = false;
    let revokeUrl: string | null = null;

    async function run(file: File) {
      try {
        setIsDecoding(isHeicFile(file));

        if (isHeicFile(file)) {
          const canvas = await decodeToRgbaCanvas(file);
          const blob = await canvasToBlob(canvas, "image/png");
          const next = URL.createObjectURL(blob);
          revokeUrl = next;
          if (!cancelled) setUrl(next);
          return;
        }

        const next = URL.createObjectURL(file);
        revokeUrl = next;
        if (!cancelled) setUrl(next);
      } catch {
        if (!cancelled) setUrl(null);
      } finally {
        if (!cancelled) setIsDecoding(false);
      }
    }

    void run(fileOrNull);

    return () => {
      cancelled = true;
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [props.file]);

  return (
    <div className="grid size-12 place-items-center overflow-hidden rounded-lg border bg-muted/20 sm:size-14">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        // biome-ignore lint/performance/noImgElement: object URL preview from local file
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span className="text-muted-foreground text-xs">
          {isDecoding ? "HEIC" : props.label}
        </span>
      )}
    </div>
  );
}

export function ImageConvertApp(props: ImageConvertAppProps) {
  const [items, setItems] = React.useState<ImageItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [engineStatus, setEngineStatus] = React.useState<null | {
    phase: string;
  }>(null);
  const [engineError, setEngineError] = React.useState<string | null>(null);
  const ffmpegRef = React.useRef<null | import("@ffmpeg/ffmpeg").FFmpeg>(null);

  const [linkInput, setLinkInput] = React.useState("");
  const allowedFormats = React.useMemo(
    () =>
      props.allowedFormats ?? [
        "webp",
        "avif",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "tiff",
        "ico",
        "svg",
      ],
    [props.allowedFormats],
  );

  const [format, setFormat] = React.useState<OutputFormat>(() => {
    const initial = (props.initialFormat ?? "webp") as OutputFormat;
    return allowedFormats.includes(initial)
      ? initial
      : ((allowedFormats[0] ?? "webp") as OutputFormat);
  });
  const [quality, setQuality] = React.useState(85);
  const [svgTracePreset, setSvgTracePreset] =
    React.useState<SvgTracePreset>("balanced");
  const [engine, setEngine] = React.useState<ConvertEngine>(
    props.initialEngine ?? "auto",
  );

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

  const convertOne = React.useCallback(
    async (id: string) => {
      const current = items.find((item) => item.id === id) ?? null;
      const file = current?.file ?? null;
      if (!file) return;

      setBusy(true);
      setEngineError(null);
      setEngineStatus({ phase: `Converting ${file.name}…` });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "running", progress: 0.1 } : item,
        ),
      );

      try {
        const blob =
          format === "svg"
            ? await convertImageToSvg(file, svgTracePreset)
            : await (async () => {
                const selectedEngine: ConvertEngine =
                  isHeicFile(file) && isCanvasEncodable(format)
                    ? "browser"
                    : engine === "auto"
                      ? isCanvasEncodable(format)
                        ? "browser"
                        : "ffmpeg"
                      : engine;

                if (selectedEngine === "browser") {
                  return convertImageBrowser({ file, format, quality });
                }
                return convertImageFfmpeg({
                  ffmpeg: await ensureFfmpegLoaded({ ffmpegRef }),
                  file,
                  format,
                  quality,
                });
              })();

        const base = baseNameFromFileName(file.name).replace(
          /[/?%*:|"<>\\]/g,
          "-",
        );
        const ext = outputExt(format);
        const outName = `${base}.${ext}`;

        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "done",
                  progress: 1,
                  outputBlob: blob,
                  outputBytes: blob.size,
                  outputName: outName,
                  error: null,
                }
              : item,
          ),
        );
        toast.success(`Converted: ${file.name}`);
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
    [engine, format, items, quality, svgTracePreset],
  );

  const onConvertAll = React.useCallback(async () => {
    const queue = items.filter((item) => item.status === "queued" && item.file);
    if (queue.length === 0) return;
    for (const item of queue) {
      await convertOne(item.id);
    }
  }, [convertOne, items]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <span className="font-semibold text-sm">IMG</span>
          </div>
          <div className="min-w-0 overflow-hidden">
            <h1 className={cn(toolHeroTitleClassName, "whitespace-nowrap text-ellipsis pb-1")}>
              {props.title ?? "Image Converter"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Local-only</Badge>
          </div>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          {props.subtitle ??
            "Convert images locally in your browser. Upload many files or paste a direct link, choose an output format, then download, no uploads."}
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
        inputId={props.inputId ?? "image-convert-input"}
        accept={
          props.accept ??
          "image/*,.png,.jpg,.jpeg,.webp,.avif,.gif,.bmp,.tif,.tiff,.ico,.heic,.heif,.svg"
        }
        multiple
        onFiles={onAddFiles}
        fileIcon={ImageFileGlyph}
        dropTitle={
          items.length
            ? (props.dropTitleHasItems ?? "Drop more images or click to add")
            : (props.dropTitleEmpty ?? "Drop images here or click to browse")
        }
        dropHint={
          props.dropHint ??
          "Bulk queue · local-only conversion · PNG/JPG/WebP/AVIF/GIF/BMP/TIFF/ICO/HEIC/SVG"
        }
        chooseLabel={items.length ? "Add images" : "Choose images"}
        fileHint={
          props.fileHint ??
          "Local-only conversion. Bulk add: PNG, JPG/JPEG, WebP, AVIF, GIF, BMP, TIFF/TIF, ICO, HEIC/HEIF, SVG."
        }
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
                  <Loader2
                    className={cn("size-4", busy ? "animate-spin" : "hidden")}
                    aria-hidden
                  />
                  Convert all
                </Button>
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
            </div>

            <ul className="max-h-[min(520px,60vh)] divide-y overflow-y-auto rounded-xl border bg-background">
              {items.map((item) => {
                const outName = item.outputName ?? "converted.webp";
                const savings =
                  item.originalBytes && item.outputBytes
                    ? (item.outputBytes - item.originalBytes) /
                      item.originalBytes
                    : null;

                return (
                  <li key={item.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <ImageThumb file={item.file} label="IMG" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-sm">
                              {item.file?.name ?? outName}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant={statusBadgeVariant(item.status)}>
                                {statusLabel(item.status)}
                                {item.status === "running" &&
                                item.progress != null
                                  ? ` · ${Math.round(item.progress * 100)}%`
                                  : null}
                              </Badge>
                              <Badge variant="outline">
                                {format.toUpperCase()}
                              </Badge>
                              {item.sourceLabel === "link" ? (
                                <Badge variant="outline">Link</Badge>
                              ) : (
                                <Badge variant="outline">Upload</Badge>
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
                            aria-label="Remove"
                          >
                            <X className="size-4" aria-hidden />
                          </Button>
                        </div>

                        {item.status === "error" && item.error ? (
                          <div className="mt-2 text-destructive text-xs">
                            {item.error}
                          </div>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                          {item.originalBytes ? (
                            <span>In: {formatBytes(item.originalBytes)}</span>
                          ) : null}
                          {item.outputBytes ? (
                            <span>Out: {formatBytes(item.outputBytes)}</span>
                          ) : null}
                          {savings != null && item.outputBytes ? (
                            <span>
                              {savings > 0 ? "Bigger" : "Smaller"}:{" "}
                              {Math.abs(Math.round(savings * 100))}%
                            </span>
                          ) : null}
                        </div>

                        {item.status === "running" ? (
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-[width]"
                              style={{
                                width: `${Math.round((item.progress ?? 0) * 100)}%`,
                              }}
                            />
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={
                              busy || item.status !== "queued" || !item.file
                            }
                            onClick={() => void convertOne(item.id)}
                          >
                            Convert
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              item.status === "done" ? "default" : "outline"
                            }
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
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="rounded-xl border bg-background p-4 lg:sticky lg:top-20">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm">
                    Conversion settings
                  </div>
                  <div className="mt-1 text-muted-foreground text-xs">
                    Choose output format + conversion mode. Recommended picks
                    the fastest safe path.
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm">Conversion mode</Label>
                <Select
                  value={engine}
                  onValueChange={(value) => setEngine(value as ConvertEngine)}
                  disabled={format === "svg"}
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
                <div className="text-muted-foreground text-xs">
                  {format === "svg"
                    ? "SVG is traced in your browser. Larger images are downscaled before tracing so the tab stays responsive."
                    : "Recommended picks the fastest option. “Works with more formats” can be slower."}
                </div>
              </div>

              {format === "svg" ? (
                <div className="grid gap-2">
                  <Label className="text-sm">SVG vector quality</Label>
                  <Select
                    value={svgTracePreset}
                    onValueChange={(value) =>
                      setSvgTracePreset(value as SvgTracePreset)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast">
                        Fast (smaller preview, fewer paths)
                      </SelectItem>
                      <SelectItem value="balanced">
                        Balanced (recommended)
                      </SelectItem>
                      <SelectItem value="high">High detail (slower)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-muted-foreground text-xs">
                    Uses Vision Cortex VTracer (WASM) locally. The same engine
                    family as many desktop tools. Fast uses a smaller trace and
                    coarser clustering; High uses the vtracer “photo”-style
                    settings and up to ~2048px per side. Still slower than a
                    cloud GPU, but much closer in quality than the old JS-only
                    tracer.
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label className="text-sm">Output format</Label>
                <Select
                  value={format}
                  onValueChange={(value) => setFormat(value as OutputFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedFormats.includes("webp") ? (
                      <SelectItem value="webp">WebP</SelectItem>
                    ) : null}
                    {allowedFormats.includes("avif") ? (
                      <SelectItem value="avif">AVIF</SelectItem>
                    ) : null}
                    {allowedFormats.includes("jpeg") ? (
                      <SelectItem value="jpeg">JPEG</SelectItem>
                    ) : null}
                    {allowedFormats.includes("png") ? (
                      <SelectItem value="png">PNG</SelectItem>
                    ) : null}
                    {allowedFormats.includes("gif") ? (
                      <SelectItem value="gif">GIF</SelectItem>
                    ) : null}
                    {allowedFormats.includes("bmp") ? (
                      <SelectItem value="bmp">BMP</SelectItem>
                    ) : null}
                    {allowedFormats.includes("tiff") ? (
                      <SelectItem value="tiff">TIFF</SelectItem>
                    ) : null}
                    {allowedFormats.includes("ico") ? (
                      <SelectItem value="ico">ICO</SelectItem>
                    ) : null}
                    {allowedFormats.includes("svg") ? (
                      <SelectItem value="svg">SVG</SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
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
                  onValueChange={(value) => setQuality(value[0] ?? 85)}
                  disabled={!isQualityRelevant(format)}
                />
                <div className="text-muted-foreground text-xs">
                  {isQualityRelevant(format)
                    ? "Higher quality means larger output files."
                    : "Quality is ignored for this output format."}
                </div>
              </div>

              <Separator />

              <div className="text-muted-foreground text-xs">
                Runs 100% on your device. If a file won’t convert, try “Works
                with more formats”.
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
