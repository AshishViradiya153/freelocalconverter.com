"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Download,
  Italic,
  RotateCcw,
  Shuffle,
  Sparkles,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { getMeshGradientCanvasElement } from "@/app/components/mesh-gradient-canvas";
import { MeshGradientQueryPresetSync } from "@/app/components/mesh-gradient-query-preset-sync";
import { MeshGradientPositionControl } from "@/app/components/mesh-gradient-position-control";
import { MeshGradientPreview } from "@/app/components/mesh-gradient-preview";
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
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useMeshGradientStore } from "@/stores/mesh-gradient-store";

const RESOLUTION_PRESETS = [
  { label: "1920 × 1080 (FHD)", width: 1920, height: 1080 },
  { label: "1080 × 1080 (Square)", width: 1080, height: 1080 },
  { label: "1080 × 1920 (Story)", width: 1080, height: 1920 },
  { label: "1280 × 720 (HD)", width: 1280, height: 720 },
] as const;

function downloadMeshPng() {
  const source = getMeshGradientCanvasElement();
  if (!source) {
    toast.error("Canvas not ready");
    return;
  }

  const s = useMeshGradientStore.getState();
  const temp = document.createElement("canvas");
  temp.width = s.resolution.width;
  temp.height = s.resolution.height;
  const ctx = temp.getContext("2d");
  if (!ctx) {
    toast.error("Could not export");
    return;
  }
  ctx.drawImage(source, 0, 0);
  const url = temp.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `mesh-gradient-${s.resolution.width}x${s.resolution.height}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast.success("Download started");
}

export function MeshGradientApp() {
  const t = useTranslations("pageMeta");
  const circles = useMeshGradientStore((s) => s.circles);
  const backgroundColor = useMeshGradientStore((s) => s.backgroundColor);
  const blur = useMeshGradientStore((s) => s.blur);
  const grainIntensity = useMeshGradientStore((s) => s.grainIntensity);
  const saturation = useMeshGradientStore((s) => s.saturation);
  const contrast = useMeshGradientStore((s) => s.contrast);
  const brightness = useMeshGradientStore((s) => s.brightness);
  const resolution = useMeshGradientStore((s) => s.resolution);

  const setBackgroundColor = useMeshGradientStore((s) => s.setBackgroundColor);
  const updateCircleColor = useMeshGradientStore((s) => s.updateCircleColor);
  const shufflePositions = useMeshGradientStore((s) => s.shufflePositions);
  const resetPalette = useMeshGradientStore((s) => s.resetPalette);
  const applyHarmoniousPalette = useMeshGradientStore(
    (s) => s.applyHarmoniousPalette,
  );
  const setBlur = useMeshGradientStore((s) => s.setBlur);
  const setGrainIntensity = useMeshGradientStore((s) => s.setGrainIntensity);
  const setSaturation = useMeshGradientStore((s) => s.setSaturation);
  const setContrast = useMeshGradientStore((s) => s.setContrast);
  const setBrightness = useMeshGradientStore((s) => s.setBrightness);
  const setResolution = useMeshGradientStore((s) => s.setResolution);

  const text = useMeshGradientStore((s) => s.text);
  const textColor = useMeshGradientStore((s) => s.textColor);
  const textAlign = useMeshGradientStore((s) => s.textAlign);
  const textPosition = useMeshGradientStore((s) => s.textPosition);
  const textShadow = useMeshGradientStore((s) => s.textShadow);
  const fontSize = useMeshGradientStore((s) => s.fontSize);
  const fontWeight = useMeshGradientStore((s) => s.fontWeight);
  const opacityText = useMeshGradientStore((s) => s.opacity);
  const lineHeight = useMeshGradientStore((s) => s.lineHeight);
  const letterSpacing = useMeshGradientStore((s) => s.letterSpacing);
  const isItalic = useMeshGradientStore((s) => s.isItalic);
  const isUnderline = useMeshGradientStore((s) => s.isUnderline);
  const isStrikethrough = useMeshGradientStore((s) => s.isStrikethrough);

  const setText = useMeshGradientStore((s) => s.setText);
  const setTextColor = useMeshGradientStore((s) => s.setTextColor);
  const setTextAlign = useMeshGradientStore((s) => s.setTextAlign);
  const setTextPosition = useMeshGradientStore((s) => s.setTextPosition);
  const setTextShadow = useMeshGradientStore((s) => s.setTextShadow);
  const setFontSize = useMeshGradientStore((s) => s.setFontSize);
  const setFontWeight = useMeshGradientStore((s) => s.setFontWeight);
  const setOpacity = useMeshGradientStore((s) => s.setOpacity);
  const setLineHeight = useMeshGradientStore((s) => s.setLineHeight);
  const setLetterSpacing = useMeshGradientStore((s) => s.setLetterSpacing);
  const setIsItalic = useMeshGradientStore((s) => s.setIsItalic);
  const setIsUnderline = useMeshGradientStore((s) => s.setIsUnderline);
  const setIsStrikethrough = useMeshGradientStore((s) => s.setIsStrikethrough);

  const presetMatch = RESOLUTION_PRESETS.find(
    (p) => p.width === resolution.width && p.height === resolution.height,
  );
  const resolutionSelectValue = presetMatch?.label ?? "__custom__";

  return (
    <div className="container flex flex-col gap-6 py-6">
      <MeshGradientQueryPresetSync />
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-2xl tracking-tight">
          Mesh gradient generator
        </h1>
        <p className="max-w-2xl text-muted-foreground text-sm">
          Soft color fields from blurred blobs on canvas, with harmonious palettes,
          grain, and PNG export. Distinct from the CSS linear-gradient tool at{" "}
          <span className="text-foreground/80">/gradients</span>.
        </p>
        <p className="text-sm">
          <Link
            href="/gradient-generator/trending"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("meshGradient.browseTrending")}
          </Link>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,440px)] lg:items-start">
        <div className="lg:sticky lg:top-20 lg:z-10 lg:w-full lg:self-start">
          <MeshGradientPreview />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                applyHarmoniousPalette();
                toast.success("New harmonious palette");
              }}
            >
              <Sparkles className="size-4" />
              Harmonize
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => shufflePositions()}
            >
              <Shuffle className="size-4" />
              Shuffle positions
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                resetPalette();
                toast.message("Reset to default colors");
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => downloadMeshPng()}
            >
              <Download className="size-4" />
              PNG
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mesh-resolution">Export size</Label>
            <Select
              value={resolutionSelectValue}
              onValueChange={(v) => {
                if (v === "__custom__") return;
                const preset = RESOLUTION_PRESETS.find((p) => p.label === v);
                if (preset) {
                  setResolution({ width: preset.width, height: preset.height });
                }
              }}
            >
              <SelectTrigger id="mesh-resolution" className="w-full">
                <SelectValue placeholder="Resolution" />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_PRESETS.map((p) => (
                  <SelectItem key={p.label} value={p.label}>
                    {p.label}
                  </SelectItem>
                ))}
                {!presetMatch ? (
                  <SelectItem value="__custom__" disabled>
                    Custom ({resolution.width} × {resolution.height})
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="font-medium text-sm">Text on image</p>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Title or short copy"
              rows={3}
              className="min-h-[72px] resize-y font-sans text-sm"
            />
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <Label>Text color</Label>
                <span className="font-mono text-muted-foreground text-xs">
                  {textColor}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="color"
                  aria-label="Text color"
                  className="h-10 w-14 cursor-pointer p-1"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(textColor) ? textColor : "#f1f1f1"
                  }
                  onChange={(e) => setTextColor(e.target.value)}
                />
                <Input
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Alignment</Label>
              <ToggleGroup
                type="single"
                value={textAlign}
                onValueChange={(v) => {
                  if (v === "left" || v === "center" || v === "right") {
                    setTextAlign(v);
                  }
                }}
                variant="outline"
                className="w-full justify-stretch *:flex-1"
              >
                <ToggleGroupItem value="left" aria-label="Align left">
                  <AlignLeft className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Align center">
                  <AlignCenter className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Align right">
                  <AlignRight className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-wrap gap-1">
              <Toggle
                pressed={isItalic}
                onPressedChange={setIsItalic}
                variant="outline"
                size="sm"
                aria-label="Italic"
              >
                <Italic className="size-4" />
              </Toggle>
              <Toggle
                pressed={isUnderline}
                onPressedChange={setIsUnderline}
                variant="outline"
                size="sm"
                aria-label="Underline"
              >
                <Underline className="size-4" />
              </Toggle>
              <Toggle
                pressed={isStrikethrough}
                onPressedChange={setIsStrikethrough}
                variant="outline"
                size="sm"
                aria-label="Strikethrough"
              >
                <Strikethrough className="size-4" />
              </Toggle>
            </div>

            <SliderRow
              label="Type size"
              value={fontSize}
              min={1}
              max={14}
              step={0.25}
              onValueChange={setFontSize}
              suffix=" em"
            />
            <SliderRow
              label="Weight"
              value={fontWeight}
              min={100}
              max={900}
              step={100}
              onValueChange={setFontWeight}
              suffix=""
            />
            <SliderRow
              label="Text opacity"
              value={opacityText}
              min={0}
              max={100}
              step={1}
              onValueChange={setOpacity}
              suffix="%"
            />
            <SliderRow
              label="Line height"
              value={lineHeight}
              min={0.8}
              max={2}
              step={0.05}
              onValueChange={setLineHeight}
              suffix=""
            />
            <SliderRow
              label="Letter spacing"
              value={letterSpacing}
              min={-0.08}
              max={0.2}
              step={0.01}
              onValueChange={setLetterSpacing}
              suffix=" em"
            />

            <p className="pt-1 font-medium text-muted-foreground text-xs">
              Shadow
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <Label className="text-xs">Shadow color</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type="color"
                  aria-label="Shadow color"
                  className="h-9 w-12 cursor-pointer p-1"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(textShadow.color)
                      ? textShadow.color
                      : "#f5f5f5"
                  }
                  onChange={(e) => setTextShadow({ color: e.target.value })}
                />
                <Input
                  value={textShadow.color}
                  onChange={(e) => setTextShadow({ color: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <SliderRow
              label="Shadow blur"
              value={textShadow.blur}
              min={0}
              max={80}
              step={1}
              onValueChange={(n) => setTextShadow({ blur: n })}
              suffix=" px"
            />
            <SliderRow
              label="Shadow X"
              value={textShadow.offsetX}
              min={-40}
              max={40}
              step={1}
              onValueChange={(n) => setTextShadow({ offsetX: n })}
              suffix=" px"
            />
            <SliderRow
              label="Shadow Y"
              value={textShadow.offsetY}
              min={-40}
              max={40}
              step={1}
              onValueChange={(n) => setTextShadow({ offsetY: n })}
              suffix=" px"
            />

            <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
              <MeshGradientPositionControl
                value={textPosition}
                onChange={setTextPosition}
                width={resolution.width}
                height={resolution.height}
                className="max-h-[120px] max-w-[min(100%,160px)]"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <Label>Background</Label>
              <span className="font-mono text-muted-foreground text-xs">
                {backgroundColor}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                type="color"
                aria-label="Background color"
                className="h-10 w-14 cursor-pointer p-1"
                value={
                  /^#[0-9A-Fa-f]{6}$/.test(backgroundColor)
                    ? backgroundColor
                    : "#001220"
                }
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <SliderRow
            label="Blur"
            value={blur}
            min={0}
            max={800}
            step={10}
            onValueChange={setBlur}
            suffix=""
          />
          <SliderRow
            label="Grain"
            value={grainIntensity}
            min={0}
            max={100}
            step={1}
            onValueChange={setGrainIntensity}
            suffix="%"
          />
          <SliderRow
            label="Saturation"
            value={saturation}
            min={0}
            max={200}
            step={1}
            onValueChange={setSaturation}
            suffix="%"
          />
          <SliderRow
            label="Contrast"
            value={contrast}
            min={0}
            max={200}
            step={1}
            onValueChange={setContrast}
            suffix="%"
          />
          <SliderRow
            label="Brightness"
            value={brightness}
            min={0}
            max={200}
            step={1}
            onValueChange={setBrightness}
            suffix="%"
          />

          <Separator />

          <p className="font-medium text-muted-foreground text-xs">
            Blob colors ({circles.length})
          </p>
          <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {circles.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="color"
                  aria-label={`Color ${i + 1}`}
                  className="h-9 w-11 shrink-0 cursor-pointer p-1"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(c.color) ? c.color : "#000000"
                  }
                  onChange={(e) => updateCircleColor(i, e.target.value)}
                />
                <Input
                  value={c.color}
                  onChange={(e) => updateCircleColor(i, e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onValueChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onValueChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <Label>{label}</Label>
        <span className="text-muted-foreground tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onValueChange(v[0] ?? value)}
        className={cn("py-1")}
      />
    </div>
  );
}
