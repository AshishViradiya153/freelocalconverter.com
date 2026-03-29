/**
 * Favicon raster pipeline:
 * 1. Center-crop to the largest square (cover, no letterboxing).
 * 2. Downscale that square once to at most {@link MASTER_SQUARE_MAX}px per edge (never upscale).
 * 3. Derive every output size from that master with high-quality smoothing (parallel).
 *
 * Step 2 avoids feeding multi‑megapixel sources through five separate tiny `drawImage` paths
 * (faster, more stable memory) while step 3 keeps each export sharp.
 */

export const MASTER_SQUARE_MAX = 512;

export const FAVICON_PNG_SIZES = [16, 32, 180, 192, 512] as const;

export type FaviconPngSize = (typeof FAVICON_PNG_SIZES)[number];

export interface CenterSquareCrop {
  sx: number;
  sy: number;
  side: number;
}

export function computeCenterSquareCrop(
  width: number,
  height: number,
): CenterSquareCrop {
  const side = Math.min(width, height);
  return {
    sx: (width - side) / 2,
    sy: (height - side) / 2,
    side,
  };
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/png",
      1,
    );
  });
}

async function renderSourceToPng(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, sw, sh, 0, 0, dw, dh);
  const blob = await canvasToPngBlob(canvas);
  return new Uint8Array(await blob.arrayBuffer());
}

interface MasterSquare {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}

/**
 * Center-crop to square, then resize to `min(side, MASTER_SQUARE_MAX)` using the best
 * available browser path (`createImageBitmap` resize when supported).
 */
async function buildMasterSquare(
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
): Promise<MasterSquare> {
  const { sx, sy, side } = computeCenterSquareCrop(imageWidth, imageHeight);
  if (side < 1) {
    throw new Error("Image has invalid dimensions");
  }

  const edge = Math.min(side, MASTER_SQUARE_MAX);

  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(image, sx, sy, side, side, {
        resizeWidth: edge,
        resizeHeight: edge,
        resizeQuality: "high",
      });
      return {
        source: bmp,
        width: bmp.width,
        height: bmp.height,
        dispose: () => {
          try {
            bmp.close();
          } catch {
            /* closed */
          }
        },
      };
    } catch {
      /* fall through to canvas */
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, sx, sy, side, side, 0, 0, edge, edge);

  return {
    source: canvas,
    width: edge,
    height: edge,
    dispose: () => { },
  };
}

export type FaviconPngMap = Record<FaviconPngSize, Uint8Array>;

/**
 * All standard favicon PNG sizes from one image, sharing one master square (see module doc).
 */
export async function renderFaviconPngMap(
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
): Promise<FaviconPngMap> {
  const master = await buildMasterSquare(image, imageWidth, imageHeight);
  try {
    const entries = await Promise.all(
      FAVICON_PNG_SIZES.map(async (size) => {
        const png = await renderSourceToPng(
          master.source,
          master.width,
          master.height,
          size,
          size,
        );
        return [size, png] as const;
      }),
    );
    return Object.fromEntries(entries) as FaviconPngMap;
  } finally {
    master.dispose();
  }
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
