import { normalizeAngle } from "@/lib/color-gradients";

export function downloadCanvasPng(canvas: HTMLCanvasElement, fileName: string) {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export const LINEAR_GRADIENT_PNG_WIDTH = 2560;
export const LINEAR_GRADIENT_PNG_HEIGHT = 1440;

export function createLinearGradientExportCanvas(opts: {
  angleDeg: number;
  hexStops: string[];
  width?: number;
  height?: number;
}): HTMLCanvasElement {
  const width = opts.width ?? LINEAR_GRADIENT_PNG_WIDTH;
  const height = opts.height ?? LINEAR_GRADIENT_PNG_HEIGHT;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const a = normalizeAngle(opts.angleDeg);
  const angleRad = ((a - 90) * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const len = Math.hypot(width, height) * 1.15;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  const x0 = cx - dx * (len / 2);
  const y0 = cy - dy * (len / 2);
  const x1 = cx + dx * (len / 2);
  const y1 = cy + dy * (len / 2);

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  const n = opts.hexStops.length;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    gradient.addColorStop(t, opts.hexStops[i] ?? "#000000");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

export const PALETTE_STRIPES_PNG_WIDTH = 2560;
export const PALETTE_STRIPES_PNG_HEIGHT = 1440;

export function createPaletteStripesExportCanvas(
  hexes: string[],
  width = PALETTE_STRIPES_PNG_WIDTH,
  height = PALETTE_STRIPES_PNG_HEIGHT,
): HTMLCanvasElement | null {
  const n = hexes.length;
  if (n === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  for (let i = 0; i < n; i++) {
    const x0 = Math.round((i / n) * width);
    const x1 = Math.round(((i + 1) / n) * width);
    ctx.fillStyle = hexes[i] ?? "#000000";
    ctx.fillRect(x0, 0, x1 - x0, height);
  }

  return canvas;
}
