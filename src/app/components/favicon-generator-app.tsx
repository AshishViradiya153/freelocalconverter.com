"use client";

import {
  ClipboardPaste,
  Image as ImageIcon,
  Loader2,
  Package,
  RotateCw,
  Smile,
  Trash2,
  Type,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
  FaviconCropEditor,
  type FaviconCropEditorLabels,
} from "@/app/components/favicon-crop-editor";
import { FaviconDesignStudio } from "@/app/components/favicon-design-studio";
import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolSectionHeading,
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { downloadBlob } from "@/lib/download-blob";
import {
  buildFaviconZipFromImageFile,
  faviconPackBaseNameFromUploadName,
} from "@/lib/favicon-pack/build-favicon-zip";
import {
  type ImageRotationDeg,
  isSupportedFaviconImageFile,
  rasterizeImageFileToPngFile,
} from "@/lib/favicon-pack/rasterize-image-file";
import type { CenterSquareCrop } from "@/lib/favicon-pack/render-square-png";
import { computeCenterSquareCrop } from "@/lib/favicon-pack/render-square-png";
import { cn } from "@/lib/utils";

const LARGE_IMAGE_PIXELS = 25_000_000;

function ImageGlyph(props: { className?: string; "aria-hidden"?: boolean }) {
  return (
    <ImageIcon className={props.className} aria-hidden={props["aria-hidden"]} />
  );
}

function nextRotation(r: ImageRotationDeg): ImageRotationDeg {
  const n = (r + 90) % 360;
  return n as ImageRotationDeg;
}

function isEditablePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("[data-skip-favicon-paste]")) return true;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return true;
  }
  return target.isContentEditable;
}

type SourceMode = "text" | "emoji" | "image";

export function FaviconGeneratorApp() {
  const t = useTranslations("faviconGenerator");
  const [sourceMode, setSourceMode] = React.useState<SourceMode>("image");
  const [originalFile, setOriginalFile] = React.useState<File | null>(null);
  const [workingFile, setWorkingFile] = React.useState<File | null>(null);
  const [rotationDeg, setRotationDeg] = React.useState<ImageRotationDeg>(0);
  const [rasterBusy, setRasterBusy] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [imgMeta, setImgMeta] = React.useState<{
    w: number;
    h: number;
  } | null>(null);
  const [crop, setCrop] = React.useState<CenterSquareCrop | null>(null);
  const pasteRegionRef = React.useRef<HTMLDivElement | null>(null);

  const workingPreviewUrl = React.useMemo(
    () => (workingFile ? URL.createObjectURL(workingFile) : null),
    [workingFile],
  );

  React.useEffect(
    () => () => {
      if (workingPreviewUrl) URL.revokeObjectURL(workingPreviewUrl);
    },
    [workingPreviewUrl],
  );

  React.useEffect(() => {
    if (sourceMode !== "image") {
      setOriginalFile(null);
      setWorkingFile(null);
      setRotationDeg(0);
      setImgMeta(null);
      setCrop(null);
      setRasterBusy(false);
    }
  }, [sourceMode]);

  React.useEffect(() => {
    if (!originalFile) {
      setWorkingFile(null);
      setImgMeta(null);
      setCrop(null);
      setRasterBusy(false);
      return;
    }

    let cancelled = false;
    setRasterBusy(true);
    void rasterizeImageFileToPngFile(originalFile, rotationDeg).then(
      ({ file, width, height }) => {
        if (cancelled) return;
        setWorkingFile(file);
        setImgMeta({ w: width, h: height });
        setCrop(computeCenterSquareCrop(width, height));
        setRasterBusy(false);
      },
      (e) => {
        console.error({ err: e });
        if (!cancelled) {
          toast.error(t("toastLoadError"));
          setOriginalFile(null);
          setWorkingFile(null);
          setImgMeta(null);
          setCrop(null);
          setRasterBusy(false);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [originalFile, rotationDeg, t]);

  React.useEffect(() => {
    if (sourceMode !== "image" || busy || rasterBusy) return;

    function onDocumentPaste(e: ClipboardEvent) {
      if (isEditablePasteTarget(e.target)) return;
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      for (const item of items) {
        if (item.kind !== "file") continue;
        const f = item.getAsFile();
        if (f && isSupportedFaviconImageFile(f)) {
          e.preventDefault();
          setRotationDeg(0);
          setOriginalFile(f);
          toast.success(t("toastPasteOk"));
          return;
        }
      }
    }

    document.addEventListener("paste", onDocumentPaste);
    return () => document.removeEventListener("paste", onDocumentPaste);
  }, [sourceMode, busy, rasterBusy, t]);

  const onPickFiles = React.useCallback(
    (files: FileList | null) => {
      const next = files?.[0];
      if (!next) return;
      if (!isSupportedFaviconImageFile(next)) {
        toast.error(t("toastNotImage"));
        return;
      }
      setRotationDeg(0);
      setOriginalFile(next);
    },
    [t],
  );

  const onPasteRegionPaste = React.useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      for (const item of items) {
        if (item.kind !== "file") continue;
        const f = item.getAsFile();
        if (f && isSupportedFaviconImageFile(f)) {
          e.preventDefault();
          setRotationDeg(0);
          setOriginalFile(f);
          toast.success(t("toastPasteOk"));
          return;
        }
      }
      toast.error(t("toastPasteNoImage"));
    },
    [t],
  );

  const onGenerate = React.useCallback(async () => {
    if (!workingFile || !originalFile || !crop) {
      toast.error(t("toastNoFile"));
      return;
    }
    setBusy(true);
    try {
      const { baseName, zipBytes } = await buildFaviconZipFromImageFile(
        workingFile,
        {
          crop,
          baseName: faviconPackBaseNameFromUploadName(originalFile.name),
        },
      );
      const blob = new Blob([new Uint8Array(zipBytes)], {
        type: "application/zip",
      });
      downloadBlob(blob, `${baseName}-favicon-pack.zip`);
      toast.success(t("toastSuccess"));
    } catch (e) {
      console.error({ err: e });
      toast.error(t("toastError"));
    } finally {
      setBusy(false);
    }
  }, [crop, originalFile, workingFile, t]);

  const cropLabels = React.useMemo((): FaviconCropEditorLabels => {
    return {
      sectionTitle: t("cropSection"),
      hint: t("cropHint"),
      zoomLabel: t("cropZoomLabel"),
      zoomHint: t("cropZoomHint"),
      previewLabel: t("resultPreviewLabel"),
      previewNote: t("previewFramingNote"),
      resetLabel: t("resetCrop"),
      cropAriaLabel: t("cropAriaLabel"),
      dragBadge: t("dragCropBadge"),
      editorImageAlt: t("editorImageAlt"),
      dimensionsLine:
        imgMeta && crop
          ? t("cropDimensionsSummary", {
              w: imgMeta.w,
              h: imgMeta.h,
              size: crop.side,
            })
          : "",
    };
  }, [t, imgMeta, crop]);

  const imageLocked = busy || rasterBusy;
  const showCrop =
    sourceMode === "image" &&
    originalFile &&
    workingFile &&
    workingPreviewUrl &&
    imgMeta &&
    crop &&
    !rasterBusy;

  const largeImage = imgMeta && imgMeta.w * imgMeta.h > LARGE_IMAGE_PIXELS;

  return (
    <ToolPage>
      <ToolHero
        icon={<ImageIcon className="size-8 md:size-9" aria-hidden />}
        title={t("heroTitle")}
        description={t("heroDescription")}
      />

      <ToolCard className="flex flex-col gap-6">
        <ToolSectionHeading>{t("sectionInput")}</ToolSectionHeading>
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs uppercase tracking-wide">
            {t("sourceModeLabel")}
          </span>
          <ToggleGroup
            type="single"
            value={sourceMode}
            onValueChange={(v) => {
              if (v === "text" || v === "emoji" || v === "image") {
                setSourceMode(v);
              }
            }}
            variant="outline"
            size="sm"
            className="flex flex-wrap gap-1"
            disabled={busy}
          >
            <ToggleGroupItem value="text" className="gap-1.5 font-mono text-xs">
              <Type className="size-3.5" aria-hidden />
              {t("sourceModeText")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="emoji"
              className="gap-1.5 font-mono text-xs"
            >
              <Smile className="size-3.5" aria-hidden />
              {t("sourceModeEmoji")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="image"
              className="gap-1.5 font-mono text-xs"
            >
              <ImageIcon className="size-3.5" aria-hidden />
              {t("sourceModeImage")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {sourceMode === "text" || sourceMode === "emoji" ? (
          <FaviconDesignStudio sourceMode={sourceMode} disabled={busy} />
        ) : null}

        {sourceMode === "image" ? (
          <div
            ref={pasteRegionRef}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: focus target for paste after "Focus import area"
            tabIndex={0}
            role="region"
            aria-label={t("pasteRegionLabel")}
            aria-describedby="favicon-paste-hint"
            onPaste={onPasteRegionPaste}
            className="flex flex-col gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <p
              id="favicon-paste-hint"
              className="text-muted-foreground text-xs leading-relaxed"
            >
              {t("pasteInstructions")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 font-mono text-xs uppercase"
                disabled={imageLocked}
                onClick={() => pasteRegionRef.current?.focus()}
              >
                <ClipboardPaste className="size-3.5" aria-hidden />
                {t("pasteFocusButton")}
              </Button>
            </div>
            <FileDropZone
              disabled={imageLocked}
              busy={busy || rasterBusy}
              inputId="favicon-generator-input"
              accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.gif,.bmp,.tif,.tiff,.heic,.heif,.svg,.ico"
              multiple={false}
              onFiles={onPickFiles}
              fileIcon={ImageGlyph}
              dropTitle={t("dropTitle")}
              dropHint={t("dropHint")}
              chooseLabel={t("chooseLabel")}
              chooseLabelWhenFileSelected={t("chooseReplace")}
              fileName={originalFile?.name ?? null}
              fileHint={t("fileHint")}
              size="md"
            />
            {rasterBusy ? (
              <p
                className="flex items-center gap-2 text-muted-foreground text-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                {t("statusRasterizing")}
              </p>
            ) : null}
          </div>
        ) : null}

        {showCrop ? (
          <ToolPane className="flex flex-col gap-6 border-border/60 border-t pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 font-mono text-xs uppercase"
                disabled={busy}
                onClick={() => setRotationDeg((r) => nextRotation(r))}
                aria-label={t("rotate90Aria")}
              >
                <RotateCw className="size-3.5" aria-hidden />
                {t("rotate90Label")}
              </Button>
              {largeImage ? (
                <p className="text-amber-600 text-xs dark:text-amber-500">
                  {t("largeImageWarning")}
                </p>
              ) : null}
            </div>

            <FaviconCropEditor
              imageUrl={workingPreviewUrl}
              imageWidth={imgMeta.w}
              imageHeight={imgMeta.h}
              crop={crop}
              onCropChange={setCrop}
              disabled={busy}
              labels={cropLabels}
              previewActions={
                <>
                  <Button
                    type="button"
                    className={cn(
                      "w-full gap-2 rounded-none font-bold font-mono uppercase",
                    )}
                    onClick={() => void onGenerate()}
                    disabled={busy || !crop}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Package className="size-4" aria-hidden />
                    )}
                    {busy ? t("ctaWorking") : t("ctaDownload")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 rounded-none font-mono uppercase"
                    onClick={() => {
                      setOriginalFile(null);
                      setWorkingFile(null);
                      setRotationDeg(0);
                      setImgMeta(null);
                      setCrop(null);
                    }}
                    disabled={busy}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    {t("ctaClear")}
                  </Button>
                </>
              }
            />
          </ToolPane>
        ) : null}
      </ToolCard>

      <ToolCard>
        <ToolSectionHeading className="flex items-center gap-2">
          <Package className="size-4 shrink-0" aria-hidden />
          {t("sectionZip")}
        </ToolSectionHeading>
        <ul className="mt-3 list-inside list-disc space-y-1 text-muted-foreground text-sm">
          <li>favicon.ico</li>
          <li>favicon-16x16.png</li>
          <li>favicon-32x32.png</li>
          <li>apple-touch-icon.png</li>
          <li>android-chrome-192x192.png</li>
          <li>android-chrome-512x512.png</li>
          <li>site.webmanifest</li>
        </ul>
        <p className="mt-4 text-muted-foreground text-xs leading-relaxed">
          {t("zipNote")}
        </p>
      </ToolCard>
    </ToolPage>
  );
}
