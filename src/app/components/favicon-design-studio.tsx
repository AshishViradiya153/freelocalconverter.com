"use client";

import { Loader2, Package, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ToolPane, ToolSectionHeading } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { downloadBlob } from "@/lib/download-blob";
import { buildFaviconZipFromImageFile } from "@/lib/favicon-pack/build-favicon-zip";
import {
  LINEAR_GRADIENT_PRESETS,
  MESH_GRADIENT_PRESETS,
  TEXT_FONT_PRESETS,
} from "@/lib/favicon-pack/design-presets";
import {
  buildDesignedSpec,
  canvasToPngFile,
  renderDesignedFaviconCanvas,
} from "@/lib/favicon-pack/render-designed-favicon";
import { cn } from "@/lib/utils";

const QUICK_EMOJIS = [
  "🚀",
  "⭐",
  "🔥",
  "💡",
  "🎯",
  "🛡️",
  "⚡",
  "🌊",
  "🍀",
  "🎨",
  "📌",
  "✨",
  "❤️",
  "🐱",
  "☕",
  "🎵",
  "🏠",
  "⚙️",
  "📁",
  "🔔",
] as const;

function zipBaseName(sourceMode: "text" | "emoji", text: string): string {
  if (sourceMode === "emoji") return "emoji-favicon";
  const s = text
    .trim()
    .slice(0, 24)
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return s || "favicon";
}

export interface FaviconDesignStudioProps {
  sourceMode: "text" | "emoji";
  disabled?: boolean;
}

export function FaviconDesignStudio({
  sourceMode,
  disabled = false,
}: FaviconDesignStudioProps) {
  const t = useTranslations("faviconGenerator");
  const [busy, setBusy] = React.useState(false);
  const [bgKind, setBgKind] = React.useState<"solid" | "linear" | "mesh">(
    "mesh",
  );
  const [solidColor, setSolidColor] = React.useState("#4f46e5");
  const [linearPresetId, setLinearPresetId] = React.useState(
    LINEAR_GRADIENT_PRESETS[1]?.id ?? LINEAR_GRADIENT_PRESETS[0]!.id,
  );
  const [customLinearFrom, setCustomLinearFrom] = React.useState("#6366f1");
  const [customLinearTo, setCustomLinearTo] = React.useState("#ec4899");
  const [useCustomLinear, setUseCustomLinear] = React.useState(false);
  const [meshPresetId, setMeshPresetId] = React.useState(
    MESH_GRADIENT_PRESETS[0]!.id,
  );
  const [textValue, setTextValue] = React.useState("A");
  const [emojiValue, setEmojiValue] = React.useState("🚀");
  const [textColor, setTextColor] = React.useState("#ffffff");
  const [fontPresetId, setFontPresetId] = React.useState(
    TEXT_FONT_PRESETS[0]!.id,
  );

  const fontStack = React.useMemo(() => {
    return (
      TEXT_FONT_PRESETS.find((f) => f.id === fontPresetId)?.stack ??
      TEXT_FONT_PRESETS[0]!.stack
    );
  }, [fontPresetId]);

  const spec = React.useMemo(
    () =>
      buildDesignedSpec({
        bgKind,
        solidColor,
        linearPresetId,
        customLinearFrom,
        customLinearTo,
        useCustomLinear,
        meshPresetId,
        sourceMode,
        textValue,
        emojiValue,
        textColor,
        fontStack,
      }),
    [
      bgKind,
      solidColor,
      linearPresetId,
      customLinearFrom,
      customLinearTo,
      useCustomLinear,
      meshPresetId,
      sourceMode,
      textValue,
      emojiValue,
      textColor,
      fontStack,
    ],
  );

  const previewRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const master = renderDesignedFaviconCanvas(spec);
    const ctx = el.getContext("2d");
    if (!ctx) return;
    el.width = master.width;
    el.height = master.height;
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.drawImage(master, 0, 0);
  }, [spec]);

  const onGenerate = React.useCallback(async () => {
    setBusy(true);
    try {
      const canvas = renderDesignedFaviconCanvas(spec);
      const base = zipBaseName(sourceMode, textValue);
      const file = await canvasToPngFile(canvas, `${base}-source.png`);
      const { baseName, zipBytes } = await buildFaviconZipFromImageFile(file);
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
  }, [spec, sourceMode, textValue, t]);

  const locked = disabled || busy;

  return (
    <div className="flex flex-col gap-6">
      <ToolSectionHeading className="flex items-center gap-2">
        <Sparkles className="size-4 shrink-0" aria-hidden />
        {t("designSectionTitle")}
      </ToolSectionHeading>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <ToolPane className="flex w-full flex-col gap-4 border border-border/50 p-4 lg:max-w-84 lg:shrink-0">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              {t("designBgKindLabel")}
            </Label>
            <ToggleGroup
              type="single"
              value={bgKind}
              onValueChange={(v) => {
                if (v === "solid" || v === "linear" || v === "mesh") {
                  setBgKind(v);
                }
              }}
              variant="outline"
              size="sm"
              className="flex flex-wrap gap-1"
              disabled={locked}
            >
              <ToggleGroupItem value="solid" className="font-mono text-xs">
                {t("designBgSolid")}
              </ToggleGroupItem>
              <ToggleGroupItem value="linear" className="font-mono text-xs">
                {t("designBgLinear")}
              </ToggleGroupItem>
              <ToggleGroupItem value="mesh" className="font-mono text-xs">
                {t("designBgMesh")}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {bgKind === "solid" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="favicon-solid-color">
                {t("designSolidColor")}
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="favicon-solid-color"
                  type="color"
                  value={solidColor}
                  onChange={(e) => setSolidColor(e.target.value)}
                  disabled={locked}
                  className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                />
                <Input
                  value={solidColor}
                  onChange={(e) => setSolidColor(e.target.value)}
                  disabled={locked}
                  className="max-w-[140px] font-mono text-sm"
                  spellCheck={false}
                />
              </div>
            </div>
          ) : null}

          {bgKind === "linear" ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="favicon-custom-linear"
                  checked={useCustomLinear}
                  onCheckedChange={(c) => setUseCustomLinear(c === true)}
                  disabled={locked}
                />
                <Label
                  htmlFor="favicon-custom-linear"
                  className="cursor-pointer font-normal text-sm"
                >
                  {t("designCustomGradient")}
                </Label>
              </div>
              {useCustomLinear ? (
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>{t("designGradientFrom")}</Label>
                    <input
                      type="color"
                      value={customLinearFrom}
                      onChange={(e) => setCustomLinearFrom(e.target.value)}
                      disabled={locked}
                      className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("designGradientTo")}</Label>
                    <input
                      type="color"
                      value={customLinearTo}
                      onChange={(e) => setCustomLinearTo(e.target.value)}
                      disabled={locked}
                      className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label>{t("designGradientPreset")}</Label>
                  <Select
                    value={linearPresetId}
                    onValueChange={setLinearPresetId}
                    disabled={locked}
                  >
                    <SelectTrigger className="w-full max-w-md font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINEAR_GRADIENT_PRESETS.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          className="font-mono text-xs"
                        >
                          {t(`linearPreset.${p.id}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : null}

          {bgKind === "mesh" ? (
            <div className="flex flex-col gap-2">
              <Label>{t("designMeshPreset")}</Label>
              <div className="flex flex-wrap gap-2">
                {MESH_GRADIENT_PRESETS.map((p) => {
                  const b0 = p.blobs[0];
                  const b1 = p.blobs[1];
                  const meshPreview =
                    b0 && b1
                      ? `radial-gradient(circle at 28% 32%, ${b0.color}aa, transparent 58%), radial-gradient(circle at 72% 62%, ${b1.color}99, transparent 52%), ${p.base}`
                      : p.base;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={locked}
                      title={t(`meshPreset.${p.id}`)}
                      onClick={() => setMeshPresetId(p.id)}
                      className={cn(
                        "size-11 rounded-lg border-2 transition-colors",
                        meshPresetId === p.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-border",
                      )}
                      style={{ background: meshPreview }}
                    >
                      <span className="sr-only">{t(`meshPreset.${p.id}`)}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-muted-foreground text-xs">
                {t("designMeshHint")}
              </p>
            </div>
          ) : null}

          <div className="border-border/60 border-t pt-4">
            {sourceMode === "text" ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="favicon-design-text">
                    {t("designTextLabel")}
                  </Label>
                  <Input
                    id="favicon-design-text"
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value.slice(0, 3))}
                    maxLength={3}
                    disabled={locked}
                    className="max-w-xs font-mono text-lg tracking-tight"
                    placeholder={t("designTextPlaceholder")}
                  />
                  <p className="text-muted-foreground text-xs">
                    {t("designTextHint")}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t("designFontLabel")}</Label>
                  <Select
                    value={fontPresetId}
                    onValueChange={setFontPresetId}
                    disabled={locked}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEXT_FONT_PRESETS.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {t(`fontPreset.${f.id}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="favicon-text-color">
                    {t("designTextColor")}
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="favicon-text-color"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      disabled={locked}
                      className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      disabled={locked}
                      className="max-w-[140px] font-mono text-sm"
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="favicon-design-emoji">
                    {t("designEmojiLabel")}
                  </Label>
                  <Input
                    id="favicon-design-emoji"
                    value={emojiValue}
                    onChange={(e) => setEmojiValue(e.target.value)}
                    disabled={locked}
                    className="max-w-xs font-mono text-2xl"
                    placeholder={t("designEmojiPlaceholder")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">
                    {t("designEmojiQuick")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        disabled={locked}
                        className={cn(
                          "flex size-10 items-center justify-center rounded-md border border-border/80 bg-muted/30 text-xl transition-colors hover:bg-muted",
                          emojiValue === em && "ring-2 ring-primary",
                        )}
                        onClick={() => setEmojiValue(em)}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ToolPane>

        <ToolPane className="flex w-full min-w-0 flex-1 flex-col items-center gap-4 border border-border/50 p-4 lg:py-6">
          <span className="text-muted-foreground text-xs uppercase tracking-wide">
            {t("designPreviewLabel")}
          </span>
          <canvas
            ref={previewRef}
            className="aspect-square w-full max-w-[min(100%,26rem)] rounded-xl border border-border/80 bg-muted/20 shadow-sm"
            style={{ imageRendering: "auto" }}
          />
          <Button
            type="button"
            className="w-full gap-2 rounded-none font-bold font-mono uppercase"
            onClick={() => void onGenerate()}
            disabled={locked}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Package className="size-4" aria-hidden />
            )}
            {busy ? t("ctaWorking") : t("ctaDownload")}
          </Button>
        </ToolPane>
      </div>
    </div>
  );
}
