export type HarmonyMode =
  | "analogous"
  | "complementary"
  | "triadic"
  | "tetradic"
  | "monochrome";

export interface GeneratedPalette {
  hexes: string[];
}

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function normalizeHex(input: string): string | null {
  const s = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$/.test(s) && !/^[0-9a-fA-F]{6}$/.test(s)) {
    return null;
  }

  if (s.length === 3) {
    const r = s[0]!;
    const g = s[1]!;
    const b = s[2]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return `#${s}`.toLowerCase();
}

export function hexToRgb(hex: string): RGB {
  const s = normalizeHex(hex);
  if (!s) return { r: 0, g: 0, b: 0 };
  const raw = s.slice(1);
  const r = Number.parseInt(raw.slice(0, 2)!, 16);
  const g = Number.parseInt(raw.slice(2, 4)!, 16);
  const b = Number.parseInt(raw.slice(4, 6)!, 16);
  return { r, g, b };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toLowerCase();
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      case bn:
        h = (rn - gn) / delta + 4;
        break;
    }

    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const x = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;

  let rn = 0;
  let gn = 0;
  let bn = 0;

  const hNorm = ((h % 360) + 360) % 360;
  if (hNorm < 60) {
    rn = C;
    gn = x;
    bn = 0;
  } else if (hNorm < 120) {
    rn = x;
    gn = C;
    bn = 0;
  } else if (hNorm < 180) {
    rn = 0;
    gn = C;
    bn = x;
  } else if (hNorm < 240) {
    rn = 0;
    gn = x;
    bn = C;
  } else if (hNorm < 300) {
    rn = x;
    gn = 0;
    bn = C;
  } else {
    rn = C;
    gn = 0;
    bn = x;
  }

  return {
    r: (rn + m) * 255,
    g: (gn + m) * 255,
    b: (bn + m) * 255,
  };
}

export function relativeLuminance({ r, g, b }: RGB): number {
  // WCAG 2.x: convert sRGB to linear, then compute luminance.
  const toLinear = (v255: number) => {
    const v = v255 / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(aHex: string, bHex: string): number {
  const a = relativeLuminance(hexToRgb(aHex));
  const b = relativeLuminance(hexToRgb(bHex));
  const L1 = Math.max(a, b);
  const L2 = Math.min(a, b);
  return (L1 + 0.05) / (L2 + 0.05);
}

export function bestTextColorOn(
  bgHex: string,
): { textHex: "#000000" | "#ffffff"; ratio: number } {
  const blackRatio = contrastRatio(bgHex, "#000000");
  const whiteRatio = contrastRatio(bgHex, "#ffffff");
  if (whiteRatio >= blackRatio) {
    return { textHex: "#ffffff", ratio: whiteRatio };
  }
  return { textHex: "#000000", ratio: blackRatio };
}

export function wcagContrastBadge(ratio: number): "AAA" | "AA" | "Low" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Low";
}

function offsetsForMode(mode: HarmonyMode, count: number): number[] {
  if (count <= 1) return [0]!;

  const evenly = (a: number, b: number) => {
    const steps = count - 1;
    if (steps <= 0) return [a]!;
    return Array.from({ length: count }, (_, i) => a + ((b - a) * i) / steps);
  };

  switch (mode) {
    case "analogous":
      // Spread across +/- 60 degrees by default.
      return evenly(-60, 60);
    case "complementary":
      // Mix base + complement; for more colors, continue to spread around both.
      if (count === 2) return [0, 180];
      if (count === 3) return [0, 180, 90];
      // Create a smooth sweep across [0..180] and mirror.
      return evenly(0, 180).map((v, i) => (i % 2 === 0 ? v : 180 - v));
    case "triadic":
      if (count === 3) return [0, 120, 240];
      return Array.from({ length: count }, (_, i) => (i * (360 / Math.max(3, count))) % 360).map((v) => v - 60);
    case "tetradic":
      if (count === 4) return [0, 90, 180, 270];
      return Array.from({ length: count }, (_, i) => (i * (360 / Math.max(4, count))) % 360).map((v) => v - 45);
    case "monochrome":
      // For monochrome we vary lightness more than hue; offsets apply to hue only slightly.
      return evenly(-10, 10);
    default:
      return evenly(0, 0);
  }
}

export function generatePaletteFromBase(opts: {
  baseHex: string;
  mode: HarmonyMode;
  count: number;
  saturation?: number; // 0..1 multiplier
  lightness?: number; // 0..1 multiplier
}): GeneratedPalette {
  const baseNorm = normalizeHex(opts.baseHex);
  const baseRgb = baseNorm ? hexToRgb(baseNorm) : { r: 0, g: 0, b: 0 };
  const baseHsl = rgbToHsl(baseRgb);

  const count = clamp(opts.count, 3, 10);
  const satMul = opts.saturation ?? 1;
  const lightMul = opts.lightness ?? 1;

  const hueOffsets = offsetsForMode(opts.mode, count);

  // Spread lightness across the palette so it doesn’t end up too flat.
  // Keep the center around the base lightness.
  const lCenter = baseHsl.l;
  const lSpread = opts.mode === "monochrome" ? 0.22 : 0.16;

  const lightnessSteps = Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);
    return clamp(lCenter + (t - 0.5) * lSpread * 2, 0.08, 0.92) * lightMul;
  });

  const hexes = Array.from({ length: count }, (_, i) => {
    const h = (baseHsl.h + hueOffsets[i]!) % 360;
    const s = clamp(baseHsl.s * satMul, 0.25, 1);
    const l = clamp(lightnessSteps[i]!, 0, 1);
    return rgbToHex(hslToRgb({ h, s, l }));
  });

  return { hexes };
}

export const PRESET_TRENDING_PALETTES: Array<{
  name: string;
  hexes: string[];
  description: string;
}> = [
    {
      name: "Aurora Citrus",
      hexes: ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"],
      description: "Bright blues, fresh greens, and warm highlights.",
    },
    {
      name: "Midnight Bloom",
      hexes: ["#111827", "#4f46e5", "#06b6d4", "#22c55e", "#f43f5e"],
      description: "Deep base with vivid accent contrast.",
    },
    {
      name: "Sandstone Studio",
      hexes: ["#fef3c7", "#f59e0b", "#d97706", "#a16207", "#7c2d12"],
      description: "Soft golds and grounded earth tones.",
    },
    {
      name: "Cool Tech",
      hexes: ["#0b132b", "#1c2541", "#3a506b", "#5bc0be", "#6fffe9"],
      description: "A clean tech gradient feel for UI accents.",
    },
    {
      name: "Rose Orchard",
      hexes: ["#ffe4e6", "#fb7185", "#f43f5e", "#be185d", "#9f1239"],
      description: "Pink spectrum with strong contrast steps.",
    },
    {
      name: "Graphite & Mint",
      hexes: ["#111827", "#10b981", "#34d399", "#a7f3d0", "#f9fafb"],
      description: "Dark neutral with mint highlights.",
    },
    {
      name: "Cobalt Sunset",
      hexes: ["#1d4ed8", "#2563eb", "#60a5fa", "#f97316", "#fb7185"],
      description: "Blue foundation with energetic warm pops.",
    },
    {
      name: "Violet Arcade",
      hexes: ["#312e81", "#4338ca", "#6366f1", "#a78bfa", "#f472b6"],
      description: "Retro violet palette for creative projects.",
    },
    {
      name: "Forest Ember",
      hexes: ["#14532d", "#15803d", "#22c55e", "#f59e0b", "#f43f5e"],
      description: "Green base with ember-like highlights.",
    },
    {
      name: "Ice Cream UI",
      hexes: ["#f8fafc", "#bae6fd", "#60a5fa", "#34d399", "#fbbf24"],
      description: "Light UI-friendly swatches.",
    },
  ];
