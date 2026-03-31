"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  ChevronDown,
  Code,
  Copy,
  Image as ImageIcon,
  Italic,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Star,
  Strikethrough,
  Trash2,
  Underline,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { MeshGradientPositionControl } from "@/app/components/mesh-gradient-position-control";
import { MeshGradientPreview } from "@/app/components/mesh-gradient-preview";
import { MeshGradientQueryPresetSync } from "@/app/components/mesh-gradient-query-preset-sync";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import { RESOLUTION_PRESETS as ALL_RESOLUTION_PRESETS } from "@/app/lib/utils";
import { generateAuroraCss } from "@/lib/mesh-gradient/aurora-css";
import { BLOB_SHAPE_OPTIONS } from "@/lib/mesh-gradient/aurora-types";
import { MAX_MESH_BLOB_COUNT } from "@/lib/mesh-gradient/constants";
import { cn } from "@/lib/utils";
import { useMeshGradientStore } from "@/stores/mesh-gradient-store";

const GENERATOR_FAVORITES_KEY = "mesh-gradient-generator-favorites";

interface GeneratorFavoriteSnapshot {
  blobs: ReturnType<typeof useMeshGradientStore.getState>["blobs"];
  backgroundColor: string;
  blur: number;
  noiseOpacity: number;
  resolution: { width: number; height: number };
  text: string;
  textColor: string;
  textAlign: "left" | "center" | "right";
  textPosition: { x: number; y: number };
  textShadow: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  fontSize: number;
  fontWeight: number;
  opacityText: number;
  lineHeight: number;
  letterSpacing: number;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  overlayImageUrl: string;
  imagePosition: { x: number; y: number };
  imageWidthPercent: number;
  imageBorderWidth: number;
  imageBorderColor: string;
  imageBorderRadius: number;
  imageShadow: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

interface GeneratorFavoriteEntry {
  id: string;
  createdAt: number;
  fingerprint: string;
  snapshot: GeneratorFavoriteSnapshot;
}

async function exportMeshPng(exportRoot: HTMLDivElement | null) {
  if (!exportRoot) {
    toast.error("Preview not ready");
    return;
  }
  const s = useMeshGradientStore.getState();
  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(exportRoot, {
      cacheBust: true,
      width: s.resolution.width,
      height: s.resolution.height,
      pixelRatio: 1,
      style: {
        transform: "scale(1)",
        transformOrigin: "top left",
        width: `${s.resolution.width}px`,
        height: `${s.resolution.height}px`,
      },
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `aurora-gradient-${s.resolution.width}x${s.resolution.height}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Download started");
  } catch {
    toast.error("PNG export failed");
  }
}

export function MeshGradientApp() {
  const t = useTranslations("pageMeta");
  const exportRef = useRef<HTMLDivElement>(null);
  const [cssOpen, setCssOpen] = useState(false);
  const [copyOk, setCopyOk] = useState(false);
  const [exporting, setExporting] = useState(false);

  const blobs = useMeshGradientStore((s) => s.blobs);
  const backgroundColor = useMeshGradientStore((s) => s.backgroundColor);
  const blur = useMeshGradientStore((s) => s.blur);
  const noiseOpacity = useMeshGradientStore((s) => s.noiseOpacity);
  const resolution = useMeshGradientStore((s) => s.resolution);
  const selectedBlobId = useMeshGradientStore((s) => s.selectedBlobId);

  const setBackgroundColor = useMeshGradientStore((s) => s.setBackgroundColor);
  const setBlur = useMeshGradientStore((s) => s.setBlur);
  const setNoiseOpacity = useMeshGradientStore((s) => s.setNoiseOpacity);
  const setResolution = useMeshGradientStore((s) => s.setResolution);
  const setBlobs = useMeshGradientStore((s) => s.setBlobs);
  const updateBlob = useMeshGradientStore((s) => s.updateBlob);
  const addBlob = useMeshGradientStore((s) => s.addBlob);
  const removeBlob = useMeshGradientStore((s) => s.removeBlob);
  const randomizeAllBlobs = useMeshGradientStore((s) => s.randomizeAllBlobs);
  const randomizeBlobColors = useMeshGradientStore(
    (s) => s.randomizeBlobColors,
  );
  const resetToDefaults = useMeshGradientStore((s) => s.resetToDefaults);
  const setSelectedBlobId = useMeshGradientStore((s) => s.setSelectedBlobId);

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
  const overlayImageUrl = useMeshGradientStore((s) => s.overlayImageUrl);
  const imagePosition = useMeshGradientStore((s) => s.imagePosition);
  const imageWidthPercent = useMeshGradientStore((s) => s.imageWidthPercent);
  const imageBorderWidth = useMeshGradientStore((s) => s.imageBorderWidth);
  const imageBorderColor = useMeshGradientStore((s) => s.imageBorderColor);
  const imageBorderRadius = useMeshGradientStore((s) => s.imageBorderRadius);
  const imageShadow = useMeshGradientStore((s) => s.imageShadow);

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
  const setOverlayImageUrl = useMeshGradientStore((s) => s.setOverlayImageUrl);
  const setImagePosition = useMeshGradientStore((s) => s.setImagePosition);
  const setImageWidthPercent = useMeshGradientStore(
    (s) => s.setImageWidthPercent,
  );
  const setImageBorderWidth = useMeshGradientStore(
    (s) => s.setImageBorderWidth,
  );
  const setImageBorderColor = useMeshGradientStore(
    (s) => s.setImageBorderColor,
  );
  const setImageBorderRadius = useMeshGradientStore(
    (s) => s.setImageBorderRadius,
  );
  const setImageShadow = useMeshGradientStore((s) => s.setImageShadow);

  const currentSnapshot = useMemo<GeneratorFavoriteSnapshot>(
    () => ({
      blobs,
      backgroundColor,
      blur,
      noiseOpacity,
      resolution,
      text,
      textColor,
      textAlign,
      textPosition,
      textShadow,
      fontSize,
      fontWeight,
      opacityText,
      lineHeight,
      letterSpacing,
      isItalic,
      isUnderline,
      isStrikethrough,
      overlayImageUrl,
      imagePosition,
      imageWidthPercent,
      imageBorderWidth,
      imageBorderColor,
      imageBorderRadius,
      imageShadow,
    }),
    [
      blobs,
      backgroundColor,
      blur,
      noiseOpacity,
      resolution,
      text,
      textColor,
      textAlign,
      textPosition,
      textShadow,
      fontSize,
      fontWeight,
      opacityText,
      lineHeight,
      letterSpacing,
      isItalic,
      isUnderline,
      isStrikethrough,
      overlayImageUrl,
      imagePosition,
      imageWidthPercent,
      imageBorderWidth,
      imageBorderColor,
      imageBorderRadius,
      imageShadow,
    ],
  );
  const favoriteFingerprint = useMemo(
    () => JSON.stringify(currentSnapshot),
    [currentSnapshot],
  );
  const [favoriteEntries, setFavoriteEntries] = useState<
    GeneratorFavoriteEntry[]
  >([]);
  const isFavoriteConfig = favoriteEntries.some(
    (entry) => entry.fingerprint === favoriteFingerprint,
  );

  const resolutionOptions = ALL_RESOLUTION_PRESETS.map((p) => {
    const category = p.category || "General";
    return {
      value: `${category}::${p.name}::${p.width}x${p.height}`,
      label: p.category ? `${p.name} (${p.category})` : p.name,
      width: p.width,
      height: p.height,
    };
  });
  const presetMatch = resolutionOptions.find(
    (p) => p.width === resolution.width && p.height === resolution.height,
  );
  const resolutionSelectValue = presetMatch?.value ?? "__custom__";

  const cssPayload = generateAuroraCss({
    baseColor: backgroundColor,
    blur,
    noiseOpacity,
    blobs,
  });

  const onCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(cssPayload);
      setCopyOk(true);
      toast.success("CSS copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  useEffect(() => {
    if (!copyOk) return;
    const tmr = setTimeout(() => setCopyOk(false), 2000);
    return () => clearTimeout(tmr);
  }, [copyOk]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GENERATOR_FAVORITES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const entries = parsed.filter((x) => {
        if (!x || typeof x !== "object") return false;
        const maybe = x as Partial<GeneratorFavoriteEntry>;
        return (
          typeof maybe.id === "string" &&
          typeof maybe.createdAt === "number" &&
          typeof maybe.fingerprint === "string" &&
          !!maybe.snapshot
        );
      }) as GeneratorFavoriteEntry[];
      setFavoriteEntries(entries);
    } catch {
      // ignore bad local data
    }
  }, []);

  const onExportPng = async () => {
    setExporting(true);
    try {
      await exportMeshPng(exportRef.current);
    } finally {
      setExporting(false);
    }
  };

  const onToggleFavoriteConfig = () => {
    try {
      const exists = favoriteEntries.some(
        (entry) => entry.fingerprint === favoriteFingerprint,
      );
      const next = exists
        ? favoriteEntries.filter(
            (entry) => entry.fingerprint !== favoriteFingerprint,
          )
        : [
            ...favoriteEntries,
            {
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              fingerprint: favoriteFingerprint,
              snapshot: currentSnapshot,
            },
          ];
      window.localStorage.setItem(
        GENERATOR_FAVORITES_KEY,
        JSON.stringify(next),
      );
      setFavoriteEntries(next);
      toast.message(exists ? "Removed from favorites" : "Saved to favorites");
    } catch {
      toast.error("Could not update favorites");
    }
  };

  const onApplyFavorite = (entry: GeneratorFavoriteEntry) => {
    const snap = entry.snapshot;
    setBlobs(snap.blobs);
    setBackgroundColor(snap.backgroundColor);
    setBlur(snap.blur);
    setNoiseOpacity(snap.noiseOpacity);
    setResolution(snap.resolution);
    setText(snap.text);
    setTextColor(snap.textColor);
    setTextAlign(snap.textAlign);
    setTextPosition(snap.textPosition);
    setTextShadow(snap.textShadow);
    setFontSize(snap.fontSize);
    setFontWeight(snap.fontWeight);
    setOpacity(snap.opacityText);
    setLineHeight(snap.lineHeight);
    setLetterSpacing(snap.letterSpacing);
    setIsItalic(snap.isItalic);
    setIsUnderline(snap.isUnderline);
    setIsStrikethrough(snap.isStrikethrough);
    setOverlayImageUrl(snap.overlayImageUrl ?? "");
    setImagePosition(snap.imagePosition ?? { x: 0, y: 0 });
    setImageWidthPercent(snap.imageWidthPercent ?? 30);
    setImageBorderWidth(snap.imageBorderWidth ?? 0);
    setImageBorderColor(snap.imageBorderColor ?? "#ffffff");
    setImageBorderRadius(snap.imageBorderRadius ?? 12);
    setImageShadow(
      snap.imageShadow ?? {
        color: "#000000",
        blur: 20,
        offsetX: 0,
        offsetY: 8,
      },
    );
    toast.success("Favorite loaded");
  };

  const onRemoveFavorite = (id: string) => {
    const next = favoriteEntries.filter((entry) => entry.id !== id);
    setFavoriteEntries(next);
    try {
      window.localStorage.setItem(
        GENERATOR_FAVORITES_KEY,
        JSON.stringify(next),
      );
    } catch {
      // ignore storage errors
    }
  };

  const onOverlayImageUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setOverlayImageUrl(result);
        toast.success("Image uploaded");
      } else {
        toast.error("Could not read image");
      }
    };
    reader.onerror = () => toast.error("Could not read image");
    reader.readAsDataURL(file);
  };

  return (
    <div className="container flex flex-col gap-6 py-6">
      <MeshGradientQueryPresetSync />

      <div className="flex flex-col gap-2">
        <h1 className={toolHeroTitleClassName}>Mesh gradient generator</h1>
        <p className="max-w-2xl text-muted-foreground text-sm">
          Aurora-style blurred radial blobs, noise overlay, draggable shapes,
          CSS export, and PNG at your chosen resolution. Distinct from the CSS
          linear-gradient tool at{" "}
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

      <div className="flex min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="relative min-h-[min(56vh,520px)] flex-1 lg:min-h-[min(70vh,640px)]">
          <MeshGradientPreview ref={exportRef} />
        </div>

        <motion.aside
          key="sidebar"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-md lg:w-96"
        >
          <div className="flex min-h-0 max-h-[min(80vh,920px)] flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold text-sm">
                  <Palette className="size-4 text-primary" />
                  Generator
                </h2>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => randomizeAllBlobs()}
                      >
                        <Shuffle className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>
                      Randomize all blobs (color, position, size, shape)
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => randomizeBlobColors()}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>
                      Randomize colors only
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          resetToDefaults();
                          toast.message("Reset to defaults");
                        }}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>
                      Reset to default settings
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 hover:bg-transparent"
                        onClick={onToggleFavoriteConfig}
                      >
                        <Star
                          className={cn(
                            "size-4",
                            isFavoriteConfig ? "fill-primary text-primary" : "",
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>
                      {isFavoriteConfig
                        ? "Remove this config from favorites"
                        : "Save this config to favorites"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <CollapsibleSection title="Canvas" defaultOpen>
                <section className="space-y-4">
                  <SliderRow
                    label="Global blur"
                    value={blur}
                    min={0}
                    max={200}
                    step={1}
                    suffix=" px"
                    onValueChange={setBlur}
                  />
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <Label>Noise intensity</Label>
                      <span className="text-muted-foreground tabular-nums">
                        {Math.round(noiseOpacity * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[Math.round(noiseOpacity * 100)]}
                      min={0}
                      max={50}
                      step={1}
                      onValueChange={(v) => setNoiseOpacity((v[0] ?? 0) / 100)}
                      className="py-1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Base background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        aria-label="Base background"
                        className="h-10 w-14 shrink-0 cursor-pointer p-1"
                        value={
                          /^#[0-9A-Fa-f]{6}$/.test(backgroundColor)
                            ? backgroundColor
                            : "#f5f5f0"
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
                </section>
              </CollapsibleSection>

              <CollapsibleSection
                title={`Blobs (${blobs.length})`}
                defaultOpen
                action={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-primary"
                    disabled={blobs.length >= MAX_MESH_BLOB_COUNT}
                    onClick={() => addBlob()}
                  >
                    <Plus className="size-3.5" />
                    Add blob
                  </Button>
                }
              >
                <div className="space-y-3">
                  {blobs.map((blob, index) => (
                    <div
                      key={blob.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedBlobId(blob.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedBlobId(blob.id);
                        }
                      }}
                      className={cn(
                        "cursor-pointer rounded-xl border p-3 transition-colors",
                        selectedBlobId === blob.id
                          ? "border-primary bg-muted/80"
                          : "border-border/60 bg-muted/30 hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Input
                            type="color"
                            className="h-8 w-8 shrink-0 cursor-pointer rounded-full border-0 p-0.5"
                            value={
                              /^#[0-9A-Fa-f]{6}$/.test(blob.color)
                                ? blob.color
                                : "#000000"
                            }
                            onChange={(e) =>
                              updateBlob(blob.id, { color: e.target.value })
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span
                            className={cn(
                              "truncate text-xs font-medium",
                              selectedBlobId === blob.id
                                ? "text-primary"
                                : "text-foreground",
                            )}
                          >
                            Blob {index + 1}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={blobs.length <= 1}
                          aria-label="Remove blob"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlob(blob.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <SliderRow
                          label="X"
                          value={Math.round(blob.x)}
                          min={0}
                          max={100}
                          step={1}
                          suffix="%"
                          onValueChange={(n) => updateBlob(blob.id, { x: n })}
                        />
                        <SliderRow
                          label="Y"
                          value={Math.round(blob.y)}
                          min={0}
                          max={100}
                          step={1}
                          suffix="%"
                          onValueChange={(n) => updateBlob(blob.id, { y: n })}
                        />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <SliderRow
                          label="Size"
                          value={Math.round(blob.size)}
                          min={10}
                          max={150}
                          step={1}
                          suffix="%"
                          onValueChange={(n) =>
                            updateBlob(blob.id, { size: n })
                          }
                        />
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <Label>Opacity</Label>
                            <span className="text-muted-foreground tabular-nums">
                              {Math.round(blob.opacity * 100)}%
                            </span>
                          </div>
                          <Slider
                            value={[Math.round(blob.opacity * 100)]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(v) =>
                              updateBlob(blob.id, {
                                opacity: (v[0] ?? 0) / 100,
                              })
                            }
                            className="py-1"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="text-muted-foreground text-xs">
                          Layer (z-index)
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={999}
                          step={1}
                          value={blob.zIndex}
                          onChange={(e) => {
                            const v = Number.parseInt(e.target.value, 10);
                            if (!Number.isFinite(v)) return;
                            updateBlob(blob.id, {
                              zIndex: Math.max(1, Math.min(999, v)),
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 h-8 w-28 font-mono text-xs"
                        />
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <Label className="text-muted-foreground text-xs">
                          Shape
                        </Label>
                        <ToggleGroup
                          type="single"
                          value={blob.shape}
                          onValueChange={(v) => {
                            if (
                              v === "circle" ||
                              v === "square" ||
                              v === "pill" ||
                              v === "organic"
                            ) {
                              updateBlob(blob.id, { shape: v });
                            }
                          }}
                          variant="outline"
                          className="grid w-full grid-cols-4 gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {BLOB_SHAPE_OPTIONS.map((s) => (
                            <ToggleGroupItem
                              key={s}
                              value={s}
                              className="px-1 text-[10px] uppercase"
                            >
                              {s}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Export size" defaultOpen>
                <div className="space-y-2">
                  <Label htmlFor="mesh-resolution">Export size</Label>
                  <Select
                    value={resolutionSelectValue}
                    onValueChange={(v) => {
                      if (v === "__custom__") return;
                      const preset = resolutionOptions.find(
                        (p) => p.value === v,
                      );
                      if (preset) {
                        setResolution({
                          width: preset.width,
                          height: preset.height,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="mesh-resolution" className="w-full">
                      <SelectValue placeholder="Resolution" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {resolutionOptions.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
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
              </CollapsibleSection>
              <CollapsibleSection title="Text on image" defaultOpen>
                <div className="space-y-3">
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
                          /^#[0-9A-Fa-f]{6}$/.test(textColor)
                            ? textColor
                            : "#f1f1f1"
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
                  {/* Alignment controls are temporarily hidden. */}
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
                    <Label className="text-xs">Shadow color</Label>
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
                        onChange={(e) =>
                          setTextShadow({ color: e.target.value })
                        }
                      />
                      <Input
                        value={textShadow.color}
                        onChange={(e) =>
                          setTextShadow({ color: e.target.value })
                        }
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
              </CollapsibleSection>

              <CollapsibleSection title="Image overlay" defaultOpen>
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      onOverlayImageUpload(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />
                  {overlayImageUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOverlayImageUrl("")}
                    >
                      Remove image
                    </Button>
                  ) : null}

                  <SliderRow
                    label="Image width"
                    value={imageWidthPercent}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={setImageWidthPercent}
                    suffix="%"
                  />
                  <SliderRow
                    label="Border width"
                    value={imageBorderWidth}
                    min={0}
                    max={40}
                    step={1}
                    onValueChange={setImageBorderWidth}
                    suffix=" px"
                  />
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <Label>Border color</Label>
                      <span className="font-mono text-muted-foreground text-xs">
                        {imageBorderColor}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        aria-label="Image border color"
                        className="h-10 w-14 cursor-pointer p-1"
                        value={
                          /^#[0-9A-Fa-f]{6}$/.test(imageBorderColor)
                            ? imageBorderColor
                            : "#ffffff"
                        }
                        onChange={(e) => setImageBorderColor(e.target.value)}
                      />
                      <Input
                        value={imageBorderColor}
                        onChange={(e) => setImageBorderColor(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <SliderRow
                    label="Border radius"
                    value={imageBorderRadius}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={setImageBorderRadius}
                    suffix=" px"
                  />
                  <p className="pt-1 font-medium text-muted-foreground text-xs">
                    Shadow
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Shadow color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        aria-label="Image shadow color"
                        className="h-9 w-12 cursor-pointer p-1"
                        value={
                          /^#[0-9A-Fa-f]{6}$/.test(imageShadow.color)
                            ? imageShadow.color
                            : "#000000"
                        }
                        onChange={(e) =>
                          setImageShadow({ color: e.target.value })
                        }
                      />
                      <Input
                        value={imageShadow.color}
                        onChange={(e) =>
                          setImageShadow({ color: e.target.value })
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <SliderRow
                    label="Shadow blur"
                    value={imageShadow.blur}
                    min={0}
                    max={120}
                    step={1}
                    onValueChange={(n) => setImageShadow({ blur: n })}
                    suffix=" px"
                  />
                  <SliderRow
                    label="Shadow X"
                    value={imageShadow.offsetX}
                    min={-80}
                    max={80}
                    step={1}
                    onValueChange={(n) => setImageShadow({ offsetX: n })}
                    suffix=" px"
                  />
                  <SliderRow
                    label="Shadow Y"
                    value={imageShadow.offsetY}
                    min={-80}
                    max={80}
                    step={1}
                    onValueChange={(n) => setImageShadow({ offsetY: n })}
                    suffix=" px"
                  />
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                    <MeshGradientPositionControl
                      value={imagePosition}
                      onChange={setImagePosition}
                      width={resolution.width}
                      height={resolution.height}
                      label="Image position"
                      className="max-h-[120px] max-w-[min(100%,160px)]"
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </div>
            <div className="border-t border-border bg-background/95 p-3 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setCssOpen(true)}
                >
                  <Code className="size-4" />
                  Export CSS
                </Button>
                <Button
                  type="button"
                  variant="default"
                  className="gap-2"
                  disabled={exporting}
                  onClick={() => void onExportPng()}
                >
                  {exporting ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <ImageIcon className="size-4" />
                  )}
                  Export PNG
                </Button>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      {favoriteEntries.length > 0 ? (
        <section className="space-y-3 border-border border-t pt-5">
          <h2 className="font-semibold text-sm">Starred</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...favoriteEntries]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((entry) => (
                <div
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onApplyFavorite(entry)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onApplyFavorite(entry);
                    }
                  }}
                  className="group overflow-hidden rounded-xl border border-border/60 bg-card/40 text-left transition-colors hover:border-border hover:bg-card/80"
                >
                  <div
                    className="relative w-full overflow-hidden"
                    style={{
                      aspectRatio: `${entry.snapshot.resolution.width} / ${entry.snapshot.resolution.height}`,
                      backgroundColor: entry.snapshot.backgroundColor,
                    }}
                  >
                    <div
                      className="absolute inset-[-20%] h-[140%] w-[140%]"
                      style={{
                        filter:
                          entry.snapshot.blur > 0
                            ? `blur(${entry.snapshot.blur}px)`
                            : undefined,
                      }}
                    >
                      {entry.snapshot.blobs.map((blob, i) => (
                        <div
                          key={`${entry.id}-${i}`}
                          className="absolute"
                          style={{
                            left: `${blob.x}%`,
                            top: `${blob.y}%`,
                            width: `${blob.size}%`,
                            height: `${blob.size}%`,
                            transform: "translate(-50%, -50%)",
                            opacity: blob.opacity,
                            zIndex: blob.zIndex,
                            borderRadius:
                              blob.shape === "circle"
                                ? "50%"
                                : blob.shape === "square"
                                  ? "0%"
                                  : blob.shape === "pill"
                                    ? "100px"
                                    : "30% 70% 70% 30% / 30% 30% 70% 70%",
                            backgroundColor: blob.color,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2">
                    <span className="truncate text-muted-foreground text-xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:bg-transparent hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(entry.id);
                      }}
                      aria-label="Remove favorite"
                    >
                      <Star className="size-4 fill-primary text-primary" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      <Dialog open={cssOpen} onOpenChange={setCssOpen}>
        <DialogContent className="w-[min(96vw,980px)] max-w-[min(96vw,980px)] p-0">
          <DialogHeader className="border-b border-border px-4 py-3 sm:px-6">
            <DialogTitle className="flex items-center gap-2">
              <Code className="size-5 text-primary" />
              Generated CSS
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 p-4 sm:p-6">
            <div className="relative">
              <pre className="max-h-[min(60vh,520px)] overflow-auto rounded-xl border border-border bg-muted/50 p-4 font-mono text-xs whitespace-pre-wrap wrap-break-word">
                {cssPayload}
              </pre>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => void onCopyCss()}
                aria-label="Copy CSS"
              >
                {copyOk ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter className="border-t border-border px-4 py-3 sm:px-6">
            <Button type="button" onClick={() => void onCopyCss()}>
              Copy to clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function CollapsibleSection({
  title,
  defaultOpen = false,
  action,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        {action ? (
          <div onClick={(e) => e.stopPropagation()}>{action}</div>
        ) : null}
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
