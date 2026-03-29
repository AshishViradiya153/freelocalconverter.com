import { applyGrainEffect } from "@/lib/mesh-gradient/effects";
import { meshGrainSeedFromVisualState } from "@/lib/mesh-gradient/mesh-grain-seed";
import { drawShape } from "@/lib/mesh-gradient/shapes";
import type { TrendingMeshGradientItem } from "@/lib/mesh-gradient/trending-mesh-types";

export interface MeshFrameSize {
  width: number;
  height: number;
}

/** Paints one mesh frame (blobs + blur + grain) into `out`, using `blobsScratch` as an internal buffer. */
export function paintMeshGradientFrame(
  out: HTMLCanvasElement,
  blobsScratch: HTMLCanvasElement,
  item: Pick<
    TrendingMeshGradientItem,
    | "backgroundColor"
    | "circles"
    | "blur"
    | "saturation"
    | "contrast"
    | "brightness"
    | "grainIntensity"
  >,
  size: MeshFrameSize,
): void {
  const { width, height } = size;
  const bctx = blobsScratch.getContext("2d");
  const octx = out.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  });
  if (!bctx || !octx) return;

  blobsScratch.width = width;
  blobsScratch.height = height;
  out.width = width;
  out.height = height;

  bctx.clearRect(0, 0, width, height);
  bctx.fillStyle = item.backgroundColor;
  bctx.fillRect(0, 0, width, height);
  for (const circle of item.circles) {
    drawShape(bctx, circle);
  }

  octx.clearRect(0, 0, width, height);
  octx.fillStyle = item.backgroundColor;
  octx.fillRect(0, 0, width, height);

  const cssFilters = [
    item.blur > 0 ? `blur(${item.blur / 4}px)` : "",
    `brightness(${item.brightness}%)`,
    `contrast(${item.contrast}%)`,
    `saturate(${item.saturation}%)`,
  ]
    .filter(Boolean)
    .join(" ");

  octx.filter = cssFilters;
  octx.drawImage(blobsScratch, 0, 0);

  if (item.grainIntensity > 0) {
    const grainSeed = meshGrainSeedFromVisualState({
      backgroundColor: item.backgroundColor,
      circles: item.circles,
      blur: item.blur,
      saturation: item.saturation,
      contrast: item.contrast,
      brightness: item.brightness,
      grainIntensity: item.grainIntensity,
    });
    applyGrainEffect(octx, item.grainIntensity / 100, grainSeed);
  }
  octx.filter = "none";
}
