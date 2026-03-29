"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { debounce } from "@/lib/mesh-gradient/debounce";
import { applyGrainEffect } from "@/lib/mesh-gradient/effects";
import { meshGrainSeedFromVisualState } from "@/lib/mesh-gradient/mesh-grain-seed";
import { drawShape } from "@/lib/mesh-gradient/shapes";
import { cn } from "@/lib/utils";
import { useMeshGradientStore } from "@/stores/mesh-gradient-store";

import "context-filter-polyfill";

const CANVAS_ID = "mesh-gradient-wallpaper";

export function MeshGradientCanvas({ className }: { className?: string } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundLayerRef = useRef<HTMLCanvasElement | null>(null);

  const resolution = useMeshGradientStore((s) => s.resolution);
  const backgroundColor = useMeshGradientStore((s) => s.backgroundColor);
  const circles = useMeshGradientStore((s) => s.circles);

  const compositeCanvas = useCallback(() => {
    if (!canvasRef.current || !backgroundLayerRef.current) return;

    const ctx = canvasRef.current.getContext("2d", {
      alpha: true,
      willReadFrequently: false,
    });
    if (!ctx) return;

    const s = useMeshGradientStore.getState();
    const { width, height } = s.resolution;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = s.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const cssFilters = [
      s.blur > 0 ? `blur(${s.blur / 4}px)` : "",
      `brightness(${s.brightness}%)`,
      `contrast(${s.contrast}%)`,
      `saturate(${s.saturation}%)`,
    ]
      .filter(Boolean)
      .join(" ");

    ctx.filter = cssFilters;
    ctx.drawImage(backgroundLayerRef.current, 0, 0);

    if (s.grainIntensity > 0) {
      const grainSeed = meshGrainSeedFromVisualState({
        backgroundColor: s.backgroundColor,
        circles: s.circles,
        blur: s.blur,
        saturation: s.saturation,
        contrast: s.contrast,
        brightness: s.brightness,
        grainIntensity: s.grainIntensity,
      });
      applyGrainEffect(ctx, s.grainIntensity / 100, grainSeed);
    }
  }, []);

  const debouncedCompositeCanvas = useMemo(
    () => debounce(() => compositeCanvas(), 16),
    [compositeCanvas],
  );

  useEffect(() => {
    if (!backgroundLayerRef.current) {
      backgroundLayerRef.current = document.createElement("canvas");
    }
    const bg = backgroundLayerRef.current;
    bg.width = resolution.width;
    bg.height = resolution.height;
  }, [resolution.width, resolution.height]);

  useEffect(() => {
    if (!backgroundLayerRef.current) return;
    const ctx = backgroundLayerRef.current.getContext("2d");
    if (!ctx) return;

    const { width, height } = resolution;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    for (const circle of circles) {
      drawShape(ctx, circle);
    }

    debouncedCompositeCanvas();
  }, [backgroundColor, circles, resolution, debouncedCompositeCanvas]);

  useEffect(() => {
    const unsub = useMeshGradientStore.subscribe(() => {
      debouncedCompositeCanvas();
    });
    return unsub;
  }, [debouncedCompositeCanvas]);

  const { width, height } = resolution;

  return (
    <canvas
      id={CANVAS_ID}
      ref={canvasRef}
      width={width}
      height={height}
      className={cn(
        "h-full max-h-[min(56vh,520px)] w-full rounded-xl border border-border/60 bg-muted/20 object-contain",
        className,
      )}
      style={{
        transform: "translate3d(0,0,0)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        imageRendering: "-webkit-optimize-contrast",
        willChange: "transform",
      }}
    />
  );
}

export function getMeshGradientCanvasElement(): HTMLCanvasElement | null {
  return document.querySelector(`#${CANVAS_ID}`);
}
