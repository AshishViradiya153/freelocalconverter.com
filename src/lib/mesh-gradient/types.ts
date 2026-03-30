export interface CircleProps {
  color: string;
  cx: number;
  cy: number;
  r?: string;
  /** Whole-number blend share 1–100; all blobs sum to 100. Omitted in saved presets → equal split. */
  weight?: number;
}
