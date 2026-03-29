"use client";

import { Move, RotateCcw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { CenterSquareCrop } from "@/lib/favicon-pack/render-square-png";
import {
  clampSquareCrop,
  computeCenterSquareCrop,
  recenterSquareCropSide,
} from "@/lib/favicon-pack/render-square-png";
import { cn } from "@/lib/utils";

const RESULT_PREVIEW_PX = 128;

export interface FaviconCropEditorLabels {
  sectionTitle: string;
  hint: string;
  zoomLabel: string;
  zoomHint: string;
  previewLabel: string;
  previewNote: string;
  resetLabel: string;
  cropAriaLabel: string;
  dimensionsLine: string;
  dragBadge: string;
}

interface FaviconCropEditorProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  crop: CenterSquareCrop;
  onCropChange: (next: CenterSquareCrop) => void;
  disabled?: boolean;
  labels: FaviconCropEditorLabels;
  previewActions?: React.ReactNode;
}

export function FaviconCropEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  crop,
  onCropChange,
  disabled = false,
  labels,
  previewActions,
}: FaviconCropEditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const previewImgRef = React.useRef<HTMLImageElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const dragRef = React.useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startSx: number;
    startSy: number;
  } | null>(null);

  const maxSide = Math.min(imageWidth, imageHeight);
  const minSide = Math.max(
    1,
    Math.min(maxSide, Math.max(8, Math.floor(maxSide * 0.15))),
  );

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContainerWidth(el.clientWidth);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [imageWidth, imageHeight]);

  const displayScale =
    containerWidth > 0 ? Math.min(1, containerWidth / imageWidth) : 1;
  const dw = Math.max(1, Math.round(imageWidth * displayScale));
  const dh = Math.max(1, Math.round(imageHeight * displayScale));

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const img = previewImgRef.current;
    if (!canvas || !img?.complete || img.naturalWidth < 1) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const out = RESULT_PREVIEW_PX;
    canvas.width = out;
    canvas.height = out;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, out, out);
    ctx.drawImage(
      img,
      crop.sx,
      crop.sy,
      crop.side,
      crop.side,
      0,
      0,
      out,
      out,
    );
  }, [crop, imageUrl, imageWidth, imageHeight]);

  const onCropPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startSx: crop.sx,
        startSy: crop.sy,
      };
    },
    [crop.sx, crop.sy, disabled],
  );

  const onCropPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId || disabled) return;
      const dx = (e.clientX - d.startClientX) / displayScale;
      const dy = (e.clientY - d.startClientY) / displayScale;
      const next = clampSquareCrop(
        imageWidth,
        imageHeight,
        d.startSx + dx,
        d.startSy + dy,
        crop.side,
      );
      onCropChange(next);
    },
    [crop.side, displayScale, disabled, imageHeight, imageWidth, onCropChange],
  );

  const onCropPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (d?.pointerId === e.pointerId) {
        dragRef.current = null;
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
    },
    [],
  );

  const onZoomSide = React.useCallback(
    (values: number[]) => {
      const raw = values[0];
      if (raw === undefined || Number.isNaN(raw)) return;
      const nextSide = Math.round(
        Math.min(maxSide, Math.max(minSide, raw)),
      );
      onCropChange(
        recenterSquareCropSide(imageWidth, imageHeight, crop, nextSide),
      );
    },
    [crop, imageHeight, imageWidth, maxSide, minSide, onCropChange],
  );

  const onResetCrop = React.useCallback(() => {
    onCropChange(computeCenterSquareCrop(imageWidth, imageHeight));
  }, [imageHeight, imageWidth, onCropChange]);

  const overlayPx = {
    left: crop.sx * displayScale,
    top: crop.sy * displayScale,
    size: crop.side * displayScale,
  };

  const previewAside = (
    <aside className="flex w-full flex-col gap-4 rounded-xl border-2 border-border bg-card/80 p-4 shadow-sm lg:sticky lg:top-20 lg:w-72 lg:shrink-0 lg:self-start">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Label className="text-foreground text-xs uppercase tracking-[0.18em]">
            {labels.previewLabel}
          </Label>
          <p className="mt-1 text-muted-foreground text-[11px] leading-snug">
            {labels.previewNote}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-none border-2 font-mono text-[10px] uppercase"
          onClick={onResetCrop}
          disabled={disabled}
        >
          <RotateCcw className="size-3.5 shrink-0" aria-hidden />
          <span className="max-sm:sr-only">{labels.resetLabel}</span>
        </Button>
      </div>

      <div className="flex justify-center rounded-lg border-2 border-dashed border-border/80 bg-muted/40 p-4">
        <canvas
          ref={canvasRef}
          width={RESULT_PREVIEW_PX}
          height={RESULT_PREVIEW_PX}
          className="h-32 w-32 border-2 border-border bg-background shadow-brutal-sm"
          aria-hidden
        />
      </div>

      <p className="text-center font-mono text-muted-foreground text-[10px] uppercase tracking-wider">
        {labels.dimensionsLine}
      </p>

      {previewActions ? (
        <div className="flex flex-col gap-2 border-border border-t pt-4">
          {previewActions}
        </div>
      ) : null}
    </aside>
  );

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex min-w-0 min-h-0 flex-1 flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-2">
            <h3 className="font-semibold text-foreground text-base tracking-tight md:text-lg">
              {labels.sectionTitle}
            </h3>
            <p className="max-w-prose text-muted-foreground text-sm leading-relaxed">
              {labels.hint}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start border-2 border-border bg-muted/60 px-3 py-1.5 font-mono text-muted-foreground text-xs">
            <Move className="size-3.5 opacity-70" aria-hidden />
            {labels.dragBadge}
          </span>
        </header>

        <div ref={containerRef} className="w-full min-w-0">
          <div className="rounded-xl border-2 border-border bg-muted/30 p-2 shadow-inner sm:p-3">
            <div
              className="relative mx-auto overflow-hidden rounded-md border border-border/60 bg-background ring-1 ring-border/40"
              style={{ width: dw, height: dh }}
            >
              {/* biome-ignore lint/performance/noImgElement: object URL editor */}
              <img
                src={imageUrl}
                alt=""
                width={imageWidth}
                height={imageHeight}
                draggable={false}
                className="block h-full w-full select-none object-contain"
              />
              <div
                role="img"
                aria-label={labels.cropAriaLabel}
                title={labels.cropAriaLabel}
                className={cn(
                  "absolute touch-none border-[3px] border-primary bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ring-2 ring-background/90",
                  disabled
                    ? "cursor-not-allowed opacity-90"
                    : "cursor-grab active:cursor-grabbing",
                )}
                style={{
                  left: overlayPx.left,
                  top: overlayPx.top,
                  width: overlayPx.size,
                  height: overlayPx.size,
                }}
                onPointerDown={onCropPointerDown}
                onPointerMove={onCropPointerMove}
                onPointerUp={onCropPointerUp}
                onPointerCancel={onCropPointerUp}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-border bg-card/50 p-4 sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <Label
              htmlFor="favicon-crop-zoom"
              className="text-foreground text-xs uppercase tracking-[0.18em]"
            >
              {labels.zoomLabel}
            </Label>
            <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
              <span className="font-black font-mono text-foreground text-lg tabular-nums">
                {crop.side}
                <span className="ms-1 text-muted-foreground text-sm font-semibold">
                  px
                </span>
              </span>
            </div>
          </div>
          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
            {labels.zoomHint}
          </p>
          <Slider
            id="favicon-crop-zoom"
            disabled={disabled}
            min={minSide}
            max={maxSide}
            step={1}
            value={[crop.side]}
            onValueChange={onZoomSide}
            className="mt-4 w-full"
          />
        </div>
      </div>

      {previewAside}

      {/* Decode pixels for canvas preview (same URL as visible image). */}
      {/* biome-ignore lint/performance/noImgElement: hidden decoder for canvas */}
      <img
        ref={previewImgRef}
        src={imageUrl}
        alt=""
        className="pointer-events-none fixed h-px w-px opacity-0"
        aria-hidden
        decoding="async"
      />
    </div>
  );
}
