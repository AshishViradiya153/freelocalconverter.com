"use client";

import { zipSync } from "fflate";
import {
  Download,
  Film,
  ImageIcon,
  Layers,
  Loader2,
  Scissors,
} from "lucide-react";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { downloadBlob } from "@/lib/download-blob";
import { createBrowserFfmpeg } from "@/lib/ffmpeg/create-browser-ffmpeg";

type ToolMode = "convert" | "split" | "sequence";

function errorToMessage(error: unknown, unknownError: string): string {
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) return msg;
    return error.name || unknownError;
  }
  if (typeof error === "string" && error.trim()) return error.trim();
  return unknownError;
}

function baseName(name: string) {
  return name.replace(/\.[^./]+$/, "") || "output";
}

function extFromMediaFile(f: File): string {
  const n = f.name.toLowerCase();
  if (n.endsWith(".gif")) return ".gif";
  if (n.endsWith(".webm")) return ".webm";
  if (n.endsWith(".mov")) return ".mov";
  if (n.endsWith(".mkv")) return ".mkv";
  if (f.type === "image/gif") return ".gif";
  if (f.type === "video/webm") return ".webm";
  if (f.type === "video/quicktime") return ".mov";
  return ".mp4";
}

async function imageFileToPngBytes(
  file: File,
  size: number,
): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare canvas context");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const drawWidth = Math.max(1, Math.round(bitmap.width * scale));
  const drawHeight = Math.max(1, Math.round(bitmap.height * scale));
  const dx = Math.floor((size - drawWidth) / 2);
  const dy = Math.floor((size - drawHeight) / 2);
  ctx.drawImage(bitmap, dx, dy, drawWidth, drawHeight);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) {
        reject(new Error("Failed to encode image as PNG"));
        return;
      }
      resolve(b);
    }, "image/png");
  });
  const arr = await blob.arrayBuffer();
  return new Uint8Array(arr);
}

async function cleanupByPrefix(
  ffmpeg: import("@ffmpeg/ffmpeg").FFmpeg,
  prefix: string,
) {
  try {
    const nodes = await ffmpeg.listDir("/");
    for (const n of nodes) {
      if (!n.isDir && n.name.startsWith(prefix)) {
        try {
          await ffmpeg.deleteFile(n.name);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
}

export function GifToolsApp() {
  const t = useTranslations("gifToolsUi");
  const ffmpegRef = React.useRef<Awaited<
    ReturnType<typeof createBrowserFfmpeg>
  > | null>(null);
  const loadPromiseRef = React.useRef<Promise<
    Awaited<ReturnType<typeof createBrowserFfmpeg>>
  > | null>(null);

  const [mode, setMode] = React.useState<ToolMode>("convert");
  const [busy, setBusy] = React.useState(false);
  const [engineHint, setEngineHint] = React.useState<string | null>(null);

  const [convertFile, setConvertFile] = React.useState<File | null>(null);
  const [videoToGifFps, setVideoToGifFps] = React.useState(8);
  const [gifOutChoice, setGifOutChoice] = React.useState<"mp4" | "webp">("mp4");

  const [splitFile, setSplitFile] = React.useState<File | null>(null);

  const [seqFiles, setSeqFiles] = React.useState<File[]>([]);
  const [seqFps, setSeqFps] = React.useState(4);
  const [videoToGifMaxWidth, setVideoToGifMaxWidth] = React.useState(480);
  const [sequenceSize, setSequenceSize] = React.useState(480);

  const [outputPreviewUrl, setOutputPreviewUrl] = React.useState<string | null>(
    null,
  );
  const [outputPreviewKind, setOutputPreviewKind] = React.useState<
    "gif" | "mp4" | "webp" | null
  >(null);
  const [splitFramePreviewUrls, setSplitFramePreviewUrls] = React.useState<
    string[]
  >([]);
  const [pendingDownload, setPendingDownload] = React.useState<{
    blob: Blob;
    name: string;
  } | null>(null);

  const ensureFfmpeg = React.useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    if (!loadPromiseRef.current) {
      loadPromiseRef.current = (async () => {
        setEngineHint(t("statusLoadingFfmpeg"));
        try {
          const ff = await createBrowserFfmpeg();
          ffmpegRef.current = ff;
          return ff;
        } finally {
          setEngineHint(null);
          loadPromiseRef.current = null;
        }
      })();
    }
    return loadPromiseRef.current;
  }, []);

  const clearOutputPreview = React.useCallback(() => {
    setOutputPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setOutputPreviewKind(null);
    setPendingDownload(null);
  }, []);

  const clearSplitFramePreviews = React.useCallback(() => {
    setSplitFramePreviewUrls((prev) => {
      for (const u of prev) URL.revokeObjectURL(u);
      return [];
    });
  }, []);

  React.useEffect(() => {
    return () => {
      clearOutputPreview();
      clearSplitFramePreviews();
      setPendingDownload(null);
    };
  }, [clearOutputPreview, clearSplitFramePreviews]);

  const onConvertRun = React.useCallback(async () => {
    const file = convertFile;
    if (!file) {
      toast.error(t("errorAddGifOrVideoFirst"));
      return;
    }
    const isGif = /\.gif$/i.test(file.name) || file.type === "image/gif";
    setBusy(true);
    clearOutputPreview();
    clearSplitFramePreviews();
    const job = `c${Date.now()}`;
    const inName = `${job}-in${isGif ? ".gif" : extFromMediaFile(file)}`;
    try {
      const ffmpeg = await ensureFfmpeg();
      const { fetchFile } = await import("@ffmpeg/util");
      await cleanupByPrefix(ffmpeg, job);
      await ffmpeg.writeFile(inName, await fetchFile(file));

      if (isGif) {
        if (gifOutChoice === "mp4") {
          const out = `${job}.mp4`;
          await ffmpeg.exec([
            "-y",
            "-i",
            inName,
            "-movflags",
            "+faststart",
            "-pix_fmt",
            "yuv420p",
            out,
          ]);
          const data = await ffmpeg.readFile(out);
          if (typeof data === "string")
            throw new Error(t("errorUnexpectedOutput"));
          const bytes =
            data instanceof Uint8Array ? data : new Uint8Array(data);
          const blob = new Blob([bytes.slice().buffer], {
            type: "video/mp4",
          });
          setOutputPreviewKind("mp4");
          setOutputPreviewUrl(URL.createObjectURL(blob));
          setPendingDownload({
            blob,
            name: `${baseName(file.name)}.mp4`,
          });
          toast.success(t("toastPreviewReady"));
        } else {
          const out = `${job}.webp`;
          try {
            await ffmpeg.exec([
              "-y",
              "-i",
              inName,
              "-c:v",
              "libwebp",
              "-quality",
              "82",
              "-loop",
              "0",
              out,
            ]);
          } catch (e) {
            throw new Error(
              `${errorToMessage(e, t("toastUnknownError"))} - ${t(
                "errorAnimatedWebpUnavailableChooseMp4",
              )}`,
            );
          }
          const data = await ffmpeg.readFile(out);
          if (typeof data === "string")
            throw new Error(t("errorUnexpectedOutput"));
          const bytes =
            data instanceof Uint8Array ? data : new Uint8Array(data);
          const blob = new Blob([bytes.slice().buffer], {
            type: "image/webp",
          });
          setOutputPreviewKind("webp");
          setOutputPreviewUrl(URL.createObjectURL(blob));
          setPendingDownload({
            blob,
            name: `${baseName(file.name)}.webp`,
          });
          toast.success(t("toastPreviewReady"));
        }
      } else {
        const out = `${job}.gif`;
        const vf = `fps=${videoToGifFps},scale=min(${videoToGifMaxWidth}\\,iw):-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse`;
        await ffmpeg.exec(["-y", "-i", inName, "-vf", vf, out]);
        const data = await ffmpeg.readFile(out);
        if (typeof data === "string")
          throw new Error(t("errorUnexpectedOutput"));
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        const blob = new Blob([bytes.slice().buffer], { type: "image/gif" });
        setOutputPreviewKind("gif");
        setOutputPreviewUrl(URL.createObjectURL(blob));
        setPendingDownload({
          blob,
          name: `${baseName(file.name)}.gif`,
        });
        toast.success(t("toastPreviewReady"));
      }
    } catch (e) {
      toast.error(errorToMessage(e, t("toastUnknownError")));
    } finally {
      const ff = ffmpegRef.current;
      if (ff) void cleanupByPrefix(ff, job);
      setBusy(false);
    }
  }, [
    clearOutputPreview,
    clearSplitFramePreviews,
    convertFile,
    ensureFfmpeg,
    gifOutChoice,
    videoToGifFps,
    videoToGifMaxWidth,
  ]);

  const onSplitRun = React.useCallback(async () => {
    const file = splitFile;
    if (!file) {
      toast.error(t("errorAddAnimatedGifOrShortVideo"));
      return;
    }
    setBusy(true);
    clearOutputPreview();
    clearSplitFramePreviews();
    const job = `s${Date.now()}`;
    const inName = `${job}-in${/\.gif$/i.test(file.name) || file.type === "image/gif" ? ".gif" : extFromMediaFile(file)}`;
    const prefix = `${job}-frame-`;
    const MAX_SPLIT_FRAMES = 240;
    const SPLIT_DETECT_EXTRA_FRAMES = 1;
    const CAP_FRAMES = MAX_SPLIT_FRAMES + SPLIT_DETECT_EXTRA_FRAMES;
    try {
      const ffmpeg = await ensureFfmpeg();
      const { fetchFile } = await import("@ffmpeg/util");
      await cleanupByPrefix(ffmpeg, job);
      await ffmpeg.writeFile(inName, await fetchFile(file));
      await ffmpeg.exec([
        "-y",
        "-i",
        inName,
        "-frames:v",
        String(CAP_FRAMES),
        `${prefix}%04d.png`,
      ]);

      const nodes = await ffmpeg.listDir("/");
      const pngs = nodes
        .filter(
          (n) =>
            !n.isDir && n.name.startsWith(prefix) && n.name.endsWith(".png"),
        )
        .map((n) => n.name)
        .sort();
      if (pngs.length === 0) throw new Error(t("errorNoFramesExtracted"));

      const tooManyFrames = pngs.length > MAX_SPLIT_FRAMES;
      const pngsLimited = tooManyFrames
        ? pngs.slice(0, MAX_SPLIT_FRAMES)
        : pngs;

      if (tooManyFrames) {
        toast.warning(
          `Too many frames - exporting first ${MAX_SPLIT_FRAMES} frames.`,
        );
      }

      const zipObj: Record<string, Uint8Array> = {};
      const previewMax = 12;
      const previewUrls: string[] = [];
      for (const name of pngsLimited) {
        const data = await ffmpeg.readFile(name);
        if (typeof data === "string") continue;
        const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
        zipObj[name] = u8;
        if (previewUrls.length < previewMax) {
          const blob = new Blob([u8.slice().buffer], { type: "image/png" });
          previewUrls.push(URL.createObjectURL(blob));
        }
      }
      setSplitFramePreviewUrls(previewUrls);
      const zipped = zipSync(zipObj);
      const zipArrayBuffer = zipped.slice().buffer; // normalize away any SharedArrayBuffer types
      const zipBlob = new Blob([zipArrayBuffer], {
        type: "application/zip",
      });
      setPendingDownload({
        blob: zipBlob,
        name: `${baseName(file.name)}-frames.zip`,
      });
      toast.success(t("toastPreviewReady"));
    } catch (e) {
      toast.error(errorToMessage(e, t("toastUnknownError")));
    } finally {
      const ff = ffmpegRef.current;
      if (ff) void cleanupByPrefix(ff, job);
      setBusy(false);
    }
  }, [clearOutputPreview, clearSplitFramePreviews, ensureFfmpeg, splitFile]);

  const onSequenceRun = React.useCallback(async () => {
    if (seqFiles.length < 2) {
      toast.error(t("errorAddAtLeastTwoImages"));
      return;
    }
    setBusy(true);
    clearOutputPreview();
    clearSplitFramePreviews();
    const job = `q${Date.now()}`;
    const sequenceMp4 = `${job}.mp4`;
    const out = `${job}.gif`;
    try {
      const ffmpeg = await ensureFfmpeg();
      await cleanupByPrefix(ffmpeg, job);

      for (const [i, f] of seqFiles.entries()) {
        const n = `${job}-${String(i).padStart(3, "0")}.png`;
        await ffmpeg.writeFile(n, await imageFileToPngBytes(f, sequenceSize));
      }

      await ffmpeg.exec([
        "-y",
        "-framerate",
        String(seqFps),
        "-start_number",
        "0",
        "-i",
        `${job}-%03d.png`,
        "-frames:v",
        String(seqFiles.length),
        "-pix_fmt",
        "yuv420p",
        sequenceMp4,
      ]);

      const vf = `fps=${seqFps},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`;

      await ffmpeg.exec([
        "-y",
        "-i",
        sequenceMp4,
        "-vf",
        vf,
        "-loop",
        "0",
        out,
      ]);

      const data = await ffmpeg.readFile(out);
      if (typeof data === "string") throw new Error(t("errorUnexpectedOutput"));
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      const blob = new Blob([bytes.slice().buffer], { type: "image/gif" });
      setOutputPreviewKind("gif");
      setOutputPreviewUrl(URL.createObjectURL(blob));
      setPendingDownload({
        blob,
        name: `${job}-from-images.gif`,
      });
      toast.success(t("toastPreviewReady"));
    } catch (e) {
      toast.error(errorToMessage(e, t("toastUnknownError")));
    } finally {
      const ff = ffmpegRef.current;
      if (ff) void cleanupByPrefix(ff, job);
      setBusy(false);
    }
  }, [
    clearOutputPreview,
    clearSplitFramePreviews,
    ensureFfmpeg,
    seqFiles,
    seqFps,
    sequenceSize,
  ]);

  const modeButtons = (
    <div className="flex flex-wrap gap-2">
      {(
        [
          ["convert", t("modeConvertLabel"), Film],
          ["split", t("modeSplitLabel"), Scissors],
          ["sequence", t("modeSequenceLabel"), Layers],
        ] as const
      ).map(([id, label, Icon]) => (
        <Button
          key={id}
          type="button"
          variant={mode === id ? "default" : "outline"}
          size="sm"
          disabled={busy}
          onClick={() => {
            setMode(id);
            clearOutputPreview();
            clearSplitFramePreviews();
          }}
          className="gap-2"
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <span className="font-semibold text-xs">{t("badgeGifLabel")}</span>
          </div>
          <h1 className={toolHeroTitleClassName}>{t("title")}</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          {t("description")}
        </p>
      </header>

      {modeButtons}

      {engineHint ? (
        <div
          className="flex items-center gap-2 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>{engineHint}</span>
        </div>
      ) : null}

      {mode === "convert" ? (
        <section className="flex flex-col gap-4 rounded-xl border bg-background p-4">
          <h2 className="font-semibold text-sm tracking-tight">
            {t("convertTitle")}
          </h2>
          <p className="text-muted-foreground text-xs">{t("convertDesc")}</p>
          <FileDropZone
            disabled={busy}
            busy={busy}
            inputId="gif-tools-convert-input"
            accept="image/gif,video/*,.gif,.mp4,.webm,.mov"
            multiple={false}
            onFiles={(list) => {
              const f = list?.[0];
              if (f) setConvertFile(f);
            }}
            fileIcon={(p) => <Film {...p} />}
            dropTitle={
              convertFile ? t("dropReplaceTitle") : t("dropConvertTitle")
            }
            dropHint={t("dropOneFileHint")}
            chooseLabel={convertFile ? t("chooseReplaceFile") : t("chooseFile")}
            fileHint={convertFile?.name ?? t("fileHintNoFileSelected")}
            size={convertFile ? "sm" : "md"}
          />

          {convertFile &&
          (/\.gif$/i.test(convertFile.name) ||
            convertFile.type === "image/gif") ? (
            <div className="flex flex-col gap-2">
              <Label className="text-sm">{t("gifOutputLabel")}</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={gifOutChoice === "mp4" ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setGifOutChoice("mp4")}
                >
                  {t("mp4Label")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={gifOutChoice === "webp" ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setGifOutChoice("webp")}
                >
                  {t("animatedWebpLabel")}
                </Button>
              </div>
            </div>
          ) : convertFile ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label className="text-sm">{t("videoToGifFpsLabel")}</Label>

                <div className="flex flex-wrap gap-2">
                  {[6, 8, 12].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      size="sm"
                      variant={videoToGifFps === v ? "default" : "outline"}
                      disabled={busy}
                      onClick={() => setVideoToGifFps(v)}
                      className="font-mono"
                    >
                      {v} fps
                    </Button>
                  ))}
                </div>
                <Slider
                  disabled={busy}
                  min={2}
                  max={20}
                  step={1}
                  value={[videoToGifFps]}
                  onValueChange={(v) => setVideoToGifFps(v[0] ?? 8)}
                />
                <p className="text-muted-foreground text-xs">
                  {videoToGifFps} fps · wider clips are scaled to max width{" "}
                  {videoToGifMaxWidth}px
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm">{t("gifMaxWidthLabel")}</Label>
                <div className="flex flex-wrap gap-2">
                  {[320, 480, 640].map((w) => (
                    <Button
                      key={w}
                      type="button"
                      size="sm"
                      variant={videoToGifMaxWidth === w ? "default" : "outline"}
                      disabled={busy}
                      onClick={() => setVideoToGifMaxWidth(w)}
                      className="font-mono"
                    >
                      {w}px
                    </Button>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  Real-world presets: 320px for small stickers, 480px for
                  app-like GIFs, 640px for sharper exports.
                </p>
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            disabled={busy || !convertFile}
            onClick={() => void onConvertRun()}
            className="w-fit gap-2"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {t("buttonGeneratePreview")}
          </Button>

          {outputPreviewUrl ? (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
              <Label className="text-sm">{t("outputPreviewLabel")}</Label>
              {outputPreviewKind === "mp4" ? (
                <video
                  src={outputPreviewUrl}
                  controls
                  playsInline
                  muted
                  className="w-full max-w-[520px] rounded-md border bg-background"
                />
              ) : (
                <img
                  src={outputPreviewUrl}
                  alt={t("outputPreviewAlt")}
                  className="w-full max-w-[520px] aspect-video rounded-md border bg-background object-contain"
                />
              )}
              <p className="text-muted-foreground text-xs">
                {t("outputPreviewNote")}
              </p>
              {pendingDownload ? (
                <Button
                  type="button"
                  onClick={() => {
                    downloadBlob(pendingDownload.blob, pendingDownload.name);
                    toast.success(t("toastDownloaded"));
                  }}
                  disabled={busy}
                  className="w-fit gap-2 self-start"
                >
                  <Download className="size-4" aria-hidden />
                  {t("buttonDownload")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {mode === "split" ? (
        <section className="flex flex-col gap-4 rounded-xl border bg-background p-4">
          <h2 className="font-semibold text-sm tracking-tight">
            {t("splitTitle")}
          </h2>
          <p className="text-muted-foreground text-xs">{t("splitDesc")}</p>
          <FileDropZone
            disabled={busy}
            busy={busy}
            inputId="gif-tools-split-input"
            accept="image/gif,video/*,.gif,.mp4,.webm,.mov"
            multiple={false}
            onFiles={(list) => {
              const f = list?.[0];
              if (f) setSplitFile(f);
            }}
            fileIcon={(p) => <Scissors {...p} />}
            dropTitle={splitFile ? t("dropReplaceTitle") : t("dropGifOrVideo")}
            dropHint={t("dropOneFileHint")}
            chooseLabel={splitFile ? t("chooseReplaceFile") : t("chooseFile")}
            fileHint={splitFile?.name ?? t("fileHintNoFileSelected")}
            size={splitFile ? "sm" : "md"}
          />
          <Button
            type="button"
            disabled={busy || !splitFile}
            onClick={() => void onSplitRun()}
            className="w-fit gap-2"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {t("buttonGenerateFramePreview")}
          </Button>

          {splitFramePreviewUrls.length ? (
            <div className="flex flex-col gap-2 pt-3">
              <Label className="text-sm">{t("framePreviewLabel")}</Label>
              <div className="grid grid-cols-6 gap-2">
                {splitFramePreviewUrls.map((u, i) => (
                  <img
                    key={u}
                    src={u}
                    alt={t("frameAlt", { index: i + 1 })}
                    className="h-16 w-16 rounded-md border bg-background object-contain"
                  />
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                {t("framePreviewNote")}
              </p>

              {pendingDownload ? (
                <Button
                  type="button"
                  onClick={() => {
                    downloadBlob(pendingDownload.blob, pendingDownload.name);
                    toast.success(t("toastDownloaded"));
                  }}
                  disabled={busy}
                  className="w-fit gap-2 self-start"
                >
                  <Download className="size-4" aria-hidden />
                  {t("buttonDownloadFramesZip")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {mode === "sequence" ? (
        <section className="flex flex-col gap-4 rounded-xl border bg-background p-4">
          <h2 className="font-semibold text-sm tracking-tight">
            {t("sequenceTitle")}
          </h2>
          <p className="text-muted-foreground text-xs">
            {t("sequenceDesc", { size: sequenceSize })}
          </p>
          <FileDropZone
            disabled={busy}
            busy={busy}
            inputId="gif-tools-seq-input"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            multiple
            onFiles={(list) => {
              if (!list?.length) return;
              setSeqFiles((prev) => [...prev, ...Array.from(list)]);
            }}
            fileIcon={(p) => <ImageIcon {...p} />}
            dropTitle={
              seqFiles.length
                ? t("sequenceDropMoreTitle")
                : t("sequenceDropHereTitle")
            }
            dropHint={t("sequenceDropHint")}
            chooseLabel={
              seqFiles.length
                ? t("sequenceAddImages")
                : t("sequenceChooseImages")
            }
            fileHint={t("sequenceFileHintQueued", { count: seqFiles.length })}
            size={seqFiles.length ? "sm" : "md"}
          />

          {seqFiles.length > 0 ? (
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border p-2 text-sm">
              {seqFiles.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="min-w-0 truncate">{f.name}</span>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy || i === 0}
                      onClick={() => {
                        setSeqFiles((prev) => {
                          if (i <= 0) return prev;
                          const next = [...prev];
                          const a = next[i - 1];
                          const b = next[i];
                          if (!a || !b) return prev;
                          next[i - 1] = b;
                          next[i] = a;
                          return next;
                        });
                      }}
                    >
                      Up
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy || i >= seqFiles.length - 1}
                      onClick={() => {
                        setSeqFiles((prev) => {
                          if (i >= prev.length - 1) return prev;
                          const next = [...prev];
                          const a = next[i];
                          const b = next[i + 1];
                          if (!a || !b) return prev;
                          next[i] = b;
                          next[i + 1] = a;
                          return next;
                        });
                      }}
                    >
                      Down
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        setSeqFiles((prev) => prev.filter((_, j) => j !== i));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label className="text-sm">{t("sequenceFpsLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {[2, 4, 6].map((v) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant={seqFps === v ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setSeqFps(v)}
                  className="font-mono"
                >
                  {v} fps
                </Button>
              ))}
            </div>
            <Slider
              disabled={busy}
              min={1}
              max={12}
              step={1}
              value={[seqFps]}
              onValueChange={(v) => setSeqFps(v[0] ?? 4)}
            />
            <p className="text-muted-foreground text-xs">{seqFps} fps</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm">{t("sequenceOutputSizeLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {[256, 480].map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={sequenceSize === s ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setSequenceSize(s)}
                  className="font-mono"
                >
                  {s}×{s}
                </Button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              {t("sequenceOutputSizeHint")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || seqFiles.length === 0}
              onClick={() => setSeqFiles([])}
            >
              {t("buttonClearList")}
            </Button>
            <Button
              type="button"
              disabled={busy || seqFiles.length < 2}
              onClick={() => void onSequenceRun()}
              className="gap-2"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              {t("buttonGenerateGifPreview")}
            </Button>
          </div>

          {outputPreviewUrl ? (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
              <Label className="text-sm">{t("outputPreviewLabel")}</Label>
              <img
                src={outputPreviewUrl}
                alt={t("generatedGifPreviewAlt")}
                className="w-full max-w-[520px] aspect-video rounded-md border bg-background object-contain"
              />
              <p className="text-muted-foreground text-xs">
                {t("outputPreviewNote")}
              </p>
              {pendingDownload ? (
                <Button
                  type="button"
                  onClick={() => {
                    downloadBlob(pendingDownload.blob, pendingDownload.name);
                    toast.success(t("toastDownloaded"));
                  }}
                  disabled={busy}
                  className="w-fit gap-2 self-start"
                >
                  <Download className="size-4" aria-hidden />
                  {t("buttonDownloadGif")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <Separator />
      <p className="text-muted-foreground text-xs">{t("footerNote")}</p>
    </div>
  );
}
