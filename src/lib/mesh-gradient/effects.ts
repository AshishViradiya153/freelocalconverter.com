import { createNoise2D } from "simplex-noise";

import { createMulberry32 } from "./mulberry32";

/**
 * Film grain. Uses UV-space noise so thumbnails and full-size export share the same pattern.
 * `seed` fixes the Simplex permutation table so the same mesh state matches list vs editor.
 */
export function applyGrainEffect(
  ctx: CanvasRenderingContext2D,
  intensity: number = 0.15,
  seed?: number,
) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const randomFn = seed != null ? createMulberry32(seed) : Math.random;
  const noise2D = createNoise2D(randomFn);

  // UV frequency: resolution-independent grain scale
  const uvScale = 180;
  const amplitude = 50;

  for (let i = 0; i < data.length; i += 4) {
    const px = (i / 4) % w;
    const py = Math.floor(i / 4 / w);
    const u = (px + 0.5) / w;
    const v = (py + 0.5) / h;

    const noise = noise2D(u * uvScale, v * uvScale) * (intensity * amplitude);

    // Apply noise as a darker overlay in Safari
    const grainValue = Math.max(-30, Math.min(30, noise)); // Limit the range

    // Darken pixels instead of brightening
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    data[i] = Math.max(0, r + grainValue);
    data[i + 1] = Math.max(0, g + grainValue);
    data[i + 2] = Math.max(0, b + grainValue);
  }

  ctx.putImageData(imageData, 0, 0);
}
