"use client";

import { Download, Loader2, Music2, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
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

type OutputFormat = "mp3" | "aac" | "opus" | "wav";
type ItemStatus = "queued" | "running" | "done" | "error";

interface AudioItem {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number | null; // 0..1
  error: string | null;
  outputBlob: Blob | null;
  outputName: string | null;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message?.trim() || error.name;
  if (typeof error === "string" && error.trim()) return error.trim();
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
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

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.[a-z0-9]+$/i, "");
  return leaf || "audio";
}

function isProbablyMediaFile(file: File) {
  if (file.type.startsWith("audio/")) return true;
  if (file.type.startsWith("video/")) return true;
  return /\.(mp3|wav|m4a|aac|opus|ogg|flac|mp4|mov|mkv|webm|m4v)$/i.test(
    file.name,
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
  args.setEngineStatus({ phase: "Preparing audio conversion…" });

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
  } catch (e) {
    const msg = errorToMessage(e);
    throw new Error(
      `Could not start the audio conversion mode on this device. ${msg}. If you're running behind a strict CSP/adblocker, allow loading from this site origin.`,
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

function formatToMime(format: OutputFormat) {
  switch (format) {
    case "mp3":
      return "audio/mpeg";
    case "aac":
      return "audio/aac";
    case "opus":
      return "audio/ogg";
    case "wav":
      return "audio/wav";
  }
}

export function AudioConvertApp() {
  const ffmpegRef = React.useRef<null | import("@ffmpeg/ffmpeg").FFmpeg>(null);
  const loadedRef = React.useRef(false);
  const boundProgressRef = React.useRef(false);
  const runningIdRef = React.useRef<string | null>(null);

  const [items, setItems] = React.useState<AudioItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [engineStatus, setEngineStatus] = React.useState<null | {
    phase: string;
  }>(null);
  const [engineError, setEngineError] = React.useState<string | null>(null);

  const [format, setFormat] = React.useState<OutputFormat>("mp3");
  const [kbps, setKbps] = React.useState(192);

  const hasQueued = items.some((i) => i.status === "queued");

  const onAddFiles = React.useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const next = Array.from(files).filter(isProbablyMediaFile);
    if (next.length === 0) {
      toast.error("Add audio/video files only.");
      return;
    }
    setItems((prev) => [
      ...prev,
      ...next.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "queued" as const,
        progress: null,
        error: null,
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

  const convertOne = React.useCallback(
    async (id: string) => {
      const item = items.find((x) => x.id === id) ?? null;
      if (!item) return;

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

        const safeLeaf = item.file.name.replace(/[/?%*:|"<>\\]/g, "-");
        const inName = `in-${id}-${safeLeaf}`;
        const outName = `out-${id}.${format}`;

        setItems((prev) =>
          prev.map((x) =>
            x.id === id
              ? { ...x, status: "running", progress: 0, error: null }
              : x,
          ),
        );

        await ffmpeg.writeFile(inName, await fetchFile(item.file));

        const args: string[] = ["-i", inName, "-vn"];

        if (format === "wav") {
          args.push("-c:a", "pcm_s16le", "-ar", "44100", "-ac", "2");
        } else if (format === "mp3") {
          args.push("-c:a", "libmp3lame", "-b:a", `${kbps}k`);
        } else if (format === "aac") {
          args.push("-c:a", "aac", "-b:a", `${kbps}k`);
        } else {
          args.push("-c:a", "libopus", "-b:a", `${kbps}k`);
        }

        args.push("-map_metadata", "0", outName);

        await ffmpeg.exec(args);

        const out = await ffmpeg.readFile(outName);
        if (typeof out === "string")
          throw new Error("Unexpected ffmpeg output type");
        const outBytes = out instanceof Uint8Array ? out : new Uint8Array(out);

        const outBlob = new Blob([outBytes.slice().buffer], {
          type: formatToMime(format),
        });

        const base = baseNameFromFileName(item.file.name).replace(
          /[/?%*:|"<>\\]/g,
          "-",
        );
        const exportName = `${base}.${format}`;

        setItems((prev) =>
          prev.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: "done",
                  progress: 1,
                  outputBlob: outBlob,
                  outputName: exportName,
                }
              : x,
          ),
        );

        toast.success(`Converted: ${item.file.name}`);
      } catch (e) {
        const msg = errorToMessage(e);
        setEngineError(msg);
        setItems((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: "error", error: msg } : x)),
        );
        toast.error(msg);
      } finally {
        if (runningIdRef.current === id) runningIdRef.current = null;
        setBusy(false);
        setEngineStatus(null);
      }
    },
    [format, items, kbps],
  );

  const onConvertAll = React.useCallback(async () => {
    const queue = items.filter((i) => i.status === "queued");
    if (queue.length === 0) return;
    for (const it of queue) {
      await convertOne(it.id);
    }
  }, [convertOne, items]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <Music2 className="size-5" aria-hidden />
          </div>
          <h1 className={toolHeroTitleClassName}>Video to MP3 converter</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Convert audio formats (MP3/AAC/Opus/WAV) or extract audio from videos
          locally in your browser. No uploads to our servers.
        </p>
      </header>

      <FileDropZone
        disabled={busy}
        busy={busy}
        inputId="audio-convert-input"
        accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.opus,.ogg,.flac,.mp4,.mov,.mkv,.webm,.m4v"
        multiple
        onFiles={onAddFiles}
        fileIcon={({ className, "aria-hidden": ariaHidden }) => (
          <Music2 className={className} aria-hidden={ariaHidden} />
        )}
        dropTitle={
          items.length
            ? "Drop more files or click to add"
            : "Drop audio/video files here or click to browse"
        }
        dropHint="Bulk queue · local-only conversion"
        chooseLabel={items.length ? "Add files" : "Choose files"}
        fileHint="Conversion happens locally in your browser."
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
                const outName = item.outputName ?? `audio.${format}`;
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 bg-background p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-medium text-sm">
                          {item.file.name}
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
                        {item.status === "queued"
                          ? "Ready"
                          : item.status === "running"
                            ? `Converting… ${Math.round((item.progress ?? 0) * 100)}%`
                            : item.status === "done"
                              ? "Done"
                              : `Error: ${item.error ?? "Failed"}`}
                      </div>

                      <div className="mt-1 text-muted-foreground text-xs">
                        In: {formatBytes(item.file.size)}
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
                          disabled={busy || item.status !== "queued"}
                          onClick={() => void convertOne(item.id)}
                        >
                          Convert
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
                        <span className="truncate text-muted-foreground text-xs">
                          {item.outputName ? outName : null}
                        </span>
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
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as OutputFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">MP3 (best compatibility)</SelectItem>
                    <SelectItem value="aac">AAC / .aac</SelectItem>
                    <SelectItem value="opus">Opus (Ogg)</SelectItem>
                    <SelectItem value="wav">WAV (lossless)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {format !== "wav" ? (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Bitrate</Label>
                    <span className="text-muted-foreground text-xs">
                      {kbps} kbps
                    </span>
                  </div>
                  <Slider
                    value={[kbps]}
                    min={64}
                    max={320}
                    step={16}
                    onValueChange={(v) => setKbps(v[0] ?? 192)}
                  />
                  <div className="text-muted-foreground text-xs">
                    Higher bitrate = bigger file. 192 kbps is a good default.
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">
                  WAV export is lossless PCM (44.1kHz stereo).
                </div>
              )}

              <Separator />

              <Button
                type="button"
                disabled={busy || !hasQueued}
                onClick={() => void onConvertAll()}
              >
                Convert all
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

