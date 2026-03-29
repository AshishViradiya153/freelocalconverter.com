#!/usr/bin/env node
/**
 * Generates curated "best" color palettes and gradients (CSV).
 *
 * Outputs:
 *  - public/data/best-palettes.csv (100 rows by default)
 *  - public/data/best-gradients.csv (100 rows by default)
 *
 * Usage:
 *   pnpm tsx scripts/generate-best-palettes-gradients.ts --count 100
 *
 * Notes:
 *  - Scoring is based on accessibility contrast: we prefer palettes where every
 *    swatch has a good best-text contrast (black/white) and adjacent swatches
 *    are also sufficiently distinct.
 *  - Generation is deterministic for a given seed so results are stable.
 */
import fs from "node:fs";
import path from "node:path";
import { generateGradientFromBase } from "@/lib/color-gradients";
import {
  bestTextColorOn,
  contrastRatio,
  generatePaletteFromBase,
  type HarmonyMode,
  hexToRgb,
  hslToRgb,
  rgbToHex,
  rgbToHsl,
} from "@/lib/color-palette";

type Args = {
  count: number;
  candidates: number;
  seed: number;
};

function parseArgs(argv: string[]): Args {
  function readNumber(flag: string, fallback: number): number {
    const idx = argv.indexOf(flag);
    if (idx === -1) return fallback;
    const raw = argv[idx + 1];
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : fallback;
  }

  return {
    count: readNumber("--count", 100),
    candidates: readNumber("--candidates", 150_000),
    seed: readNumber("--seed", 12345),
  };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  if (arr.length === 0) throw new Error("pick: empty array");
  const el = arr[Math.floor(rng() * arr.length)];
  if (el === undefined) throw new Error("pick: invalid index");
  return el;
}

function _randomBaseHex(rng: () => number): string {
  // Bias toward darker and lighter bases so WCAG text contrast improves.
  const h = rng() * 360;
  const s = 0.45 + rng() * 0.5; // 0.45..0.95
  const l =
    rng() < 0.5
      ? 0.08 + rng() * 0.35 // 0.08..0.43
      : 0.55 + rng() * 0.35; // 0.55..0.90
  return rgbToHex(hslToRgb({ h, s, l }));
}

function _minPairwiseContrast(hexes: string[]): number {
  let min = Infinity;
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const a = hexes[i];
      const b = hexes[j];
      if (a === undefined || b === undefined) continue;
      const c = contrastRatio(a, b);
      if (c < min) min = c;
    }
  }
  return min === Infinity ? 0 : min;
}

function pairwiseContrastQuantile(hexes: string[], q: number): number {
  const pairs: number[] = [];
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const a = hexes[i];
      const b = hexes[j];
      if (a === undefined || b === undefined) continue;
      pairs.push(contrastRatio(a, b));
    }
  }
  if (pairs.length === 0) return 0;
  pairs.sort((a, b) => a - b);
  const idx = Math.floor((pairs.length - 1) * Math.min(1, Math.max(0, q)));
  return pairs[idx] ?? 0;
}

function rgbMinDistanceNormalized(hexes: string[]): number {
  let min = Infinity;
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const hi = hexes[i];
      const hj = hexes[j];
      if (hi === undefined || hj === undefined) continue;
      const a = hexToRgb(hi);
      const b = hexToRgb(hj);
      const dr = a.r - b.r;
      const dg = a.g - b.g;
      const db = a.b - b.b;
      const distSq = dr * dr + dg * dg + db * db;
      if (distSq < min) min = distSq;
    }
  }
  if (min === Infinity) return 0;
  return Math.sqrt(min) / 255;
}

function minTextContrast(hexes: string[]): number {
  let min = Infinity;
  for (const hex of hexes) {
    const ratio = bestTextColorOn(hex).ratio;
    if (ratio < min) min = ratio;
  }
  return min === Infinity ? 0 : min;
}

function hslRanges(hexes: string[]): {
  hueSpread: number;
  luminanceRange: number;
  saturationRange: number;
} {
  const hsls = hexes.map((hex) => rgbToHsl(hexToRgb(hex)));
  const hues = hsls.map((h) => h.h).sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < hues.length; i++) {
    const a = hues[i];
    const b = hues[(i + 1) % hues.length];
    if (a === undefined || b === undefined) continue;
    const next = i === hues.length - 1 ? b + 360 : b;
    maxGap = Math.max(maxGap, next - a);
  }
  const hueSpread = 360 - maxGap;
  const lValues = hsls.map((h) => h.l);
  const sValues = hsls.map((h) => h.s);
  const luminanceRange = Math.max(...lValues) - Math.min(...lValues);
  const saturationRange = Math.max(...sValues) - Math.min(...sValues);
  return { hueSpread, luminanceRange, saturationRange };
}

function toFixedOrEmpty(n: number, digits: number): string {
  return Number.isFinite(n) ? n.toFixed(digits) : "";
}

function toBool01(v: boolean): string {
  return v ? "1" : "0";
}

function hueIsWarm(hue: number): boolean {
  // Warm range includes red wrap-around.
  return hue >= 330 || hue <= 60;
}

function hueIsCold(hue: number): boolean {
  // Cool range: greens -> blues -> purples.
  return hue >= 160 && hue <= 300;
}

function colorTagFromAvg({
  avgL,
  avgS,
  colorFamily,
}: {
  avgL: number;
  avgS: number;
  colorFamily: ColorFamily;
}): ColorTag {
  // Neutrals-first classification.
  if (avgS <= 0.45) {
    if (avgL >= 0.5) return "white";
    if (avgL <= 0.4) return "black";
    return "gray";
  }

  // Map generator families to UI color tags.
  if (colorFamily === "teal") return "turquoise";
  if (colorFamily === "purple") return "violet";
  if (colorFamily === "neutral") return "gray";

  return colorFamily as unknown as ColorTag;
}

const MODES: HarmonyMode[] = [
  "analogous",
  "complementary",
  "triadic",
  "tetradic",
  "monochrome",
];

type ColorFamily =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "brown"
  | "blue"
  | "purple"
  | "pink"
  | "neutral";

type Aesthetic = "classic" | "dark-modern";

type ColorTag =
  | "red"
  | "orange"
  | "brown"
  | "yellow"
  | "green"
  | "turquoise"
  | "blue"
  | "violet"
  | "pink"
  | "white"
  | "gray"
  | "black";

const COLOR_FAMILY_CENTERS: Record<Exclude<ColorFamily, "neutral">, number> = {
  red: 0,
  orange: 30,
  yellow: 60,
  green: 130,
  teal: 175,
  brown: 25,
  blue: 210,
  purple: 270,
  pink: 330,
};

const AESTHETIC_LABELS: Record<Aesthetic, string> = {
  classic: "Velvet",
  "dark-modern": "Nocturne",
};

const FAMILY_ADJECTIVES: Record<Exclude<ColorFamily, "neutral">, string[]> = {
  red: ["Crimson", "Ruby", "Ember", "Scarlet", "Carmine"],
  orange: ["Amber", "Tangerine", "Copper", "Citrus", "Saffron"],
  yellow: ["Solar", "Honey", "Dandelion", "Gild", "Sunbeam"],
  green: ["Verdant", "Moss", "Jade", "Emerald", "Spruce"],
  teal: ["Arctic", "Lagoon", "Seaglass", "Tide", "Aqua"],
  brown: ["Umber", "Sienna", "Cocoa", "Chestnut", "Tobacco"],
  blue: ["Cobalt", "Azure", "Sapphire", "Ocean", "Cerulean"],
  purple: ["Amethyst", "Violet", "Indigo", "Plum", "Orchid"],
  pink: ["Blush", "Magenta", "Fuchsia", "Rose", "Carnation"],
};

const NOUNS = [
  "Palette",
  "Canvas",
  "Drift",
  "Atlas",
  "Suite",
  "Studio",
  "Spectrum",
  "Orbit",
  "Lattice",
  "Bloom",
];

function _clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pickWeighted<A>(
  choices: Array<{ v: A; w: number }>,
  rng: () => number,
) {
  const total = choices.reduce((s, c) => s + c.w, 0);
  const r = rng() * total;
  let acc = 0;
  for (const c of choices) {
    acc += c.w;
    if (r <= acc) return c.v;
  }
  return choices[choices.length - 1]?.v;
}

function sampleHueNearCenter(
  rng: () => number,
  center: number,
  spread: number,
): number {
  const raw = center + (rng() - 0.5) * 2 * spread;
  const h = raw % 360;
  return h < 0 ? h + 360 : h;
}

function familyFromHue(hue: number): ColorFamily {
  // Use closest center; neutral reserved for cases with low saturation.
  const sCenters = Object.entries(COLOR_FAMILY_CENTERS) as Array<
    [Exclude<ColorFamily, "neutral">, number]
  >;
  let best: { family: Exclude<ColorFamily, "neutral">; dist: number } | null =
    null;
  for (const [family, center] of sCenters) {
    const diff = Math.min(Math.abs(hue - center), 360 - Math.abs(hue - center));
    if (!best || diff < best.dist) best = { family, dist: diff };
  }
  return best ? best.family : "neutral";
}

function pickAesthetic(rng: () => number): Aesthetic {
  return pickWeighted(
    [
      // Bias toward modern to align with "more cold colors" preference.
      { v: "classic", w: 1.05 },
      { v: "dark-modern", w: 0.95 },
    ],
    rng,
  );
}

function sampleBaseFor(
  rng: () => number,
  family: Exclude<ColorFamily, "neutral"> | "neutral",
  aesthetic: Aesthetic,
): {
  baseHex: string;
  colorFamily: ColorFamily;
  saturationMul: number;
  lightnessMul: number;
} {
  const isNeutral = family === "neutral";
  const hue = isNeutral
    ? rng() * 360
    : sampleHueNearCenter(rng, COLOR_FAMILY_CENTERS[family], 22);

  const sat = (() => {
    if (aesthetic === "dark-modern")
      return isNeutral ? 0.2 + rng() * 0.25 : 0.65 + rng() * 0.25;
    // classic
    return isNeutral ? 0.15 + rng() * 0.35 : 0.25 + rng() * 0.35;
  })();

  const l = (() => {
    if (aesthetic === "dark-modern")
      return isNeutral ? 0.08 + rng() * 0.2 : 0.05 + rng() * 0.22;
    // classic
    return isNeutral ? 0.28 + rng() * 0.32 : 0.32 + rng() * 0.32;
  })();

  const baseHex = rgbToHex(hslToRgb({ h: hue, s: sat, l }));
  const baseHsl = rgbToHsl(hexToRgb(baseHex));
  const inferredFamily =
    baseHsl.s < 0.22 ? "neutral" : familyFromHue(baseHsl.h);

  // These multipliers are applied on top of the palette generator.
  if (aesthetic === "dark-modern") {
    return {
      baseHex,
      colorFamily: inferredFamily,
      saturationMul: 0.85 + rng() * 0.45, // 0.85..1.3
      lightnessMul: 0.65 + rng() * 0.35, // 0.65..1.0
    };
  }

  return {
    baseHex,
    colorFamily: inferredFamily,
    saturationMul: 0.65 + rng() * 0.35, // 0.65..1.0
    lightnessMul: 0.85 + rng() * 0.35, // 0.85..1.2
  };
}

function makePaletteName({
  rng,
  family,
  aesthetic,
  mode,
}: {
  rng: () => number;
  family: ColorFamily;
  aesthetic: Aesthetic;
  mode: HarmonyMode;
}) {
  const adj = (() => {
    if (family === "neutral")
      return aesthetic === "classic" ? "Gilded" : "Obsidian";
    return pick(FAMILY_ADJECTIVES[family], rng);
  })();
  const mod = AESTHETIC_LABELS[aesthetic] ?? "";
  const noun = pick(NOUNS, rng);
  const maybeMode = mode === "monochrome" ? "Monochrome" : "";
  const core = aesthetic === "classic" ? `${adj} ${mod}` : `${mod} ${adj}`;
  const suffix = maybeMode ? ` ${maybeMode}` : "";
  return `${core} ${noun}${suffix}`.trim();
}

type PaletteCandidate = {
  idx: number;
  name: string;
  colorFamily: ColorFamily;
  aesthetic: Aesthetic;
  baseHex: string;
  mode: HarmonyMode;
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
};

type GradientCandidate = {
  idx: number;
  name: string;
  colorFamily: ColorFamily;
  aesthetic: Aesthetic;
  baseHex: string;
  mode: HarmonyMode;
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
};

function generateBestPalettes({ count, candidates, seed }: Args) {
  const _rng = mulberry32(seed);
  // Bias: more cold colors, and favor the most common "brand-ish" families.
  // (Weights only affect distribution; scoring/constraints still decide "best".)
  const hueFamilyWeights: Array<{
    family: Exclude<ColorFamily, "neutral">;
    weight: number;
  }> = [
    // Cold-heavy, but keep all requested families populated for filters.
    // Total weight = 1.00
    { family: "teal", weight: 0.24 },
    { family: "blue", weight: 0.22 },
    { family: "green", weight: 0.16 },
    { family: "purple", weight: 0.14 },
    { family: "brown", weight: 0.1 },
    { family: "pink", weight: 0.06 },
    { family: "red", weight: 0.03 },
    { family: "orange", weight: 0.03 },
    { family: "yellow", weight: 0.02 },
  ];
  const hueFamilies = hueFamilyWeights.map((x) => x.family);
  const totalWeight = hueFamilyWeights.reduce((s, x) => s + x.weight, 0);
  const usedHue = Math.floor(count * 0.7);
  const minPerFamily = 6;

  const familyAllocations = hueFamilyWeights.map((x) => {
    const desired = Math.max(
      minPerFamily,
      Math.floor((usedHue * x.weight) / totalWeight),
    );
    return { family: x.family, desired };
  });

  let remaining = count - familyAllocations.reduce((s, x) => s + x.desired, 0);

  const seen = new Set<string>();
  const accepted: PaletteCandidate[] = [];

  function paletteAvgL(hexes: string[]) {
    const ls = hexes.map((h) => rgbToHsl(hexToRgb(h)).l);
    return ls.reduce((s, v) => s + v, 0) / Math.max(1, ls.length);
  }

  function paletteAvgS(hexes: string[]) {
    const ss = hexes.map((h) => rgbToHsl(hexToRgb(h)).s);
    return ss.reduce((s, v) => s + v, 0) / Math.max(1, ss.length);
  }

  function generateForFamily(
    family: Exclude<ColorFamily, "neutral">,
    desired: number,
  ): PaletteCandidate[] {
    const out: PaletteCandidate[] = [];
    const localRng = mulberry32(
      seed + family.length * 1000 + family.charCodeAt(0),
    );

    const loopCandidates = Math.max(
      candidates / hueFamilies.length,
      desired * 700,
    );

    let shouldRelax = false;

    for (let i = 0; i < loopCandidates && out.length < desired * 2; i++) {
      if (!shouldRelax && i > loopCandidates * 0.65 && out.length < desired) {
        shouldRelax = true;
      }

      const mode = pick(MODES, localRng);
      const aesthetic = pickAesthetic(localRng);
      const { baseHex, colorFamily, saturationMul, lightnessMul } =
        sampleBaseFor(localRng, family, aesthetic);

      // Ensure we really stay in the family (unless sampled as neutral).
      if (colorFamily !== family && colorFamily !== "neutral") continue;

      const { hexes } = generatePaletteFromBase({
        baseHex,
        mode,
        count: 5,
        saturation: saturationMul,
        lightness: lightnessMul,
      });

      const minTextRatio = minTextContrast(hexes);
      const p25PairContrast = pairwiseContrastQuantile(hexes, 0.25);
      const rgbMinDist = rgbMinDistanceNormalized(hexes);
      const { hueSpread, luminanceRange, saturationRange } = hslRanges(hexes);
      const avgL = paletteAvgL(hexes);
      const avgS = paletteAvgS(hexes);
      const baseHueVal = rgbToHsl(hexToRgb(baseHex)).h;
      const isWarmFamily =
        colorFamily === "red" ||
        colorFamily === "orange" ||
        colorFamily === "yellow" ||
        colorFamily === "pink" ||
        colorFamily === "brown" ||
        (colorFamily === "neutral" && hueIsWarm(baseHueVal));

      const minTextThreshold = shouldRelax ? 3.85 : 4.2;
      const p25Threshold = shouldRelax ? 1.8 : 2.05;
      const rgbMinDistThreshold = shouldRelax ? 0.08 : 0.105;
      const luminanceRangeThreshold = shouldRelax ? 0.11 : 0.15;
      const hueSpreadThreshold = shouldRelax ? 40 : 60;

      if (minTextRatio < minTextThreshold) continue;
      if (p25PairContrast < p25Threshold) continue;
      if (rgbMinDist < rgbMinDistThreshold) continue;
      if (luminanceRange < luminanceRangeThreshold) continue;
      if (mode !== "monochrome" && hueSpread < hueSpreadThreshold) continue;

      // Aesthetic constraints.
      if (aesthetic === "dark-modern" && avgL >= (shouldRelax ? 0.44 : 0.36))
        continue;
      if (aesthetic === "classic" && avgL < (shouldRelax ? 0.26 : 0.34))
        continue;

      const score =
        minTextRatio * 3 +
        p25PairContrast * 1.1 +
        luminanceRange * 4 +
        rgbMinDist * 2 +
        (mode === "monochrome" ? 0 : hueSpread * 0.01) +
        saturationRange * 0.3;

      const key = `${mode}|${aesthetic}|${hexes.slice().sort().join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const name = makePaletteName({
        rng: localRng,
        family: colorFamily,
        aesthetic,
        mode,
      });

      out.push({
        idx: 0,
        name,
        colorFamily,
        aesthetic,
        baseHex,
        mode,
        saturationMul,
        lightnessMul,
        hexes,
        score,
        minTextRatio,
        colorTag: colorTagFromAvg({ avgL, avgS, colorFamily }),
        styleClassic: aesthetic === "classic",
        styleDarkModern: aesthetic === "dark-modern",
        styleWarm: hueIsWarm(baseHueVal),
        styleCold: hueIsCold(baseHueVal),
        styleBright: avgL >= 0.55,
        styleDark: avgL <= 0.42,
        stylePastel: avgL >= 0.47 && avgS <= 0.42,
        styleVintage:
          isWarmFamily &&
          aesthetic === "classic" &&
          avgS >= 0.22 &&
          avgS <= 0.55 &&
          avgL >= 0.25 &&
          avgL <= 0.65,
        styleMonochromatic: mode === "monochrome",
        styleGradient: mode !== "monochrome",
      });
    }

    out.sort((a, b) => b.score - a.score);
    return out.slice(0, desired);
  }

  for (const { family, desired } of familyAllocations) {
    const d = Math.min(desired, count - accepted.length);
    if (d <= 0) continue;
    const rows = generateForFamily(family, d);
    accepted.push(...rows);
  }

  remaining = count - accepted.length;
  if (remaining > 0) {
    const localRng = mulberry32(seed + 999);
    let shouldRelax = false;
    const loopCandidates = Math.max(candidates / 2, remaining * 900);

    for (let i = 0; i < loopCandidates && accepted.length < count; i++) {
      if (!shouldRelax && i > loopCandidates * 0.7 && accepted.length < count) {
        shouldRelax = true;
      }

      const mode = pick(MODES, localRng);
      const aesthetic = pickAesthetic(localRng);
      const family = pickWeighted(
        hueFamilyWeights.map(({ family, weight }) => ({
          v: family,
          w: weight,
        })),
        localRng,
      );

      const { baseHex, colorFamily, saturationMul, lightnessMul } =
        sampleBaseFor(localRng, family, aesthetic);

      if (colorFamily !== family && colorFamily !== "neutral") continue;

      const { hexes } = generatePaletteFromBase({
        baseHex,
        mode,
        count: 5,
        saturation: saturationMul,
        lightness: lightnessMul,
      });

      const minTextRatio = minTextContrast(hexes);
      const p25PairContrast = pairwiseContrastQuantile(hexes, 0.25);
      const rgbMinDist = rgbMinDistanceNormalized(hexes);
      const { hueSpread, luminanceRange, saturationRange } = hslRanges(hexes);
      const avgL = paletteAvgL(hexes);
      const avgS = paletteAvgS(hexes);
      const baseHueVal = rgbToHsl(hexToRgb(baseHex)).h;
      const isWarmFamily =
        colorFamily === "red" ||
        colorFamily === "orange" ||
        colorFamily === "yellow" ||
        colorFamily === "pink" ||
        colorFamily === "brown" ||
        (colorFamily === "neutral" && hueIsWarm(baseHueVal));

      const minTextThreshold = shouldRelax ? 3.8 : 4.1;
      const p25Threshold = shouldRelax ? 1.75 : 2.0;
      const rgbMinDistThreshold = shouldRelax ? 0.08 : 0.105;
      const luminanceRangeThreshold = shouldRelax ? 0.095 : 0.145;
      const hueSpreadThreshold = shouldRelax ? 35 : 60;

      if (minTextRatio < minTextThreshold) continue;
      if (p25PairContrast < p25Threshold) continue;
      if (rgbMinDist < rgbMinDistThreshold) continue;
      if (luminanceRange < luminanceRangeThreshold) continue;
      if (mode !== "monochrome" && hueSpread < hueSpreadThreshold) continue;

      if (aesthetic === "dark-modern" && avgL >= (shouldRelax ? 0.45 : 0.36))
        continue;
      if (aesthetic === "classic" && avgL < (shouldRelax ? 0.25 : 0.34))
        continue;

      const score =
        minTextRatio * 3 +
        p25PairContrast * 1.0 +
        luminanceRange * 4 +
        rgbMinDist * 2 +
        (mode === "monochrome" ? 0 : hueSpread * 0.01) +
        saturationRange * 0.3;

      const key = `${mode}|${aesthetic}|${hexes.slice().sort().join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const name = makePaletteName({
        rng: localRng,
        family: colorFamily,
        aesthetic,
        mode,
      });

      accepted.push({
        idx: 0,
        name,
        colorFamily,
        aesthetic,
        baseHex,
        mode,
        saturationMul,
        lightnessMul,
        hexes,
        score,
        minTextRatio,
        colorTag: colorTagFromAvg({ avgL, avgS, colorFamily }),
        styleClassic: aesthetic === "classic",
        styleDarkModern: aesthetic === "dark-modern",
        styleWarm: hueIsWarm(baseHueVal),
        styleCold: hueIsCold(baseHueVal),
        styleBright: avgL >= 0.55,
        styleDark: avgL <= 0.42,
        stylePastel: avgL >= 0.47 && avgS <= 0.42,
        styleVintage:
          isWarmFamily &&
          aesthetic === "classic" &&
          avgS >= 0.22 &&
          avgS <= 0.55 &&
          avgL >= 0.25 &&
          avgL <= 0.65,
        styleMonochromatic: mode === "monochrome",
        styleGradient: mode !== "monochrome",
      });
    }
  }

  accepted.sort((a, b) => b.score - a.score);
  return accepted.slice(0, count).map((a, i) => ({ ...a, idx: i + 1 }));
}

function generateBestGradients({ count, candidates, seed }: Args) {
  // Bias: more cold colors, and favor the most common "brand-ish" families.
  const hueFamilyWeights: Array<{
    family: Exclude<ColorFamily, "neutral">;
    weight: number;
  }> = [
    // Cold-heavy, but keep all requested families populated for filters.
    // Total weight = 1.00
    { family: "teal", weight: 0.24 },
    { family: "blue", weight: 0.22 },
    { family: "green", weight: 0.16 },
    { family: "purple", weight: 0.14 },
    { family: "brown", weight: 0.1 },
    { family: "pink", weight: 0.06 },
    { family: "red", weight: 0.03 },
    { family: "orange", weight: 0.03 },
    { family: "yellow", weight: 0.02 },
  ];
  const hueFamilies = hueFamilyWeights.map((x) => x.family);
  const totalWeight = hueFamilyWeights.reduce((s, x) => s + x.weight, 0);
  const usedHue = Math.floor(count * 0.7);
  const minPerFamily = 6;

  const familyAllocations = hueFamilyWeights.map((x) => {
    const desired = Math.max(
      minPerFamily,
      Math.floor((usedHue * x.weight) / totalWeight),
    );
    return { family: x.family, desired };
  });

  let remaining = count - familyAllocations.reduce((s, x) => s + x.desired, 0);

  const seen = new Set<string>();
  const accepted: GradientCandidate[] = [];

  function gradientAvgL(stops: string[]) {
    const ls = stops.map((h) => rgbToHsl(hexToRgb(h)).l);
    return ls.reduce((s, v) => s + v, 0) / Math.max(1, ls.length);
  }

  function gradientAvgS(stops: string[]) {
    const ss = stops.map((h) => rgbToHsl(hexToRgb(h)).s);
    return ss.reduce((s, v) => s + v, 0) / Math.max(1, ss.length);
  }

  function generateForFamily(
    family: Exclude<ColorFamily, "neutral">,
    desired: number,
  ) {
    const out: GradientCandidate[] = [];
    const localRng = mulberry32(seed + 777 + family.charCodeAt(0) * 13);
    const loopCandidates = Math.max(
      candidates / hueFamilies.length,
      desired * 700,
    );

    let shouldRelax = false;

    for (let i = 0; i < loopCandidates && out.length < desired * 2; i++) {
      if (!shouldRelax && i > loopCandidates * 0.65 && out.length < desired) {
        shouldRelax = true;
      }

      const mode = pick(MODES, localRng);
      const aesthetic = pickAesthetic(localRng);
      const base = sampleBaseFor(localRng, family, aesthetic);
      if (base.colorFamily !== family && base.colorFamily !== "neutral")
        continue;

      const angle = Math.floor(localRng() * 360);

      const spec = generateGradientFromBase({
        baseHex: base.baseHex,
        mode,
        stopsCount: 5,
        saturationMul: base.saturationMul,
        lightnessMul: base.lightnessMul,
        angle,
      });

      const stops = spec.stops;
      const minTextRatio = minTextContrast(stops);
      const p25PairContrast = pairwiseContrastQuantile(stops, 0.25);
      const rgbMinDist = rgbMinDistanceNormalized(stops);
      const { luminanceRange, saturationRange, hueSpread } = hslRanges(stops);
      const avgL = gradientAvgL(stops);
      const avgS = gradientAvgS(stops);
      const baseHueVal = rgbToHsl(hexToRgb(base.baseHex)).h;
      const isWarmFamily =
        base.colorFamily === "red" ||
        base.colorFamily === "orange" ||
        base.colorFamily === "yellow" ||
        base.colorFamily === "pink" ||
        base.colorFamily === "brown" ||
        (base.colorFamily === "neutral" && hueIsWarm(baseHueVal));

      let adjacentContrastMin = Infinity;
      for (let j = 0; j < stops.length - 1; j++) {
        const s0 = stops[j];
        const s1 = stops[j + 1];
        if (s0 === undefined || s1 === undefined) continue;
        const c = contrastRatio(s0, s1);
        if (c < adjacentContrastMin) adjacentContrastMin = c;
      }
      if (adjacentContrastMin === Infinity) adjacentContrastMin = 0;

      const minTextThreshold = shouldRelax ? 3.7 : 4.0;
      const p25Threshold = shouldRelax ? 1.7 : 1.9;
      const rgbMinDistThreshold = shouldRelax ? 0.08 : 0.095;
      const luminanceRangeThreshold = shouldRelax ? 0.095 : 0.13;
      const adjacentThreshold = shouldRelax ? 1.25 : 1.45;
      const hueSpreadThreshold = shouldRelax ? 35 : 50;

      if (minTextRatio < minTextThreshold) continue;
      if (p25PairContrast < p25Threshold) continue;
      if (rgbMinDist < rgbMinDistThreshold) continue;
      if (luminanceRange < luminanceRangeThreshold) continue;
      if (adjacentContrastMin < adjacentThreshold) continue;
      if (mode !== "monochrome" && hueSpread < hueSpreadThreshold) continue;

      if (aesthetic === "dark-modern" && avgL >= (shouldRelax ? 0.46 : 0.4))
        continue;
      if (aesthetic === "classic" && avgL < (shouldRelax ? 0.26 : 0.32))
        continue;

      const score =
        minTextRatio * 3 +
        p25PairContrast * 1.0 +
        adjacentContrastMin * 0.6 +
        luminanceRange * 2 +
        rgbMinDist * 1.3 +
        saturationRange * 0.25;

      const key = `${mode}|${aesthetic}|${spec.angle}|${stops.slice().sort().join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const name = makePaletteName({
        rng: localRng,
        family: base.colorFamily,
        aesthetic,
        mode,
      });

      out.push({
        idx: 0,
        name,
        colorFamily: base.colorFamily,
        aesthetic,
        baseHex: base.baseHex,
        mode,
        angle: spec.angle,
        saturationMul: base.saturationMul,
        lightnessMul: base.lightnessMul,
        stops,
        score,
        minTextRatio,
        adjacentContrastMin,
        colorTag: colorTagFromAvg({
          avgL,
          avgS,
          colorFamily: base.colorFamily,
        }),
        styleClassic: aesthetic === "classic",
        styleDarkModern: aesthetic === "dark-modern",
        styleWarm: hueIsWarm(baseHueVal),
        styleCold: hueIsCold(baseHueVal),
        styleBright: avgL >= 0.55,
        styleDark: avgL <= 0.42,
        stylePastel: avgL >= 0.47 && avgS <= 0.42,
        styleVintage:
          isWarmFamily &&
          aesthetic === "classic" &&
          avgS >= 0.22 &&
          avgS <= 0.55 &&
          avgL >= 0.25 &&
          avgL <= 0.65,
        styleMonochromatic: mode === "monochrome",
        styleGradient: mode !== "monochrome",
      });
    }

    out.sort((a, b) => b.score - a.score);
    return out.slice(0, desired);
  }

  for (const { family, desired } of familyAllocations) {
    const d = Math.min(desired, count - accepted.length);
    if (d <= 0) continue;
    accepted.push(...generateForFamily(family, d));
  }

  remaining = count - accepted.length;
  if (remaining > 0) {
    const localRng = mulberry32(seed + 888);
    const loopCandidates = Math.max(candidates / 2, remaining * 900);
    let shouldRelax = false;

    for (let i = 0; i < loopCandidates && accepted.length < count; i++) {
      if (!shouldRelax && i > loopCandidates * 0.7 && accepted.length < count) {
        shouldRelax = true;
      }

      const mode = pick(MODES, localRng);
      const aesthetic = pickAesthetic(localRng);
      const family = pickWeighted(
        hueFamilyWeights.map(({ family, weight }) => ({
          v: family,
          w: weight,
        })),
        localRng,
      );
      const base = sampleBaseFor(localRng, family, aesthetic);

      if (base.colorFamily !== family && base.colorFamily !== "neutral")
        continue;

      const angle = Math.floor(localRng() * 360);
      const spec = generateGradientFromBase({
        baseHex: base.baseHex,
        mode,
        stopsCount: 5,
        saturationMul: base.saturationMul,
        lightnessMul: base.lightnessMul,
        angle,
      });

      const stops = spec.stops;
      const minTextRatio = minTextContrast(stops);
      const p25PairContrast = pairwiseContrastQuantile(stops, 0.25);
      const rgbMinDist = rgbMinDistanceNormalized(stops);
      const { luminanceRange, saturationRange, hueSpread } = hslRanges(stops);
      const avgL = gradientAvgL(stops);
      const avgS = gradientAvgS(stops);
      const baseHueVal = rgbToHsl(hexToRgb(base.baseHex)).h;
      const isWarmFamily =
        base.colorFamily === "red" ||
        base.colorFamily === "orange" ||
        base.colorFamily === "yellow" ||
        base.colorFamily === "pink" ||
        base.colorFamily === "brown" ||
        (base.colorFamily === "neutral" && hueIsWarm(baseHueVal));

      let adjacentContrastMin = Infinity;
      for (let j = 0; j < stops.length - 1; j++) {
        const s0 = stops[j];
        const s1 = stops[j + 1];
        if (s0 === undefined || s1 === undefined) continue;
        const c = contrastRatio(s0, s1);
        if (c < adjacentContrastMin) adjacentContrastMin = c;
      }
      if (adjacentContrastMin === Infinity) adjacentContrastMin = 0;

      const minTextThreshold = shouldRelax ? 3.65 : 3.95;
      const p25Threshold = shouldRelax ? 1.65 : 1.9;
      const rgbMinDistThreshold = shouldRelax ? 0.08 : 0.095;
      const luminanceRangeThreshold = shouldRelax ? 0.09 : 0.13;
      const adjacentThreshold = shouldRelax ? 1.2 : 1.42;
      const hueSpreadThreshold = shouldRelax ? 32 : 48;

      if (minTextRatio < minTextThreshold) continue;
      if (p25PairContrast < p25Threshold) continue;
      if (rgbMinDist < rgbMinDistThreshold) continue;
      if (luminanceRange < luminanceRangeThreshold) continue;
      if (adjacentContrastMin < adjacentThreshold) continue;
      if (mode !== "monochrome" && hueSpread < hueSpreadThreshold) continue;

      if (aesthetic === "dark-modern" && avgL >= (shouldRelax ? 0.46 : 0.4))
        continue;
      if (aesthetic === "classic" && avgL < (shouldRelax ? 0.26 : 0.32))
        continue;

      const score =
        minTextRatio * 3 +
        p25PairContrast * 1.0 +
        adjacentContrastMin * 0.6 +
        luminanceRange * 2 +
        rgbMinDist * 1.3 +
        saturationRange * 0.25;

      const key = `${mode}|${aesthetic}|${spec.angle}|${stops.slice().sort().join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const name = makePaletteName({
        rng: localRng,
        family: base.colorFamily,
        aesthetic,
        mode,
      });

      accepted.push({
        idx: 0,
        name,
        colorFamily: base.colorFamily,
        aesthetic,
        baseHex: base.baseHex,
        mode,
        angle: spec.angle,
        saturationMul: base.saturationMul,
        lightnessMul: base.lightnessMul,
        stops,
        score,
        minTextRatio,
        adjacentContrastMin,
        colorTag: colorTagFromAvg({
          avgL,
          avgS,
          colorFamily: base.colorFamily,
        }),
        styleClassic: aesthetic === "classic",
        styleDarkModern: aesthetic === "dark-modern",
        styleWarm: hueIsWarm(baseHueVal),
        styleCold: hueIsCold(baseHueVal),
        styleBright: avgL >= 0.55,
        styleDark: avgL <= 0.42,
        stylePastel: avgL >= 0.47 && avgS <= 0.42,
        styleVintage:
          isWarmFamily &&
          aesthetic === "classic" &&
          avgS >= 0.22 &&
          avgS <= 0.55 &&
          avgL >= 0.25 &&
          avgL <= 0.65,
        styleMonochromatic: mode === "monochrome",
        styleGradient: mode !== "monochrome",
      });
    }
  }

  accepted.sort((a, b) => b.score - a.score);
  return accepted.slice(0, count).map((a, i) => ({ ...a, idx: i + 1 }));
}

function writePalettesCsv(outPath: string, palettes: PaletteCandidate[]) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const header = [
    "idx",
    "name",
    "colorFamily",
    "aesthetic",
    "mode",
    "baseHex",
    "saturationMul",
    "lightnessMul",
    "hex1",
    "hex2",
    "hex3",
    "hex4",
    "hex5",
    "score",
    "minTextRatio",
    "colorTag",
    "styleClassic",
    "styleDarkModern",
    "styleWarm",
    "styleCold",
    "styleBright",
    "styleDark",
    "stylePastel",
    "styleVintage",
    "styleMonochromatic",
    "styleGradient",
  ];

  const lines: string[] = [];
  lines.push(header.join(","));

  for (let i = 0; i < palettes.length; i++) {
    const p = palettes[i];
    if (p === undefined) continue;
    const idx = i + 1;
    const name = p.name;
    lines.push(
      [
        String(idx),
        JSON.stringify(name),
        p.colorFamily,
        p.aesthetic,
        p.mode,
        p.baseHex,
        toFixedOrEmpty(p.saturationMul, 3),
        toFixedOrEmpty(p.lightnessMul, 3),
        p.hexes[0] ?? "",
        p.hexes[1] ?? "",
        p.hexes[2] ?? "",
        p.hexes[3] ?? "",
        p.hexes[4] ?? "",
        toFixedOrEmpty(p.score, 4),
        toFixedOrEmpty(p.minTextRatio, 4),
        p.colorTag,
        toBool01(p.styleClassic),
        toBool01(p.styleDarkModern),
        toBool01(p.styleWarm),
        toBool01(p.styleCold),
        toBool01(p.styleBright),
        toBool01(p.styleDark),
        toBool01(p.stylePastel),
        toBool01(p.styleVintage),
        toBool01(p.styleMonochromatic),
        toBool01(p.styleGradient),
      ].join(","),
    );
  }

  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
}

function writeGradientsCsv(outPath: string, gradients: GradientCandidate[]) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const header = [
    "idx",
    "name",
    "colorFamily",
    "aesthetic",
    "mode",
    "baseHex",
    "angle",
    "saturationMul",
    "lightnessMul",
    "stop1",
    "stop2",
    "stop3",
    "stop4",
    "stop5",
    "score",
    "minTextRatio",
    "adjacentContrastMin",
    "colorTag",
    "styleClassic",
    "styleDarkModern",
    "styleWarm",
    "styleCold",
    "styleBright",
    "styleDark",
    "stylePastel",
    "styleVintage",
    "styleMonochromatic",
    "styleGradient",
  ];

  const lines: string[] = [];
  lines.push(header.join(","));

  for (let i = 0; i < gradients.length; i++) {
    const g = gradients[i];
    if (g === undefined) continue;
    const idx = i + 1;
    const name = g.name;
    lines.push(
      [
        String(idx),
        JSON.stringify(name),
        g.colorFamily,
        g.aesthetic,
        g.mode,
        g.baseHex,
        toFixedOrEmpty(g.angle, 0),
        toFixedOrEmpty(g.saturationMul, 3),
        toFixedOrEmpty(g.lightnessMul, 3),
        g.stops[0] ?? "",
        g.stops[1] ?? "",
        g.stops[2] ?? "",
        g.stops[3] ?? "",
        g.stops[4] ?? "",
        toFixedOrEmpty(g.score, 4),
        toFixedOrEmpty(g.minTextRatio, 4),
        toFixedOrEmpty(g.adjacentContrastMin, 4),
        g.colorTag,
        toBool01(g.styleClassic),
        toBool01(g.styleDarkModern),
        toBool01(g.styleWarm),
        toBool01(g.styleCold),
        toBool01(g.styleBright),
        toBool01(g.styleDark),
        toBool01(g.stylePastel),
        toBool01(g.styleVintage),
        toBool01(g.styleMonochromatic),
        toBool01(g.styleGradient),
      ].join(","),
    );
  }

  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const palettes = generateBestPalettes(args);
  const gradients = generateBestGradients(args);

  const root = path.join(process.cwd());
  const palettesOut = path.join(root, "public", "data", "best-palettes.csv");
  const gradientsOut = path.join(root, "public", "data", "best-gradients.csv");

  writePalettesCsv(palettesOut, palettes);
  writeGradientsCsv(gradientsOut, gradients);

  console.log("Generated:");
  console.log(`- ${palettesOut} (${palettes.length} rows)`);
  console.log(`- ${gradientsOut} (${gradients.length} rows)`);
}

void main();
