"use client";

import {
  Image as ImageIcon,
  Loader2,
  Package,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
  ToolSectionHeading,
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { downloadBlob } from "@/lib/download-blob";
import { buildFaviconZipFromImageFile } from "@/lib/favicon-pack/build-favicon-zip";
import { cn } from "@/lib/utils";

function isRasterImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif)$/i.test(file.name);
}

function ImageGlyph(props: {
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <ImageIcon className={props.className} aria-hidden={props["aria-hidden"]} />
  );
}

export function FaviconGeneratorApp() {
  const t = useTranslations("faviconGenerator");
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const previewUrl = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const onPickFiles = React.useCallback(
    (files: FileList | null) => {
      const next = files?.[0];
      if (!next) return;
      if (!isRasterImageFile(next)) {
        toast.error(t("toastNotImage"));
        return;
      }
      setFile(next);
    },
    [t],
  );

  const onGenerate = React.useCallback(async () => {
    if (!file) {
      toast.error(t("toastNoFile"));
      return;
    }
    setBusy(true);
    try {
      const { baseName, zipBytes } = await buildFaviconZipFromImageFile(file);
      const blob = new Blob([zipBytes], { type: "application/zip" });
      downloadBlob(blob, `${baseName}-favicon-pack.zip`);
      toast.success(t("toastSuccess"));
    } catch (e) {
      console.error({ err: e });
      toast.error(t("toastError"));
    } finally {
      setBusy(false);
    }
  }, [file, t]);

  return (
    <ToolPage>
      <ToolHero
        icon={<ImageIcon className="size-8 md:size-9" aria-hidden />}
        title={t("heroTitle")}
        description={t("heroDescription")}
      />

      <ToolCard className="flex flex-col gap-6">
        <ToolSectionHeading>{t("sectionInput")}</ToolSectionHeading>
        <FileDropZone
          disabled={busy}
          busy={busy}
          inputId="favicon-generator-input"
          accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.gif,.bmp,.tif,.tiff,.heic,.heif"
          multiple={false}
          onFiles={onPickFiles}
          fileIcon={ImageGlyph}
          dropTitle={t("dropTitle")}
          dropHint={t("dropHint")}
          chooseLabel={t("chooseLabel")}
          chooseLabelWhenFileSelected={t("chooseReplace")}
          fileName={file?.name ?? null}
          fileHint={t("fileHint")}
          size="md"
        />

        {file ? (
          <ToolPane className="gap-4 border-border/60 border-t pt-4">
            <ToolPaneTitle>{t("previewLabel")}</ToolPaneTitle>
            <div className="flex flex-wrap items-end gap-4">
              {previewUrl ? (
                // biome-ignore lint/performance/noImgElement: object URL preview
                <img
                  src={previewUrl}
                  alt=""
                  className="size-24 border-2 border-border bg-muted object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className={cn("gap-2 rounded-none font-bold font-mono uppercase")}
                onClick={() => void onGenerate()}
                disabled={busy}
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
                className="gap-2 rounded-none font-mono uppercase"
                onClick={() => setFile(null)}
                disabled={busy}
              >
                <Trash2 className="size-4" aria-hidden />
                {t("ctaClear")}
              </Button>
            </div>
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
