import "server-only";

import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { buildCssLinearGradient } from "@/lib/color-gradients";
import { type HarmonyMode, normalizeHex } from "@/lib/color-palette";
import type { ColorTag } from "./best-gallery-types";

export interface BestPaletteRow {
  idx: number;
  name: string;
  baseHex: string;
  mode: HarmonyMode;
  colorFamily:
    | "red"
    | "orange"
    | "yellow"
    | "green"
    | "blue"
    | "purple"
    | "pink"
    | "neutral";
  aesthetic: "classic" | "dark-modern";
  saturationMul: number;
  lightnessMul: number;
  hexes: string[];
  score: number;
  minTextRatio: number;
  colorTag: ColorTag;
  styleClassic: boolean;
  styleDarkModern: boolean;
  styleWarm: boolean;
  styleCold: boolean;
  styleBright: boolean;
  styleDark: boolean;
  stylePastel: boolean;
  styleVintage: boolean;
  styleMonochromatic: boolean;
  styleGradient: boolean;
}

export interface BestGradientRow {
  idx: number;
  name: string;
  baseHex: string;
  mode: HarmonyMode;
  colorFamily:
    | "red"
    | "orange"
    | "yellow"
    | "green"
    | "blue"
    | "purple"
    | "pink"
    | "neutral";
  aesthetic: "classic" | "dark-modern";
  angle: number;
  saturationMul: number;
  lightnessMul: number;
  stops: string[];
  score: number;
  minTextRatio: number;
  adjacentContrastMin: number;
  colorTag: ColorTag;
  styleClassic: boolean;
  styleDarkModern: boolean;
  styleWarm: boolean;
  styleCold: boolean;
  styleBright: boolean;
  styleDark: boolean;
  stylePastel: boolean;
  styleVintage: boolean;
  styleMonochromatic: boolean;
  styleGradient: boolean;
}

function ensureMode(value: string): HarmonyMode | null {
  const v = value.trim();
  if (
    v === "analogous" ||
    v === "complementary" ||
    v === "triadic" ||
    v === "tetradic" ||
    v === "monochrome"
  ) {
    return v;
  }
  return null;
}

const BEST_PALETTES_CSV_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "best-palettes.csv",
);

const BEST_GRADIENTS_CSV_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "best-gradients.csv",
);

function readCsvTextSync(csvPath: string): string | null {
  try {
    return fs.readFileSync(csvPath, "utf8");
  } catch {
    return null;
  }
}

async function readCsvTextAsync(csvPath: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(csvPath, "utf8");
  } catch {
    return null;
  }
}

export async function readBestPalettesAsync(): Promise<BestPaletteRow[]> {
  const text = await readCsvTextAsync(BEST_PALETTES_CSV_PATH);
  if (!text) return [];

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => String(h).trim(),
  });

  const rows: BestPaletteRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const r = parsed.data[i] as Record<string, string> | undefined;
    if (!r) continue;

    const mode = ensureMode(r.mode ?? "");
    if (!mode) continue;

    const baseHex = normalizeHexCell(r.baseHex);
    if (!baseHex) continue;

    const hexes = [r.hex1, r.hex2, r.hex3, r.hex4, r.hex5].map((v) =>
      normalizeHexCell(v),
    );
    if (hexes.some((h) => h === null)) continue;

    const score = parseNumber(r.score);
    const minTextRatio = parseNumber(r.minTextRatio);
    const idx = parseNumber(r.idx);
    const name = String(r.name ?? "").trim();
    const colorFamily = String(r.colorFamily ?? "").trim();
    const aesthetic = String(r.aesthetic ?? "").trim();
    if (
      colorFamily !== "red" &&
      colorFamily !== "orange" &&
      colorFamily !== "yellow" &&
      colorFamily !== "green" &&
      colorFamily !== "teal" &&
      colorFamily !== "brown" &&
      colorFamily !== "blue" &&
      colorFamily !== "purple" &&
      colorFamily !== "pink" &&
      colorFamily !== "neutral"
    ) {
      continue;
    }
    if (aesthetic !== "classic" && aesthetic !== "dark-modern") continue;

    const colorTag = String(r.colorTag ?? "").trim();
    if (
      colorTag !== "red" &&
      colorTag !== "orange" &&
      colorTag !== "brown" &&
      colorTag !== "yellow" &&
      colorTag !== "green" &&
      colorTag !== "turquoise" &&
      colorTag !== "blue" &&
      colorTag !== "violet" &&
      colorTag !== "pink" &&
      colorTag !== "white" &&
      colorTag !== "gray" &&
      colorTag !== "black"
    ) {
      continue;
    }

    const styleClassic = parseBool01(r.styleClassic);
    const styleDarkModern = parseBool01(r.styleDarkModern);
    const styleWarm = parseBool01(r.styleWarm);
    const styleCold = parseBool01(r.styleCold);
    const styleBright = parseBool01(r.styleBright);
    const styleDark = parseBool01(r.styleDark);
    const stylePastel = parseBool01(r.stylePastel);
    const styleVintage = parseBool01(r.styleVintage);
    const styleMonochromatic = parseBool01(r.styleMonochromatic);
    const styleGradient = parseBool01(r.styleGradient);

    if (
      styleClassic === null ||
      styleDarkModern === null ||
      styleWarm === null ||
      styleCold === null ||
      styleBright === null ||
      styleDark === null ||
      stylePastel === null ||
      styleVintage === null ||
      styleMonochromatic === null ||
      styleGradient === null
    ) {
      continue;
    }

    const saturationMul = parseNumber(r.saturationMul);
    const lightnessMul = parseNumber(r.lightnessMul);

    if (!name) continue;
    if (!Number.isFinite(score) || !Number.isFinite(minTextRatio)) continue;
    if (!Number.isFinite(idx)) continue;

    rows.push({
      idx,
      name,
      baseHex,
      mode,
      colorFamily: colorFamily as BestPaletteRow["colorFamily"],
      aesthetic: aesthetic as BestPaletteRow["aesthetic"],
      saturationMul: Number.isFinite(saturationMul) ? saturationMul : 1,
      lightnessMul: Number.isFinite(lightnessMul) ? lightnessMul : 1,
      hexes: hexes as string[],
      score,
      minTextRatio,
      colorTag: colorTag as BestPaletteRow["colorTag"],
      styleClassic,
      styleDarkModern,
      styleWarm,
      styleCold,
      styleBright,
      styleDark,
      stylePastel,
      styleVintage,
      styleMonochromatic,
      styleGradient,
    });
  }

  rows.sort((a, b) => b.score - a.score);
  return rows;
}

export async function readBestGradientsAsync(): Promise<BestGradientRow[]> {
  const text = await readCsvTextAsync(BEST_GRADIENTS_CSV_PATH);
  if (!text) return [];

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => String(h).trim(),
  });

  const rows: BestGradientRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const r = parsed.data[i] as Record<string, string> | undefined;
    if (!r) continue;

    const mode = ensureMode(r.mode ?? "");
    if (!mode) continue;

    const colorFamily = String(r.colorFamily ?? "").trim();
    const aesthetic = String(r.aesthetic ?? "").trim();
    if (
      colorFamily !== "red" &&
      colorFamily !== "orange" &&
      colorFamily !== "yellow" &&
      colorFamily !== "green" &&
      colorFamily !== "teal" &&
      colorFamily !== "brown" &&
      colorFamily !== "blue" &&
      colorFamily !== "purple" &&
      colorFamily !== "pink" &&
      colorFamily !== "neutral"
    ) {
      continue;
    }
    if (aesthetic !== "classic" && aesthetic !== "dark-modern") continue;

    const colorTag = String(r.colorTag ?? "").trim();
    if (
      colorTag !== "red" &&
      colorTag !== "orange" &&
      colorTag !== "brown" &&
      colorTag !== "yellow" &&
      colorTag !== "green" &&
      colorTag !== "turquoise" &&
      colorTag !== "blue" &&
      colorTag !== "violet" &&
      colorTag !== "pink" &&
      colorTag !== "white" &&
      colorTag !== "gray" &&
      colorTag !== "black"
    ) {
      continue;
    }

    const styleClassic = parseBool01(r.styleClassic);
    const styleDarkModern = parseBool01(r.styleDarkModern);
    const styleWarm = parseBool01(r.styleWarm);
    const styleCold = parseBool01(r.styleCold);
    const styleBright = parseBool01(r.styleBright);
    const styleDark = parseBool01(r.styleDark);
    const stylePastel = parseBool01(r.stylePastel);
    const styleVintage = parseBool01(r.styleVintage);
    const styleMonochromatic = parseBool01(r.styleMonochromatic);
    const styleGradient = parseBool01(r.styleGradient);

    if (
      styleClassic === null ||
      styleDarkModern === null ||
      styleWarm === null ||
      styleCold === null ||
      styleBright === null ||
      styleDark === null ||
      stylePastel === null ||
      styleVintage === null ||
      styleMonochromatic === null ||
      styleGradient === null
    ) {
      continue;
    }

    const baseHex = normalizeHexCell(r.baseHex);
    if (!baseHex) continue;

    const stops = [r.stop1, r.stop2, r.stop3, r.stop4, r.stop5].map((v) =>
      normalizeHexCell(v),
    );
    if (stops.some((s) => s === null)) continue;

    const angle = parseNumber(r.angle);
    const saturationMul = parseNumber(r.saturationMul);
    const lightnessMul = parseNumber(r.lightnessMul);
    const score = parseNumber(r.score);
    const minTextRatio = parseNumber(r.minTextRatio);
    const adjacentContrastMin = parseNumber(r.adjacentContrastMin);
    const idx = parseNumber(r.idx);

    const name = String(r.name ?? "").trim();

    if (!name) continue;
    if (
      !Number.isFinite(angle) ||
      !Number.isFinite(saturationMul) ||
      !Number.isFinite(lightnessMul) ||
      !Number.isFinite(score) ||
      !Number.isFinite(minTextRatio) ||
      !Number.isFinite(adjacentContrastMin) ||
      !Number.isFinite(idx)
    ) {
      continue;
    }

    rows.push({
      idx,
      name,
      baseHex,
      mode,
      colorFamily: colorFamily as BestGradientRow["colorFamily"],
      aesthetic: aesthetic as BestGradientRow["aesthetic"],
      angle,
      saturationMul,
      lightnessMul,
      stops: stops as string[],
      score,
      minTextRatio,
      adjacentContrastMin,
      colorTag: colorTag as BestGradientRow["colorTag"],
      styleClassic,
      styleDarkModern,
      styleWarm,
      styleCold,
      styleBright,
      styleDark,
      stylePastel,
      styleVintage,
      styleMonochromatic,
      styleGradient,
    });
  }

  rows.sort((a, b) => b.score - a.score);
  return rows;
}

function parseNumber(value: string | undefined): number {
  const n = value === undefined ? NaN : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function parseBool01(value: string | undefined): boolean | null {
  const v = value === undefined ? "" : String(value).trim();
  if (v === "1") return true;
  if (v === "0") return false;
  return null;
}

function normalizeHexCell(value: string | undefined): string | null {
  if (!value) return null;
  return normalizeHex(value);
}

export function getBestPalettesCsvPath(): string {
  return BEST_PALETTES_CSV_PATH;
}

export function getBestGradientsCsvPath(): string {
  return BEST_GRADIENTS_CSV_PATH;
}

export function readBestPalettes(): BestPaletteRow[] {
  const text = readCsvTextSync(BEST_PALETTES_CSV_PATH);
  if (!text) return [];

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => String(h).trim(),
  });

  const rows: BestPaletteRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const r = parsed.data[i] as Record<string, string> | undefined;
    if (!r) continue;

    const mode = ensureMode(r.mode ?? "");
    if (!mode) continue;

    const baseHex = normalizeHexCell(r.baseHex);
    if (!baseHex) continue;

    const hexes = [r.hex1, r.hex2, r.hex3, r.hex4, r.hex5].map((v) =>
      normalizeHexCell(v),
    );
    if (hexes.some((h) => h === null)) continue;

    const score = parseNumber(r.score);
    const minTextRatio = parseNumber(r.minTextRatio);
    const idx = parseNumber(r.idx);
    const name = String(r.name ?? "").trim();
    const colorFamily = String(r.colorFamily ?? "").trim();
    const aesthetic = String(r.aesthetic ?? "").trim();
    if (
      colorFamily !== "red" &&
      colorFamily !== "orange" &&
      colorFamily !== "yellow" &&
      colorFamily !== "green" &&
      colorFamily !== "teal" &&
      colorFamily !== "brown" &&
      colorFamily !== "blue" &&
      colorFamily !== "purple" &&
      colorFamily !== "pink" &&
      colorFamily !== "neutral"
    ) {
      continue;
    }
    if (aesthetic !== "classic" && aesthetic !== "dark-modern") continue;

    const colorTag = String(r.colorTag ?? "").trim();
    if (
      colorTag !== "red" &&
      colorTag !== "orange" &&
      colorTag !== "brown" &&
      colorTag !== "yellow" &&
      colorTag !== "green" &&
      colorTag !== "turquoise" &&
      colorTag !== "blue" &&
      colorTag !== "violet" &&
      colorTag !== "pink" &&
      colorTag !== "white" &&
      colorTag !== "gray" &&
      colorTag !== "black"
    ) {
      continue;
    }

    const styleClassic = parseBool01(r.styleClassic);
    const styleDarkModern = parseBool01(r.styleDarkModern);
    const styleWarm = parseBool01(r.styleWarm);
    const styleCold = parseBool01(r.styleCold);
    const styleBright = parseBool01(r.styleBright);
    const styleDark = parseBool01(r.styleDark);
    const stylePastel = parseBool01(r.stylePastel);
    const styleVintage = parseBool01(r.styleVintage);
    const styleMonochromatic = parseBool01(r.styleMonochromatic);
    const styleGradient = parseBool01(r.styleGradient);

    if (
      styleClassic === null ||
      styleDarkModern === null ||
      styleWarm === null ||
      styleCold === null ||
      styleBright === null ||
      styleDark === null ||
      stylePastel === null ||
      styleVintage === null ||
      styleMonochromatic === null ||
      styleGradient === null
    ) {
      continue;
    }

    const saturationMul = parseNumber(r.saturationMul);
    const lightnessMul = parseNumber(r.lightnessMul);

    if (!name) continue;
    if (!Number.isFinite(score) || !Number.isFinite(minTextRatio)) continue;
    if (!Number.isFinite(idx)) continue;

    rows.push({
      idx,
      name,
      baseHex,
      mode,
      colorFamily: colorFamily as BestPaletteRow["colorFamily"],
      aesthetic: aesthetic as BestPaletteRow["aesthetic"],
      saturationMul: Number.isFinite(saturationMul) ? saturationMul : 1,
      lightnessMul: Number.isFinite(lightnessMul) ? lightnessMul : 1,
      hexes: hexes as string[],
      score,
      minTextRatio,
      colorTag: colorTag as BestPaletteRow["colorTag"],
      styleClassic,
      styleDarkModern,
      styleWarm,
      styleCold,
      styleBright,
      styleDark,
      stylePastel,
      styleVintage,
      styleMonochromatic,
      styleGradient,
    });
  }

  rows.sort((a, b) => b.score - a.score);
  return rows;
}

export function readBestGradients(): BestGradientRow[] {
  const text = readCsvTextSync(BEST_GRADIENTS_CSV_PATH);
  if (!text) return [];

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => String(h).trim(),
  });

  const rows: BestGradientRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const r = parsed.data[i] as Record<string, string> | undefined;
    if (!r) continue;

    const mode = ensureMode(r.mode ?? "");
    if (!mode) continue;

    const colorFamily = String(r.colorFamily ?? "").trim();
    const aesthetic = String(r.aesthetic ?? "").trim();
    if (
      colorFamily !== "red" &&
      colorFamily !== "orange" &&
      colorFamily !== "yellow" &&
      colorFamily !== "green" &&
      colorFamily !== "teal" &&
      colorFamily !== "brown" &&
      colorFamily !== "blue" &&
      colorFamily !== "purple" &&
      colorFamily !== "pink" &&
      colorFamily !== "neutral"
    ) {
      continue;
    }
    if (aesthetic !== "classic" && aesthetic !== "dark-modern") continue;

    const colorTag = String(r.colorTag ?? "").trim();
    if (
      colorTag !== "red" &&
      colorTag !== "orange" &&
      colorTag !== "brown" &&
      colorTag !== "yellow" &&
      colorTag !== "green" &&
      colorTag !== "turquoise" &&
      colorTag !== "blue" &&
      colorTag !== "violet" &&
      colorTag !== "pink" &&
      colorTag !== "white" &&
      colorTag !== "gray" &&
      colorTag !== "black"
    ) {
      continue;
    }

    const styleClassic = parseBool01(r.styleClassic);
    const styleDarkModern = parseBool01(r.styleDarkModern);
    const styleWarm = parseBool01(r.styleWarm);
    const styleCold = parseBool01(r.styleCold);
    const styleBright = parseBool01(r.styleBright);
    const styleDark = parseBool01(r.styleDark);
    const stylePastel = parseBool01(r.stylePastel);
    const styleVintage = parseBool01(r.styleVintage);
    const styleMonochromatic = parseBool01(r.styleMonochromatic);
    const styleGradient = parseBool01(r.styleGradient);

    if (
      styleClassic === null ||
      styleDarkModern === null ||
      styleWarm === null ||
      styleCold === null ||
      styleBright === null ||
      styleDark === null ||
      stylePastel === null ||
      styleVintage === null ||
      styleMonochromatic === null ||
      styleGradient === null
    ) {
      continue;
    }

    const baseHex = normalizeHexCell(r.baseHex);
    if (!baseHex) continue;

    const stops = [r.stop1, r.stop2, r.stop3, r.stop4, r.stop5].map((v) =>
      normalizeHexCell(v),
    );
    if (stops.some((s) => s === null)) continue;

    const angle = parseNumber(r.angle);
    const saturationMul = parseNumber(r.saturationMul);
    const lightnessMul = parseNumber(r.lightnessMul);
    const score = parseNumber(r.score);
    const minTextRatio = parseNumber(r.minTextRatio);
    const adjacentContrastMin = parseNumber(r.adjacentContrastMin);
    const idx = parseNumber(r.idx);

    const name = String(r.name ?? "").trim();

    if (!name) continue;
    if (
      !Number.isFinite(angle) ||
      !Number.isFinite(saturationMul) ||
      !Number.isFinite(lightnessMul) ||
      !Number.isFinite(score) ||
      !Number.isFinite(minTextRatio) ||
      !Number.isFinite(adjacentContrastMin) ||
      !Number.isFinite(idx)
    ) {
      continue;
    }

    rows.push({
      idx,
      name,
      baseHex,
      mode,
      colorFamily: colorFamily as BestGradientRow["colorFamily"],
      aesthetic: aesthetic as BestGradientRow["aesthetic"],
      angle,
      saturationMul,
      lightnessMul,
      stops: stops as string[],
      score,
      minTextRatio,
      adjacentContrastMin,
      colorTag: colorTag as BestGradientRow["colorTag"],
      styleClassic,
      styleDarkModern,
      styleWarm,
      styleCold,
      styleBright,
      styleDark,
      stylePastel,
      styleVintage,
      styleMonochromatic,
      styleGradient,
    });
  }

  rows.sort((a, b) => b.score - a.score);
  return rows;
}

export function buildBestGradientCss(row: BestGradientRow): string {
  return buildCssLinearGradient(row.angle, row.stops);
}
