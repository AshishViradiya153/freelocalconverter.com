"use client";

import { Download, Link as LinkIcon, Loader2, Package, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/download-blob";
import { zipSync } from "fflate";

type ItemStatus = "queued" | "fetching" | "done" | "error";

interface LinkItem {
  id: string;
  url: string;
  status: ItemStatus;
  filename: string;
  bytes: number | null;
  blob: Blob | null;
  error: string | null;
}

type Mode = "links" | "convert";
type ConvertMode = "audio" | "video";

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message?.trim() || error.name;
  if (typeof error === "string" && error.trim()) return error.trim();
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function parseLinks(text: string) {
  const tokens = text
    .split(/[\s,]+/g)
    .map((t) => t.trim())
    .filter(Boolean);

  const urls: string[] = [];
  for (const raw of tokens) {
    try {
      const u = new URL(raw);
      if (u.protocol === "http:" || u.protocol === "https:") urls.push(u.toString());
    } catch {
      // ignore
    }
  }

  return Array.from(new Set(urls));
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
    const leaf = u.pathname.split("/").filter(Boolean).pop() ?? "download";
    const base = leaf.replace(/[/?%*:|"<>\\]/g, "-").slice(0, 100) || "download";
    const ext = base.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    const allowed = new Set([
      "mp3",
      "m4a",
      "aac",
      "wav",
      "opus",
      "ogg",
      "flac",
      "mp4",
      "webm",
      "mov",
      "mkv",
      "m4v",
    ]);
    if (ext && allowed.has(ext)) return base;
    return base.includes(".") ? base : `${base}.bin`;
  } catch {
    return "download.bin";
  }
}

async function blobToU8(blob: Blob) {
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

export function MediaDownloaderApp() {
  const [mode, setMode] = React.useState<Mode>("links");
  const [convertMode, setConvertMode] = React.useState<ConvertMode>("audio");

  const [linkInput, setLinkInput] = React.useState("");
  const [items, setItems] = React.useState<LinkItem[]>([]);
  const [busy, setBusy] = React.useState(false);

  const hasQueued = items.some((i) => i.status === "queued");
  const hasDone = items.some((i) => i.status === "done" && i.blob);

  const onAddLinks = React.useCallback(() => {
    const urls = parseLinks(linkInput);
    if (urls.length === 0) {
      toast.error("Paste one or more direct media links (http/https).");
      return;
    }

    setItems((prev) => {
      const existing = new Set(prev.map((p) => p.url));
      const next = urls
        .filter((u) => !existing.has(u))
        .map((url) => ({
          id: crypto.randomUUID(),
          url,
          status: "queued" as const,
          filename: safeNameFromUrl(url),
          bytes: null,
          blob: null,
          error: null,
        }));
      return [...next, ...prev];
    });
  }, [linkInput]);

  const onClearAll = React.useCallback(() => setItems([]), []);

  const onRemoveItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const fetchOne = React.useCallback(async (id: string) => {
    const current = items.find((x) => x.id === id) ?? null;
    if (!current) return;

    setBusy(true);
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "fetching", error: null } : x)),
    );

    try {
      const res = await fetch(current.url, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      const ct = blob.type || res.headers.get("content-type") || "";
      const isMedia =
        ct.startsWith("audio/") ||
        ct.startsWith("video/") ||
        /\.(mp3|m4a|aac|wav|opus|ogg|flac|mp4|webm|mov|mkv|m4v)(\?|#|$)/i.test(
          current.url,
        );

      if (!isMedia) {
        throw new Error(
          `That link did not look like a direct media file (Content-Type: ${ct || "unknown"}).`,
        );
      }

      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? { ...x, status: "done", blob, bytes: blob.size, error: null }
            : x,
        ),
      );
    } catch (e) {
      const msg = errorToMessage(e);
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: "error", error: msg } : x)),
      );
      toast.error("Could not download that link. Many hosts block CORS.");
    } finally {
      setBusy(false);
    }
  }, [items]);

  const onFetchAll = React.useCallback(async () => {
    const queue = items.filter((i) => i.status === "queued");
    if (queue.length === 0) return;
    for (const it of queue) {
      await fetchOne(it.id);
    }
  }, [fetchOne, items]);

  const onDownloadZip = React.useCallback(async () => {
    const ready = items.filter((i) => i.status === "done" && i.blob);
    if (ready.length === 0) return;
    setBusy(true);
    try {
      const files: Record<string, Uint8Array> = {};
      for (const it of ready) {
        const blob = it.blob;
        if (!blob) continue;
        const name = it.filename || "download.bin";
        files[name] = await blobToU8(blob);
      }
      const zipped = zipSync(files, { level: 6 });
      const zipBuf = zipped.buffer.slice(
        zipped.byteOffset,
        zipped.byteOffset + zipped.byteLength,
      );
      downloadBlob(
        new Blob([zipBuf as ArrayBuffer], { type: "application/zip" }),
        "downloads.zip",
      );
    } catch (e) {
      toast.error(errorToMessage(e));
    } finally {
      setBusy(false);
    }
  }, [items]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <LinkIcon className="size-5" aria-hidden />
          </div>
          <h1 className={toolHeroTitleClassName}>Media downloader (links + convert)</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Paste direct MP3/MP4/WebM/etc file links to download in bulk (CORS required),
          or upload files and convert locally in your browser (no uploads).
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === "links" ? "secondary" : "outline"}
          onClick={() => setMode("links")}
          aria-pressed={mode === "links"}
        >
          Download from links
        </Button>
        <Button
          type="button"
          variant={mode === "convert" ? "secondary" : "outline"}
          onClick={() => setMode("convert")}
          aria-pressed={mode === "convert"}
        >
          Convert uploaded files
        </Button>
      </div>

      {mode === "links" ? (
        <section className="flex flex-col gap-4">
          <div className="grid gap-2 rounded-xl border bg-background p-4">
            <Label className="text-sm">Paste links (one per line)</Label>
            <Textarea
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder={[
                "https://example.com/file.mp3",
                "https://cdn.example.com/video.mp4",
              ].join("\n")}
              className="min-h-32"
              spellCheck={false}
              disabled={busy}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={onAddLinks} disabled={busy}>
                Add to queue
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void onFetchAll()}
                disabled={busy || !hasQueued}
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Download all
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void onDownloadZip()}
                disabled={busy || !hasDone}
              >
                <Package className="size-4" aria-hidden />
                Download ZIP
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClearAll}
                disabled={busy || items.length === 0}
              >
                <Trash2 className="size-4" aria-hidden />
                Clear
              </Button>
            </div>
            <div className="text-muted-foreground text-xs">
              This only works for direct file URLs and hosts that allow browser downloads
              (CORS). We don’t support “platform link downloading” (YouTube/TikTok/Instagram pages).
            </div>
          </div>

          {items.length > 0 ? (
            <ul className="divide-y overflow-hidden rounded-xl border">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 bg-background p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-medium text-sm">{item.filename}</div>
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
                    <div className="truncate text-muted-foreground text-xs">{item.url}</div>

                    <div className="mt-1 text-muted-foreground text-xs">
                      {item.status === "queued"
                        ? "Ready"
                        : item.status === "fetching"
                          ? "Downloading…"
                          : item.status === "done"
                            ? `Done${item.bytes != null ? ` · ${formatBytes(item.bytes)}` : ""}`
                            : `Error: ${item.error ?? "Failed"}`}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy || item.status !== "queued"}
                        onClick={() => void fetchOne(item.id)}
                      >
                        Download
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!item.blob}
                        onClick={() => {
                          if (!item.blob) return;
                          downloadBlob(item.blob, item.filename);
                        }}
                      >
                        <Download className="size-4" aria-hidden />
                        Save
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={convertMode === "audio" ? "secondary" : "outline"}
              onClick={() => setConvertMode("audio")}
              aria-pressed={convertMode === "audio"}
            >
              Audio (MP3/AAC/WAV)
            </Button>
            <Button
              type="button"
              variant={convertMode === "video" ? "secondary" : "outline"}
              onClick={() => setConvertMode("video")}
              aria-pressed={convertMode === "video"}
            >
              Video (MP4/WebM)
            </Button>
          </div>

          <Separator />

          {convertMode === "audio" ? (
            <React.Suspense
              fallback={
                <div className="rounded-xl border bg-background p-4 text-muted-foreground text-sm">
                  Loading…
                </div>
              }
            >
              <LazyAudioConvert />
            </React.Suspense>
          ) : (
            <React.Suspense
              fallback={
                <div className="rounded-xl border bg-background p-4 text-muted-foreground text-sm">
                  Loading…
                </div>
              }
            >
              <LazyVideoCompress />
            </React.Suspense>
          )}
        </section>
      )}
    </div>
  );
}

function LazyAudioConvert() {
  const AudioConvert = React.useMemo(
    () => React.lazy(async () => import("./audio-convert-app").then((m) => ({ default: m.AudioConvertApp }))),
    [],
  );

  return (
    <AudioConvert
      title="Convert to MP3 (or other audio formats)"
      subtitle="Upload audio/video files to extract/convert audio locally in your browser. If you have a direct file URL, use the link mode."
      inputId="media-downloader-audio-input"
      allowUrlInput
      urlPlaceholder="https://example.com/video.mp4"
    />
  );
}

function LazyVideoCompress() {
  const VideoCompress = React.useMemo(
    () => React.lazy(async () => import("./video-compress-app").then((m) => ({ default: m.VideoCompressApp }))),
    [],
  );

  return <VideoCompress />;
}

