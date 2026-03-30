"use client";

import { Move, RotateCcw, Scaling } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  type CropCorner,
  clampPixelCrop,
  cropRatio,
  defaultPixelCropForPreset,
  type ImageResizeCropPreset,
  maxCropSizeForRatio,
  minCropWidthForRatio,
  type NormSourceCrop,
  normToPixel,
  pixelToNorm,
  resizeCropFromCorner,
  scalePixelCropWidth,
  translatePixelCrop,
} from "@/lib/image-resize/norm-source-crop";
import { renderImageFileToPipelineCanvas } from "@/lib/image-resize/render-from-file";
import type {
  FitPipelineMode,
  ResizePipelineMode,
} from "@/lib/image-resize/render-pipeline";
import { cn } from "@/lib/utils";

const OUTPUT_PREVIEW_MAX = 240;
const CENTER_INSET = 14;

interface ImageResizeCropPreviewProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  file: File;
  cropPreset: ImageResizeCropPreset;
  normCrop: NormSourceCrop;
  onNormCropChange: (next: NormSourceCrop) => void;
  resizeMode: ResizePipelineMode;
  fitMode: FitPipelineMode;
  targetWidth: number;
  targetHeight: number;
  disabled?: boolean;
}

export function ImageResizeCropPreview({
  imageUrl,
  imageWidth: sw,
  imageHeight: sh,
  file,
  cropPreset,
  normCrop,
  onNormCropChange,
  resizeMode,
  fitMode,
  targetWidth,
  targetHeight,
  disabled = false,
}: ImageResizeCropPreviewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imageStageRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const outputCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const dragRef = React.useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPixel: ReturnType<typeof normToPixel>;
  } | null>(null);
  const resizeRef = React.useRef<{
    pointerId: number;
    corner: CropCorner;
    anchorCrop: ReturnType<typeof normToPixel>;
  } | null>(null);

  const R = cropRatio(cropPreset) ?? sw / sh;
  const pixelCrop = React.useMemo(
    () => normToPixel(normCrop, sw, sh),
    [normCrop, sw, sh],
  );

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [sw, sh]);

  const displayScale =
    containerWidth > 0 ? Math.min(1, containerWidth / sw) : 1;
  const dw = Math.max(1, Math.round(sw * displayScale));
  const dh = Math.max(1, Math.round((sh / sw) * dw));

  const maxDims = maxCropSizeForRatio(sw, sh, R);
  const maxW = maxDims.sWidth;
  const rawMinW = minCropWidthForRatio(sw, sh, R);
  const minW = Math.min(rawMinW, maxW);

  const [resizingCorner, setResizingCorner] = React.useState<CropCorner | null>(
    null,
  );

  const clientToImage = React.useCallback(
    (clientX: number, clientY: number) => {
      const el = imageStageRef.current;
      if (!el) return { ix: 0, iy: 0 };
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return { ix: 0, iy: 0 };
      return {
        ix: ((clientX - r.left) / r.width) * sw,
        iy: ((clientY - r.top) / r.height) * sh,
      };
    },
    [sh, sw],
  );

  React.useLayoutEffect(() => {
    let cancelled = false;
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    void (async () => {
      try {
        const out = await renderImageFileToPipelineCanvas({
          file,
          cropPreset,
          normCrop,
          refDimensions: { sw, sh },
          resizeMode,
          fitMode,
          width: targetWidth,
          height: targetHeight,
        });
        if (cancelled) return;

        const ow = out.width;
        const oh = out.height;
        const scale = Math.min(
          OUTPUT_PREVIEW_MAX / ow,
          OUTPUT_PREVIEW_MAX / oh,
          1,
        );
        const pw = Math.max(1, Math.round(ow * scale));
        const ph = Math.max(1, Math.round(oh * scale));

        canvas.width = pw;
        canvas.height = ph;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, pw, ph);
        ctx.drawImage(out, 0, 0, ow, oh, 0, 0, pw, ph);
      } catch {
        if (!cancelled && canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = 1;
            canvas.height = 1;
            ctx.clearRect(0, 0, 1, 1);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    file,
    sw,
    sh,
    cropPreset,
    normCrop,
    resizeMode,
    fitMode,
    targetWidth,
    targetHeight,
  ]);

  const onCropPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPixel: { ...pixelCrop },
      };
    },
    [disabled, pixelCrop],
  );

  const onCropPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId || disabled) return;
      const dx = (e.clientX - d.startClientX) / displayScale;
      const dy = (e.clientY - d.startClientY) / displayScale;
      const next = translatePixelCrop(sw, sh, d.startPixel, dx, dy);
      onNormCropChange(pixelToNorm(next, sw, sh));
    },
    [disabled, displayScale, onNormCropChange, sh, sw],
  );

  const onCropPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (d?.pointerId === e.pointerId) dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
    },
    [],
  );

  const onCornerPointerDown = React.useCallback(
    (corner: CropCorner) => (e: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeRef.current = {
        pointerId: e.pointerId,
        corner,
        anchorCrop: { ...pixelCrop },
      };
      setResizingCorner(corner);
    },
    [disabled, pixelCrop],
  );

  const onCornerPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const d = resizeRef.current;
      if (!d || d.pointerId !== e.pointerId || disabled) return;
      const { ix, iy } = clientToImage(e.clientX, e.clientY);
      const next = resizeCropFromCorner({
        sw,
        sh,
        crop: d.anchorCrop,
        corner: d.corner,
        pointerX: ix,
        pointerY: iy,
        R,
      });
      onNormCropChange(pixelToNorm(next, sw, sh));
    },
    [R, clientToImage, disabled, onNormCropChange, sh, sw],
  );

  const onCornerPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const d = resizeRef.current;
      if (d?.pointerId === e.pointerId) {
        resizeRef.current = null;
        setResizingCorner(null);
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
    },
    [],
  );

  const onZoomWidth = React.useCallback(
    (values: number[]) => {
      const raw = values[0];
      if (raw === undefined || Number.isNaN(raw)) return;
      const w = Math.round(Math.min(maxW, Math.max(minW, raw)));
      const next = scalePixelCropWidth(sw, sh, pixelCrop, w, R);
      onNormCropChange(pixelToNorm(next, sw, sh));
    },
    [maxW, minW, onNormCropChange, pixelCrop, R, sh, sw],
  );

  const onResetCrop = React.useCallback(() => {
    const next = defaultPixelCropForPreset(sw, sh, cropPreset);
    onNormCropChange(pixelToNorm(clampPixelCrop(sw, sh, next), sw, sh));
  }, [cropPreset, onNormCropChange, sh, sw]);

  const overlayPx = {
    left: pixelCrop.sx * displayScale,
    top: pixelCrop.sy * displayScale,
    width: pixelCrop.sWidth * displayScale,
    height: pixelCrop.sHeight * displayScale,
  };

  const centerW = Math.max(0, overlayPx.width - 2 * CENTER_INSET);
  const centerH = Math.max(0, overlayPx.height - 2 * CENTER_INSET);

  const cornerUi = React.useMemo(
    () =>
      [
        {
          corner: "nw" as const,
          cursor: "nwse-resize",
          label: "Resize crop from top-left",
          style: {
            left: overlayPx.left,
            top: overlayPx.top,
            transform: "translate(-50%, -50%)",
          },
          iconRotate: "-45deg",
        },
        {
          corner: "ne" as const,
          cursor: "nesw-resize",
          label: "Resize crop from top-right",
          style: {
            left: overlayPx.left + overlayPx.width,
            top: overlayPx.top,
            transform: "translate(-50%, -50%)",
          },
          iconRotate: "45deg",
        },
        {
          corner: "sw" as const,
          cursor: "nesw-resize",
          label: "Resize crop from bottom-left",
          style: {
            left: overlayPx.left,
            top: overlayPx.top + overlayPx.height,
            transform: "translate(-50%, -50%)",
          },
          iconRotate: "-135deg",
        },
        {
          corner: "se" as const,
          cursor: "nwse-resize",
          label: "Resize crop from bottom-right",
          style: {
            left: overlayPx.left + overlayPx.width,
            top: overlayPx.top + overlayPx.height,
            transform: "translate(-50%, -50%)",
          },
          iconRotate: "135deg",
        },
      ] as const,
    [overlayPx.height, overlayPx.left, overlayPx.top, overlayPx.width],
  );

  const presetIsNone = cropPreset === "none";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold text-foreground text-sm tracking-tight">
              Crop preview
            </h3>
            <p className="max-w-prose text-muted-foreground text-xs leading-relaxed">
              {presetIsNone
                ? "Drag the center to move, drag corners to resize, or use the slider. Same aspect as the source image; framing applies to every queued image."
                : "Drag the center to move, hover corners for resize handles, or use the slider. The same relative framing applies to every image in the queue."}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start border border-border bg-muted/50 px-2.5 py-1 font-mono text-[10px] text-muted-foreground uppercase">
            <Move className="size-3 opacity-70" aria-hidden />
            Drag
          </span>
        </header>

        <div ref={containerRef} className="w-full min-w-0">
          <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
            <div
              ref={imageStageRef}
              className="group/crop-stage relative mx-auto min-h-0 min-w-0 touch-none overflow-hidden rounded-md border border-border/60 bg-background"
              style={{ width: dw, height: dh }}
            >
              {/* biome-ignore lint/performance/noImgElement: object URL editor */}
              <img
                src={imageUrl}
                alt=""
                width={sw}
                height={sh}
                draggable={false}
                className="block size-full max-h-full min-h-0 min-w-0 max-w-full select-none object-contain object-center"
              />
              <div
                className="pointer-events-none absolute shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ring-2 ring-background/90 ring-inset"
                style={{
                  left: overlayPx.left,
                  top: overlayPx.top,
                  width: overlayPx.width,
                  height: overlayPx.height,
                  boxSizing: "border-box",
                  border: "3px solid hsl(var(--primary))",
                }}
              />
              <div
                role="presentation"
                className={cn(
                  "absolute z-10 touch-none",
                  disabled
                    ? "cursor-not-allowed"
                    : "cursor-grab active:cursor-grabbing",
                )}
                style={
                  centerW > 0 && centerH > 0
                    ? {
                        left: overlayPx.left + CENTER_INSET,
                        top: overlayPx.top + CENTER_INSET,
                        width: centerW,
                        height: centerH,
                      }
                    : {
                        left: overlayPx.left,
                        top: overlayPx.top,
                        width: overlayPx.width,
                        height: overlayPx.height,
                      }
                }
                onPointerDown={onCropPointerDown}
                onPointerMove={onCropPointerMove}
                onPointerUp={onCropPointerUp}
                onPointerCancel={onCropPointerUp}
              />
              {cornerUi.map((c) => (
                <button
                  key={c.corner}
                  type="button"
                  aria-label={c.label}
                  disabled={disabled}
                  className={cn(
                    "absolute z-20 flex size-7 touch-none items-center justify-center rounded-full border border-primary/50 bg-background/95 text-primary shadow-sm transition-opacity duration-150",
                    "opacity-0 hover:opacity-100 focus-visible:opacity-100 group-hover/crop-stage:opacity-100",
                    resizingCorner === c.corner && "opacity-100",
                    disabled && "pointer-events-none opacity-40",
                  )}
                  style={{
                    ...c.style,
                    cursor: disabled ? "not-allowed" : c.cursor,
                  }}
                  onPointerDown={onCornerPointerDown(c.corner)}
                  onPointerMove={onCornerPointerMove}
                  onPointerUp={onCornerPointerUp}
                  onPointerCancel={onCornerPointerUp}
                  onLostPointerCapture={() => {
                    resizeRef.current = null;
                    setResizingCorner(null);
                  }}
                >
                  <Scaling
                    className="pointer-events-none size-2.5 shrink-0"
                    style={{ transform: `rotate(${c.iconRotate})` }}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <Label
              htmlFor="image-resize-crop-zoom"
              className="text-foreground text-xs uppercase tracking-wider"
            >
              Crop size
            </Label>
            <span className="font-mono text-foreground text-sm tabular-nums">
              {pixelCrop.sWidth}×{pixelCrop.sHeight}px
            </span>
          </div>
          <p className="mt-1 text-muted-foreground text-xs">
            Smaller crop zooms in; larger shows more of the image.
          </p>
          <Slider
            id="image-resize-crop-zoom"
            disabled={disabled}
            min={minW}
            max={maxW}
            step={1}
            value={[pixelCrop.sWidth]}
            onValueChange={onZoomWidth}
            className="mt-3 w-full"
          />
        </div>
      </div>

      <aside className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 lg:sticky lg:top-20 lg:w-72 lg:shrink-0 lg:self-start">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Label className="text-foreground text-xs uppercase tracking-wider">
              Output preview
            </Label>
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
              After crop and resize settings (
              {resizeMode === "fit" ? fitMode : resizeMode}).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1 font-mono text-[10px] uppercase"
            onClick={onResetCrop}
            disabled={disabled}
          >
            <RotateCcw className="size-3 shrink-0" aria-hidden />
            Reset
          </Button>
        </div>

        <div className="flex justify-center rounded-lg border border-border/80 border-dashed bg-muted/30 p-4">
          <canvas
            ref={outputCanvasRef}
            className="max-h-60 max-w-full border border-border bg-background shadow-sm"
            aria-label="Output preview"
          />
        </div>
      </aside>
    </div>
  );
}
