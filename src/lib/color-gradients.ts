import {
  generatePaletteFromBase,
  type HarmonyMode,
  hexToRgb,
  hslToRgb,
  normalizeHex,
  rgbToHex,
} from "./color-palette";

export interface GradientStop {
  hex: string;
  locked: boolean;
}

export interface GradientSpec {
  angle: number;
  stops: string[];
}

export interface GradientPreset {
  name: string;
  description: string;
  spec: GradientSpec;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function normalizeAngle(angle: number): number {
  // Normalize to [0, 360)
  const a = angle % 360;
  return a < 0 ? a + 360 : a;
}

export function buildCssLinearGradient(angleDeg: number, stops: string[]) {
  const a = normalizeAngle(angleDeg);
  const n = stops.length;
  if (n === 0) return `linear-gradient(${a}deg, #000 0%, #fff 100%)`;
  if (n === 1)
    return `linear-gradient(${a}deg, ${stops[0]} 0%, ${stops[0]} 100%)`;
  const parts = stops.map((hex, i) => {
    const t = i / (n - 1);
    const pct = Math.round(t * 1000) / 10; // 1 decimal precision
    return `${hex} ${pct}%`;
  });
  return `linear-gradient(${a}deg, ${parts.join(", ")})`;
}

export function cssVariablesForStops(stops: string[], prefix = "--color") {
  return stops.map((hex, i) => `  ${prefix}-${i + 1}: ${hex};`).join("\n");
}

export const PRESET_TRENDING_GRADIENTS: GradientPreset[] = [
  {
    name: "Aurora Breeze",
    description: "Fresh blues + greens with a smooth, modern angle.",
    spec: {
      angle: 125,
      stops: ["#0ea5e9", "#22c55e", "#06b6d4", "#22c55e"],
    },
  },
  {
    name: "Midnight Bloom",
    description: "Deep base with vivid cyan + violet accents.",
    spec: {
      angle: 45,
      stops: ["#0b1020", "#4f46e5", "#06b6d4", "#22c55e", "#f43f5e"],
    },
  },
  {
    name: "Sunlit Umber",
    description: "Warm sandstone highlights and grounded earth tones.",
    spec: {
      angle: 155,
      stops: ["#fef3c7", "#f59e0b", "#d97706", "#a16207", "#7c2d12"],
    },
  },
  {
    name: "Cool Tech Glow",
    description: "A clean tech vibe for dashboards and UI accents.",
    spec: {
      angle: 95,
      stops: ["#0b132b", "#1c2541", "#3a506b", "#5bc0be", "#6fffe9"],
    },
  },
  {
    name: "Rose Orchard",
    description: "High-contrast pink and rose steps for bold visuals.",
    spec: {
      angle: 70,
      stops: ["#ffe4e6", "#fb7185", "#f43f5e", "#be185d", "#9f1239"],
    },
  },
  {
    name: "Graphite & Mint",
    description: "Dark neutral with mint highlights for elegant UI.",
    spec: {
      angle: 120,
      stops: ["#111827", "#10b981", "#34d399", "#a7f3d0", "#f9fafb"],
    },
  },
  {
    name: "Cobalt Sunset",
    description: "Blue foundation with energetic warm pops.",
    spec: {
      angle: 140,
      stops: ["#1d4ed8", "#2563eb", "#60a5fa", "#f97316", "#fb7185"],
    },
  },
];

export function generateGradientFromBase(opts: {
  baseHex: string;
  mode: HarmonyMode;
  stopsCount: number;
  saturationMul: number;
  lightnessMul: number;
  angle: number;
}): GradientSpec {
  const baseNorm = normalizeHex(opts.baseHex) ?? "#0ea5e9";
  const { hexes } = generatePaletteFromBase({
    baseHex: baseNorm,
    mode: opts.mode,
    count: opts.stopsCount,
    saturation: opts.saturationMul,
    lightness: opts.lightnessMul,
  });
  return {
    angle: normalizeAngle(opts.angle),
    stops: hexes,
  };
}
