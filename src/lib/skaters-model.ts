import type { FileCellData } from "@/types/data-grid";

export const SKATER_STANCES = ["regular", "goofy"] as const;
export const SKATER_STYLES = [
  "street",
  "vert",
  "park",
  "freestyle",
  "all-around",
] as const;
export const SKATER_STATUSES = ["amateur", "sponsored", "pro", "legend"] as const;

export type SkaterStance = (typeof SKATER_STANCES)[number];
export type SkaterStyle = (typeof SKATER_STYLES)[number];
export type SkaterStatus = (typeof SKATER_STATUSES)[number];

export interface Skater {
  id: string;
  order: number;
  name: string | null;
  email: string | null;
  stance: SkaterStance;
  style: SkaterStyle;
  status: SkaterStatus;
  yearsSkating: number;
  startedSkating: Date | null;
  isPro: boolean;
  tricks: string[] | null;
  media: Array<FileCellData> | null;
  createdAt: Date;
  updatedAt: Date | null;
}
