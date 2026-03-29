import type { HarmonyMode } from "@/lib/color-palette";

export type ColorTag =
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
    | "teal"
    | "brown"
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
    | "teal"
    | "brown"
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
