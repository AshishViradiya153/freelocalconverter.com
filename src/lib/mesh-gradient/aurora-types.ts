export type BlobShape = "circle" | "square" | "pill" | "organic";

export interface AuroraBlob {
  id: string;
  color: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  shape: BlobShape;
  zIndex: number;
}

/** SVG noise texture (same as reference aurora UI). */
export const AURORA_NOISE_DATA_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")";

export function blobBorderRadius(shape: BlobShape): string {
  switch (shape) {
    case "circle":
      return "50%";
    case "square":
      return "0%";
    case "pill":
      return "100px";
    case "organic":
      return "30% 70% 70% 30% / 30% 30% 70% 70%";
    default:
      return "50%";
  }
}

export const BLOB_SHAPE_OPTIONS: BlobShape[] = [
  "circle",
  "square",
  "pill",
  "organic",
];
