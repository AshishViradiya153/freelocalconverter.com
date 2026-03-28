import { createNoise2D } from "simplex-noise";

export function applyGrainEffect(
  ctx: CanvasRenderingContext2D,
  intensity: number = 0.15,
) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  const noise2D = createNoise2D();

  // Reduced amplitude for Safari compatibility
  const scale = 1;
  const amplitude = 50; // Reduced from 200

  // Process every pixel without gaps
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % ctx.canvas.width;
    const y = Math.floor(i / 4 / ctx.canvas.width);

    // Generate monochromatic noise
    const noise = noise2D(x * scale, y * scale) * (intensity * amplitude);

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
