export type ImageRotationDeg = 0 | 90 | 180 | 270;

const FALLBACK_RASTER = 512;

function extensionOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m?.[1]?.toLowerCase() ?? "";
}

export function isSupportedFaviconImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = extensionOf(file.name);
  return [
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "tif",
    "tiff",
    "avif",
    "heic",
    "heif",
    "svg",
    "ico",
  ].includes(ext);
}

async function decodeToDrawable(
  url: string,
): Promise<{ drawable: CanvasImageSource; width: number; height: number }> {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  if (w >= 1 && h >= 1) {
    return { drawable: img, width: w, height: h };
  }

  const canvas = document.createElement("canvas");
  canvas.width = FALLBACK_RASTER;
  canvas.height = FALLBACK_RASTER;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, FALLBACK_RASTER, FALLBACK_RASTER);
  return {
    drawable: canvas,
    width: FALLBACK_RASTER,
    height: FALLBACK_RASTER,
  };
}

/**
 * Rasterize upload (including SVG / ICO where the browser can decode) to PNG
 * with optional 90° steps. Output is used for crop + ZIP.
 */
export async function rasterizeImageFileToPngFile(
  file: File,
  rotationDeg: ImageRotationDeg,
): Promise<{ file: File; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const { drawable, width: w, height: h } = await decodeToDrawable(url);
    const rad = (rotationDeg * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const cw = Math.max(1, Math.ceil(w * cos + h * sin));
    const ch = Math.max(1, Math.ceil(h * cos + w * sin));

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("2D canvas context unavailable");
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(rad);
    ctx.drawImage(drawable, -w / 2, -h / 2);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/png",
        1,
      );
    });
    const out = new File([blob], "favicon-raster.png", { type: "image/png" });
    return { file: out, width: cw, height: ch };
  } finally {
    URL.revokeObjectURL(url);
  }
}
