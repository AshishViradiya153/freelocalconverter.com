function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (x: number) => clampByte(x).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function sampleManifestColorsFromImageSource(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): { theme_color: string; background_color: string } {
  const sample = 64;
  const canvas = document.createElement("canvas");
  canvas.width = sample;
  canvas.height = sample;
  const ctx = canvas.getContext("2d");
  if (!ctx || sourceWidth < 1 || sourceHeight < 1) {
    return { theme_color: "#ffffff", background_color: "#ffffff" };
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, sample, sample);
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, sample, sample);
  } catch {
    return { theme_color: "#ffffff", background_color: "#ffffff" };
  }
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const px = data.data;
  for (let i = 0; i + 3 < px.length; i += 4) {
    const rv = px[i];
    const gv = px[i + 1];
    const bv = px[i + 2];
    const av = px[i + 3];
    if (
      av === undefined ||
      rv === undefined ||
      gv === undefined ||
      bv === undefined
    ) {
      continue;
    }
    if (av < 12) continue;
    r += rv;
    g += gv;
    b += bv;
    n++;
  }
  if (n === 0) {
    return { theme_color: "#ffffff", background_color: "#ffffff" };
  }
  r /= n;
  g /= n;
  b /= n;
  const base = rgbToHex(r, g, b);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const theme = lum > 245 ? "#0f172a" : rgbToHex(r * 0.92, g * 0.92, b * 0.92);
  return { theme_color: theme, background_color: base };
}
