import type { TrendingMeshGradientItem } from "@/lib/mesh-gradient/trending-mesh-types";

/**
 * Footer brand mesh: custom palette. `#001220` base; blobs use oranges and blues.
 * No `#000000` blob — on this base it reads as “missing” ink inside `background-clip: text`.
 * Replaced with a light highlight (`#E6F2FF`) so glyphs stay legible.
 * `#0066CC` → `#8CC4FF` (lighter sky blue) for the same reason inside `background-clip: text`.
 *
 * **Blur is much lower than full-page trending presets** — `paintMeshGradientFrame` uses
 * `blur(preset/4)px` on a canvas only ~50–120px tall; values like 600 become ~150px blur and
 * wash all hues into one muddy average, so clipped text never “reads” your palette.
 */
export const FOOTER_BRAND_MESH_PRESET: Pick<
  TrendingMeshGradientItem,
  | "backgroundColor"
  | "circles"
  | "blur"
  | "saturation"
  | "contrast"
  | "brightness"
  | "grainIntensity"
> = {
  backgroundColor: "#001220",
  circles: [
    { color: "#FF6600", cx: 11, cy: 28 },
    { color: "#002B50", cx: 86, cy: 22 },
    { color: "#FFB366", cx: 48, cy: 12 },
    { color: "#004080", cx: 68, cy: 58 },
    { color: "#FF8000", cx: 24, cy: 72 },
    { color: "#8CC4FF", cx: 52, cy: 44 },
    { color: "#E6F2FF", cx: 6, cy: 88 },
    { color: "#66A3FF", cx: 93, cy: 70 },
  ],
  blur: 96,
  saturation: 115,
  contrast: 108,
  brightness: 105,
  grainIntensity: 12,
};
