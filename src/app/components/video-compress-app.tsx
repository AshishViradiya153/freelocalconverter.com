"use client";

import {
  Download,
  Film,
  Link as LinkIcon,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
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

type Codec = "h264" | "hevc" | "vp9";
type Preset =
  | "ultrafast"
  | "superfast"
  | "veryfast"
  | "faster"
  | "fast"
  | "medium"
  | "slow";

type ItemStatus = "idle" | "fetching" | "queued" | "running" | "done" | "error";

interface VideoItem {
  id: string;
  sourceLabel: string;
  file: File | null;
  status: ItemStatus;
  progress: number | null; // 0..1
  error: string | null;
  originalBytes: number | null;
  outputBytes: number | null;
  outputBlob: Blob | null;
  outputName: string | null;
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

function debugError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  try {
    return { json: JSON.stringify(error) };
  } catch {
    return { raw: String(error) };
  }
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
  const u = units[i] ?? "KB";
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${u}`;
}

function safeNameFromUrl(url: string) {
  try {
    const u = new URL(url);
    const leaf = u.pathname.split("/").filter(Boolean).pop() ?? "video";
    const base = leaf.replace(/[/?%*:|"<>\\]/g, "-").slice(0, 80) || "video";
    return base.toLowerCase().endsWith(".mp4") ? base : `${base}.mp4`;
  } catch {
    return "video.mp4";
  }
}

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.[a-z0-9]+$/i, "");
  return leaf || "video";
}

function VideoFileGlyph(props: {
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <Film className={props.className} aria-hidden={props["aria-hidden"]} />
  );
}

async function ensureFfmpegLoaded(args: {
  ffmpegRef: React.MutableRefObject<null | import("@ffmpeg/ffmpeg").FFmpeg>;
  loadedRef: React.MutableRefObject<boolean>;
  boundProgressRef: React.MutableRefObject<boolean>;
  runningIdRef: React.MutableRefObject<string | null>;
  setEngineStatus: (s: { phase: string } | null) => void;
  setEngineError: (s: string | null) => void;
  onProgress: (id: string, progress: number) => void;
}) {
  if (args.loadedRef.current && args.ffmpegRef.current)
    return args.ffmpegRef.current;

  args.setEngineError(null);
  args.setEngineStatus({ phase: "Preparing video conversion…" });

  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);

  const ffmpeg = new FFmpeg();

  // Load ffmpeg-core from same-origin static assets (most reliable).
  // `public/ffmpeg-core/*` is populated by `scripts/copy-ffmpeg-core.mjs`.
  try {
    const base = `${location.origin}/ffmpeg-core/umd`;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      // Some core builds don't ship a worker file; `workerURL` is optional.
    });
  } catch (e) {
    const msg = errorToMessage(e);
    throw new Error(
      `Could not start the video conversion mode on this device. ${msg}. If you're running behind a strict CSP/adblocker, allow loading from this site origin.`,
    );
  }

  if (!args.boundProgressRef.current) {
    args.boundProgressRef.current = true;
    ffmpeg.on("progress", ({ progress }) => {
      const id = args.runningIdRef.current;
      if (!id) return;
      args.onProgress(id, clamp(progress, 0, 1));
    });
  }

  args.ffmpegRef.current = ffmpeg;
  args.loadedRef.current = true;
  args.setEngineStatus(null);
  return ffmpeg;
}

function isProbablyVideoFile(file: File) {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|mkv|webm|m4v)$/i.test(file.name);
}

export function VideoCompressApp() {
  const ffmpegRef = React.useRef<null | import("@ffmpeg/ffmpeg").FFmpeg>(null);
  const loadedRef = React.useRef(false);
  const boundProgressRef = React.useRef(false);
  const runningIdRef = React.useRef<string | null>(null);

  const [items, setItems] = React.useState<VideoItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [engineStatus, setEngineStatus] = React.useState<null | {
    phase: string;
  }>(null);
  const [engineError, setEngineError] = React.useState<string | null>(null);

  const [linkInput, setLinkInput] = React.useState("");

  const [codec, setCodec] = React.useState<Codec>("h264");
  const [crf, setCrf] = React.useState(24);
  const [preset, setPreset] = React.useState<Preset>("veryfast");
  const [stripAudio, setStripAudio] = React.useState(false);

  const hasQueued = items.some((i) => i.status === "queued");
  const hasRunnable = items.some((i) =>
    i.file ? i.status === "queued" : false,
  );

  const onAddFiles = React.useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const next = Array.from(files).filter(isProbablyVideoFile);
    if (next.length === 0) {
      toast.error("Add video files only.");
      return;
    }

    setItems((prev) => [
      ...prev,
      ...next.map((f) => ({
        id: crypto.randomUUID(),
        sourceLabel: "upload",
        file: f,
        status: "queued" as const,
        progress: null,
        error: null,
        originalBytes: f.size,
        outputBytes: null,
        outputBlob: null,
        outputName: null,
      })),
    ]);
  }, []);

  const onRemoveItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const onClearAll = React.useCallback(() => {
    setItems([]);
  }, []);

  const onAddLink = React.useCallback(async () => {
    const url = linkInput.trim();
    if (!url) return;

    setBusy(true);
    setEngineError(null);
    setEngineStatus({ phase: "Fetching video from link…" });

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
      const file = new File([blob], name, { type: blob.type || "video/mp4" });

      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                file,
                status: "queued",
                originalBytes: file.size,
                error: null,
              }
            : x,
        ),
      );
      setLinkInput("");
    } catch (e) {
      const msg = errorToMessage(e);
      setItems((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, status: "error", error: msg } : x,
        ),
      );
      toast.error(
        "Could not fetch that link. Many sites block downloads via CORS.",
      );
    } finally {
      setBusy(false);
      setEngineStatus(null);
    }
  }, [linkInput]);

  const compressOne = React.useCallback(
    async (id: string) => {
      const current = items.find((x) => x.id === id) ?? null;
      const file = current?.file ?? null;
      if (!file) return;

      setEngineError(null);
      setBusy(true);

      try {
        runningIdRef.current = id;
        const ffmpeg = await ensureFfmpegLoaded({
          ffmpegRef,
          loadedRef,
          boundProgressRef,
          runningIdRef,
          setEngineStatus,
          setEngineError,
          onProgress: (targetId, progress) => {
            setItems((prev) =>
              prev.map((x) =>
                x.id === targetId ? { ...x, status: "running", progress } : x,
              ),
            );
          },
        });

        const { fetchFile } = await import("@ffmpeg/util");

        const inName = `in-${id}-${file.name.replace(/[/?%*:|"<>\\]/g, "-")}`;
        const outExt = codec === "vp9" ? "webm" : "mp4";
        const outName = `out-${id}.${outExt}`;

        setItems((prev) =>
          prev.map((x) =>
            x.id === id
              ? { ...x, status: "running", progress: 0, error: null }
              : x,
          ),
        );

        await ffmpeg.writeFile(inName, await fetchFile(file));

        const vCodecArgs =
          codec === "h264"
            ? ["-c:v", "libx264", "-preset", preset, "-crf", String(crf)]
            : codec === "hevc"
              ? ["-c:v", "libx265", "-preset", preset, "-crf", String(crf)]
              : ["-c:v", "libvpx-vp9", "-crf", String(crf), "-b:v", "0"];

        const audioArgs = stripAudio ? ["-an"] : ["-c:a", "copy"];

        await ffmpeg.exec([
          "-i",
          inName,
          ...audioArgs,
          ...vCodecArgs,
          "-pix_fmt",
          "yuv420p",
          outName,
        ]);

        const out = await ffmpeg.readFile(outName);
        if (typeof out === "string")
          throw new Error("Unexpected ffmpeg output type");
        const outBytes = out instanceof Uint8Array ? out : new Uint8Array(out);
        const outBlob = new Blob([outBytes.slice().buffer], {
          type: codec === "vp9" ? "video/webm" : "video/mp4",
        });

        const base = baseNameFromFileName(file.name).replace(
          /[/?%*:|"<>\\]/g,
          "-",
        );
        const exportName = `${base}-compressed.${outExt}`;

        setItems((prev) =>
          prev.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: "done",
                  progress: 1,
                  outputBlob: outBlob,
                  outputBytes: outBlob.size,
                  outputName: exportName,
                }
              : x,
          ),
        );

        toast.success(`Compressed: ${file.name}`);
      } catch (e) {
        const msg = errorToMessage(e);
        console.error({ videoCompressError: debugError(e) });
        setEngineError(msg);
        setItems((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, status: "error", error: msg } : x,
          ),
        );
        toast.error(msg);
      } finally {
        if (runningIdRef.current === id) runningIdRef.current = null;
        setBusy(false);
        setEngineStatus(null);
      }
    },
    [codec, crf, items, preset, stripAudio],
  );

  const onCompressAll = React.useCallback(async () => {
    const queue = items.filter((i) => i.status === "queued" && i.file);
    if (queue.length === 0) return;
    for (const it of queue) {
      await compressOne(it.id);
    }
  }, [compressOne, items]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <span className="font-semibold text-sm">MP4</span>
          </div>
          <h1 className={toolHeroTitleClassName}>Video Compressor</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Compress videos locally in your browser. Upload many files or paste a
          link, then download the smaller outputs, no uploads to our servers.
        </p>
      </header>

      <div className="grid gap-3 rounded-xl border bg-background p-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm">Add by link</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://example.com/video.mp4"
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
            download the file first, then upload it here.
          </div>
        </div>
      </div>

      <FileDropZone
        disabled={busy}
        busy={busy}
        inputId="video-compress-input"
        accept="video/*,.mp4,.mov,.mkv,.webm,.m4v"
        multiple
        onFiles={onAddFiles}
        fileIcon={VideoFileGlyph}
        dropTitle={
          items.length
            ? "Drop more videos or click to add"
            : "Drop videos here or click to browse"
        }
        dropHint="Bulk queue · local-only compression"
        chooseLabel={items.length ? "Add videos" : "Choose videos"}
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
              </div>
            </div>

            <ul className="max-h-[min(460px,55vh)] divide-y overflow-y-auto rounded-xl border">
              {items.map((item) => {
                const outName = item.outputName ?? "compressed.mp4";
                const savings =
                  item.originalBytes && item.outputBytes
                    ? Math.max(
                        0,
                        (item.originalBytes - item.outputBytes) /
                          item.originalBytes,
                      )
                    : null;

                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 bg-background p-3"
                  >
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
                        {item.originalBytes ? (
                          <span>In: {formatBytes(item.originalBytes)}</span>
                        ) : null}
                        {item.outputBytes ? (
                          <span>Out: {formatBytes(item.outputBytes)}</span>
                        ) : null}
                        {savings != null && item.outputBytes ? (
                          <span>Saved: {Math.round(savings * 100)}%</span>
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

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={
                            busy || item.status !== "queued" || !item.file
                          }
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
                <Label className="text-sm">Codec</Label>
                <Select
                  value={codec}
                  onValueChange={(v) => setCodec(v as Codec)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h264">
                      H.264 (best compatibility)
                    </SelectItem>
                    <SelectItem value="hevc">
                      HEVC / H.265 (smaller, newer)
                    </SelectItem>
                    <SelectItem value="vp9">VP9 (WebM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Quality (CRF)</Label>
                  <span className="text-muted-foreground text-xs">{crf}</span>
                </div>
                <Slider
                  value={[crf]}
                  min={18}
                  max={38}
                  step={1}
                  onValueChange={(v) => setCrf(v[0] ?? 24)}
                />
                <div className="text-muted-foreground text-xs">
                  Lower CRF = higher quality + bigger file. Start at 24.
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm">Speed preset</Label>
                <Select
                  value={preset}
                  onValueChange={(v) => setPreset(v as Preset)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ultrafast">Ultrafast</SelectItem>
                    <SelectItem value="superfast">Superfast</SelectItem>
                    <SelectItem value="veryfast">Veryfast</SelectItem>
                    <SelectItem value="faster">Faster</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="slow">Slow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/10 p-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm">Strip audio</div>
                  <div className="text-muted-foreground text-xs">
                    Removes audio track to reduce size.
                  </div>
                </div>
                <Button
                  type="button"
                  variant={stripAudio ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setStripAudio((v) => !v)}
                  aria-pressed={stripAudio}
                >
                  {stripAudio ? "On" : "Off"}
                </Button>
              </div>

              <Separator />

              <Button
                type="button"
                disabled={busy || !hasRunnable || !hasQueued}
                onClick={() => void onCompressAll()}
              >
                Compress all
              </Button>

              <div className="text-muted-foreground text-xs">
                Everything runs locally on your device. The conversion mode may
                take a moment to load the first time.
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
