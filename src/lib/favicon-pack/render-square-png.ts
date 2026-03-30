import { sampleManifestColorsFromImageSource } from "./manifest-colors";

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

export function clampSquareCrop(
  imageWidth: number,
  imageHeight: number,
  sx: number,
  sy: number,
  side: number,
): CenterSquareCrop {
  const maxSide = Math.min(imageWidth, imageHeight);
  const s = Math.max(1, Math.min(Math.floor(side), maxSide));
  const maxSx = imageWidth - s;
  const maxSy = imageHeight - s;
  return {
    sx: Math.max(0, Math.min(Math.floor(sx), maxSx)),
    sy: Math.max(0, Math.min(Math.floor(sy), maxSy)),
    side: s,
  };
}

export function recenterSquareCropSide(
  imageWidth: number,
  imageHeight: number,
  prev: CenterSquareCrop,
  newSide: number,
): CenterSquareCrop {
  const cx = prev.sx + prev.side / 2;
  const cy = prev.sy + prev.side / 2;
  return clampSquareCrop(
    imageWidth,
    imageHeight,
    cx - newSide / 2,
    cy - newSide / 2,
    newSide,
  );
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

async function buildMasterSquare(
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  crop: CenterSquareCrop,
): Promise<MasterSquare> {
  const { sx, sy, side } = clampSquareCrop(
    imageWidth,
    imageHeight,
    crop.sx,
    crop.sy,
    crop.side,
  );
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
    dispose: () => {},
  };
}

export type FaviconPngMap = Record<FaviconPngSize, Uint8Array>;

export async function renderFaviconPngMapWithManifest(
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  crop?: CenterSquareCrop,
): Promise<{
  map: FaviconPngMap;
  theme_color: string;
  background_color: string;
}> {
  const resolved = crop ?? computeCenterSquareCrop(imageWidth, imageHeight);
  const master = await buildMasterSquare(
    image,
    imageWidth,
    imageHeight,
    resolved,
  );
  try {
    const { theme_color, background_color } =
      sampleManifestColorsFromImageSource(
        master.source,
        master.width,
        master.height,
      );
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
    return {
      map: Object.fromEntries(entries) as FaviconPngMap,
      theme_color,
      background_color,
    };
  } finally {
    master.dispose();
  }
}

export async function renderFaviconPngMap(
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  crop?: CenterSquareCrop,
): Promise<FaviconPngMap> {
  const { map } = await renderFaviconPngMapWithManifest(
    image,
    imageWidth,
    imageHeight,
    crop,
  );
  return map;
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
