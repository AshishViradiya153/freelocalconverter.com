import { clamp } from "@/lib/clamp";
import { normalizeAngle } from "@/lib/color-gradients";
import { bestTextColorOn, normalizeHex } from "@/lib/color-palette";

export type BannerFormatId = "profileCover" | "companyStrip" | "shareLandscape";

export const LINKEDIN_BANNER_FORMAT_ORDER: BannerFormatId[] = [
  "profileCover",
  "companyStrip",
  "shareLandscape",
];

export const LINKEDIN_BANNER_FORMATS: Record<
  BannerFormatId,
  {
    id: BannerFormatId;
    width: number;
    height: number;
    label: string;
    hint: string;
  }
> = {
  profileCover: {
    id: "profileCover",
    width: 1584,
    height: 396,
    label: "Profile cover",
    hint: "1584×396, LinkedIn profile and page background",
  },
  companyStrip: {
    id: "companyStrip",
    width: 1128,
    height: 191,
    label: "Company header",
    hint: "1128×191, narrow header strip",
  },
  shareLandscape: {
    id: "shareLandscape",
    width: 1200,
    height: 627,
    label: "Link preview",
    hint: "1200×627, article and link-style image",
  },
};

export type BannerTemplateId =
  | "hero"
  | "split"
  | "minimal"
  | "editorial"
  | "diagonalSlash"
  | "spotlight"
  | "ledger"
  | "frame"
  | "orbit"
  | "brutalist";

export const LINKEDIN_BANNER_TEMPLATE_GROUPS: {
  label: string;
  ids: BannerTemplateId[];
}[] = [
  {
    label: "Classic",
    ids: ["editorial", "frame", "ledger", "split"],
  },
  {
    label: "Modern",
    ids: ["hero", "diagonalSlash", "spotlight", "orbit", "brutalist"],
  },
  { label: "Minimal", ids: ["minimal"] },
];

export const LINKEDIN_BANNER_TEMPLATE_ORDER: BannerTemplateId[] =
  LINKEDIN_BANNER_TEMPLATE_GROUPS.flatMap((g) => g.ids);

export const LINKEDIN_BANNER_TEMPLATE_LABELS: Record<BannerTemplateId, string> =
  {
    hero: "Hero",
    split: "Split panel",
    minimal: "Quiet minimal",
    editorial: "Editorial column",
    diagonalSlash: "Diagonal slice",
    spotlight: "Spotlight",
    ledger: "Ledger lines",
    frame: "Double frame",
    orbit: "Orbit arcs",
    brutalist: "Brutalist bar",
  };

/** Curated two-stop gradients (colorA → colorB at angleDeg). Renderer uses colorA, colorB, angleDeg from state. */
export const LINKEDIN_BANNER_GRADIENT_PRESETS = [
  {
    id: "indigoViolet",
    label: "Indigo violet",
    colorA: "#1d4ed8",
    colorB: "#7c3aed",
    angleDeg: 118,
  },
  {
    id: "ocean",
    label: "Ocean",
    colorA: "#0369a1",
    colorB: "#22d3ee",
    angleDeg: 135,
  },
  {
    id: "sunset",
    label: "Sunset",
    colorA: "#f97316",
    colorB: "#db2777",
    angleDeg: 45,
  },
  {
    id: "forest",
    label: "Forest",
    colorA: "#14532d",
    colorB: "#4ade80",
    angleDeg: 160,
  },
  {
    id: "roseDusk",
    label: "Rose dusk",
    colorA: "#be185d",
    colorB: "#7c3aed",
    angleDeg: 125,
  },
  {
    id: "slateMist",
    label: "Slate mist",
    colorA: "#1e293b",
    colorB: "#64748b",
    angleDeg: 180,
  },
  {
    id: "peachGlow",
    label: "Peach glow",
    colorA: "#fb923c",
    colorB: "#fde68a",
    angleDeg: 90,
  },
  {
    id: "mintIce",
    label: "Mint ice",
    colorA: "#0d9488",
    colorB: "#a5f3fc",
    angleDeg: 110,
  },
  {
    id: "lavenderNight",
    label: "Lavender night",
    colorA: "#312e81",
    colorB: "#c084fc",
    angleDeg: 140,
  },
  {
    id: "ember",
    label: "Ember",
    colorA: "#7f1d1d",
    colorB: "#fbbf24",
    angleDeg: 35,
  },
  {
    id: "arctic",
    label: "Arctic",
    colorA: "#1e3a8a",
    colorB: "#e0f2fe",
    angleDeg: 165,
  },
  {
    id: "charcoalGold",
    label: "Charcoal gold",
    colorA: "#171717",
    colorB: "#ca8a04",
    angleDeg: 55,
  },
] as const;

export type BannerGradientPresetId =
  | (typeof LINKEDIN_BANNER_GRADIENT_PRESETS)[number]["id"]
  | "custom";

export function findLinkedInBannerGradientPreset(
  id: BannerGradientPresetId,
): (typeof LINKEDIN_BANNER_GRADIENT_PRESETS)[number] | null {
  if (id === "custom") return null;
  return LINKEDIN_BANNER_GRADIENT_PRESETS.find((p) => p.id === id) ?? null;
}

export type BannerFontFamilyId =
  | "systemSans"
  | "systemSerif"
  | "systemMono"
  | "georgia"
  | "trebuchet";

export const LINKEDIN_BANNER_FONT_FAMILY_ORDER: BannerFontFamilyId[] = [
  "systemSans",
  "systemSerif",
  "systemMono",
  "georgia",
  "trebuchet",
];

export const LINKEDIN_BANNER_FONT_FAMILY_LABELS: Record<
  BannerFontFamilyId,
  string
> = {
  systemSans: "Sans (system)",
  systemSerif: "Serif (system)",
  systemMono: "Monospace",
  georgia: "Georgia",
  trebuchet: "Trebuchet MS",
};

const FONT_STACKS: Record<BannerFontFamilyId, string> = {
  systemSans:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  systemSerif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  systemMono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  georgia: 'Georgia, "Times New Roman", Times, serif',
  trebuchet: '"Trebuchet MS", "Lucida Grande", Arial, sans-serif',
};

export interface BannerTextFontStyle {
  /** Percent of the layout’s computed base size (100 = default). */
  sizePercent: number;
  weight: 400 | 500 | 600 | 700 | 800;
  letterSpacingPx: number;
  familyId: BannerFontFamilyId;
}

export const DEFAULT_TAG_FONT: BannerTextFontStyle = {
  sizePercent: 100,
  weight: 600,
  letterSpacingPx: 0,
  familyId: "systemSans",
};

export const DEFAULT_HEADLINE_FONT: BannerTextFontStyle = {
  sizePercent: 100,
  weight: 700,
  letterSpacingPx: 0,
  familyId: "systemSans",
};

export const DEFAULT_SUB_FONT: BannerTextFontStyle = {
  sizePercent: 100,
  weight: 500,
  letterSpacingPx: 0,
  familyId: "systemSans",
};

function canvasFontString(
  weight: number,
  sizePx: number,
  familyId: BannerFontFamilyId,
): string {
  return `${weight} ${sizePx}px ${FONT_STACKS[familyId]}`;
}

function applyLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  const rounded = Math.round(px * 10) / 10;
  if (rounded === 0) return;
  if ("letterSpacing" in ctx) {
    (
      ctx as CanvasRenderingContext2D & { letterSpacing: string }
    ).letterSpacing = `${rounded}px`;
  }
}

function normalizedFontStyle(raw: BannerTextFontStyle): BannerTextFontStyle {
  return {
    sizePercent: clamp(raw.sizePercent, 50, 200),
    weight: raw.weight,
    letterSpacingPx: clamp(raw.letterSpacingPx, -2, 12),
    familyId: raw.familyId,
  };
}

/** Per-template layout tuning; values are clamped when rendering. */
export interface BannerTemplateTweaks {
  splitLeftPercent: number;
  editorialBarScale: number;
  diagonalTipPercent: number;
  diagonalShade: number;
  diagonalColumnStartPercent: number;
  spotlightInnerPercent: number;
  spotlightMid: number;
  spotlightEdge: number;
  ledgerRowDivisor: number;
  ledgerMarginPercent: number;
  frameInsetScale: number;
  orbitRadiusScale: number;
  orbitStrokeOpacity: number;
  orbitColumnPercent: number;
  brutalistBarPercent: number;
  centerTextWidthPercent: number;
}

export type BannerTemplateTweakKey = keyof BannerTemplateTweaks;

export const DEFAULT_BANNER_TEMPLATE_TWEAKS: BannerTemplateTweaks = {
  splitLeftPercent: 38,
  editorialBarScale: 1,
  diagonalTipPercent: 56,
  diagonalShade: 0.26,
  diagonalColumnStartPercent: 41,
  spotlightInnerPercent: 6,
  spotlightMid: 0.18,
  spotlightEdge: 0.55,
  ledgerRowDivisor: 7,
  ledgerMarginPercent: 7,
  frameInsetScale: 1,
  orbitRadiusScale: 1,
  orbitStrokeOpacity: 0.24,
  orbitColumnPercent: 36,
  brutalistBarPercent: 14,
  centerTextWidthPercent: 72,
};

export function normalizedTemplateTweaks(
  partial?: Partial<BannerTemplateTweaks>,
): BannerTemplateTweaks {
  const d = { ...DEFAULT_BANNER_TEMPLATE_TWEAKS, ...partial };
  return {
    splitLeftPercent: clamp(d.splitLeftPercent, 30, 48),
    editorialBarScale: clamp(d.editorialBarScale, 0.65, 1.85),
    diagonalTipPercent: clamp(d.diagonalTipPercent, 44, 64),
    diagonalShade: clamp(d.diagonalShade, 0.12, 0.42),
    diagonalColumnStartPercent: clamp(d.diagonalColumnStartPercent, 34, 54),
    spotlightInnerPercent: clamp(d.spotlightInnerPercent, 3, 14),
    spotlightMid: clamp(d.spotlightMid, 0.08, 0.34),
    spotlightEdge: clamp(d.spotlightEdge, 0.35, 0.78),
    ledgerRowDivisor: clamp(d.ledgerRowDivisor, 5, 11),
    ledgerMarginPercent: clamp(d.ledgerMarginPercent, 5, 11),
    frameInsetScale: clamp(d.frameInsetScale, 0.72, 1.38),
    orbitRadiusScale: clamp(d.orbitRadiusScale, 0.82, 1.18),
    orbitStrokeOpacity: clamp(d.orbitStrokeOpacity, 0.12, 0.42),
    orbitColumnPercent: clamp(d.orbitColumnPercent, 30, 42),
    brutalistBarPercent: clamp(d.brutalistBarPercent, 10, 22),
    centerTextWidthPercent: clamp(d.centerTextWidthPercent, 58, 82),
  };
}

export interface BannerDesignInput {
  templateId: BannerTemplateId;
  headline: string;
  subheadline: string;
  tag: string;
  tagFont: BannerTextFontStyle;
  headlineFont: BannerTextFontStyle;
  subheadlineFont: BannerTextFontStyle;
  colorA: string;
  colorB: string;
  solidColor: string;
  backgroundMode: "gradient" | "solid";
  angleDeg: number;
  textColorMode: "auto" | "custom";
  customTextColor: string;
  showGrid: boolean;
  noiseOpacity: number;
  templateTweaks: BannerTemplateTweaks;
}

function hexOrFallback(hex: string, fallback: string) {
  return normalizeHex(hex) ?? fallback;
}

function createLinearGradientForAngle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  angleDeg: number,
  c0: string,
  c1: string,
): CanvasGradient {
  const a = normalizeAngle(angleDeg);
  const rad = ((a - 90) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.hypot(w, h);
  const dx = Math.cos(rad) * len * 0.5;
  const dy = Math.sin(rad) * len * 0.5;
  const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

function drawNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opacity: number,
) {
  if (opacity <= 0) return;
  const count = Math.min(120_000, Math.floor((w * h) / 900));
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const v = Math.floor(Math.random() * 55);
    ctx.fillStyle = `rgba(${v},${v},${v},${opacity * (0.2 + Math.random() * 0.5)})`;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  const step = Math.max(28, Math.floor(Math.min(w, h) / 14));
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function resolveTextColor(
  sampleBg: string,
  mode: "auto" | "custom",
  custom: string,
): string {
  if (mode === "custom") {
    return hexOrFallback(custom, "#ffffff");
  }
  return bestTextColorOn(hexOrFallback(sampleBg, "#1a1a2e")).textHex;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const t = text.trim();
  if (!t) return [];
  const words = t.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [t];
}

function canvasImageSourceSize(source: CanvasImageSource): {
  w: number;
  h: number;
} {
  if (source instanceof HTMLImageElement) {
    const w = source.naturalWidth || source.width;
    const h = source.naturalHeight || source.height;
    return { w: w || 256, h: h || 256 };
  }
  if (source instanceof HTMLVideoElement) {
    return {
      w: source.videoWidth || 256,
      h: source.videoHeight || 256,
    };
  }
  if (source instanceof ImageBitmap) {
    return { w: source.width, h: source.height };
  }
  if (source instanceof HTMLCanvasElement) {
    return { w: source.width, h: source.height };
  }
  if (
    typeof OffscreenCanvas !== "undefined" &&
    source instanceof OffscreenCanvas
  ) {
    return { w: source.width, h: source.height };
  }
  return { w: 256, h: 256 };
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: CanvasImageSource,
  box: { x: number; y: number; maxW: number; maxH: number },
) {
  const { w: nw, h: nh } = canvasImageSourceSize(logo);
  const scale = Math.min(box.maxW / nw, box.maxH / nh, 1);
  const dw = nw * scale;
  const dh = nh * scale;
  const x = box.x + box.maxW - dw;
  const y = box.y + (box.maxH - dh) / 2;
  ctx.drawImage(logo, x, y, dw, dh);
}

function drawTemplateDecorations(
  ctx: CanvasRenderingContext2D,
  templateId: BannerTemplateId,
  w: number,
  h: number,
  padX: number,
  cB: string,
  tw: BannerTemplateTweaks,
): void {
  switch (templateId) {
    case "split":
    case "hero":
    case "minimal":
      return;
    case "editorial": {
      const barW = Math.max(4, Math.floor(w * 0.011 * tw.editorialBarScale));
      ctx.fillStyle = hexOrFallback(cB, "#5b21b6");
      ctx.fillRect(padX, 0, barW, h);
      break;
    }
    case "diagonalSlash": {
      ctx.fillStyle = `rgba(15, 23, 42, ${tw.diagonalShade})`;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(Math.floor((w * tw.diagonalTipPercent) / 100), 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "spotlight": {
      const cx = w * 0.3;
      const cy = h * 0.5;
      const r = Math.hypot(w, h) * 0.95;
      const innerR = (Math.min(w, h) * tw.spotlightInnerPercent) / 100;
      const g = ctx.createRadialGradient(cx, cy, innerR, cx, cy, r);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.48, `rgba(0,0,0,${tw.spotlightMid})`);
      g.addColorStop(1, `rgba(0,0,0,${tw.spotlightEdge})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "ledger": {
      ctx.strokeStyle = "rgba(15, 23, 42, 0.09)";
      ctx.lineWidth = 1;
      const step = Math.max(18, Math.floor(h / tw.ledgerRowDivisor));
      for (let yy = step; yy < h; yy += step) {
        ctx.beginPath();
        ctx.moveTo(0, yy + 0.5);
        ctx.lineTo(w, yy + 0.5);
        ctx.stroke();
      }
      const marginX = Math.floor((w * tw.ledgerMarginPercent) / 100);
      ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
      ctx.beginPath();
      ctx.moveTo(marginX + 0.5, 0);
      ctx.lineTo(marginX + 0.5, h);
      ctx.stroke();
      break;
    }
    case "frame": {
      const inset = Math.max(
        8,
        Math.floor(Math.min(w, h) * 0.042 * tw.frameInsetScale),
      );
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.24)";
      ctx.lineWidth = 1;
      const inset2 = inset + 6;
      ctx.strokeRect(inset2, inset2, w - inset2 * 2, h - inset2 * 2);
      break;
    }
    case "orbit": {
      const rs = tw.orbitRadiusScale;
      const o = tw.orbitStrokeOpacity;
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${o})`;
      ctx.lineWidth = Math.max(2, Math.floor(h * 0.016));
      ctx.beginPath();
      ctx.arc(
        w * 0.76,
        h * 0.52,
        h * 0.62 * rs,
        -Math.PI * 0.42,
        Math.PI * 0.5,
      );
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${o * 0.55})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w * 0.8, h * 0.48, h * 0.4 * rs, Math.PI * 0.12, Math.PI * 1.02);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "brutalist": {
      const bh = Math.floor((h * tw.brutalistBarPercent) / 100);
      ctx.fillStyle = hexOrFallback(cB, "#171717");
      ctx.fillRect(0, h - bh, w, bh);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, h - bh, w, Math.max(2, Math.floor(h * 0.014)));
      break;
    }
    default:
      break;
  }
}

/**
 * Renders a LinkedIn-oriented banner to a new canvas at the requested pixel size.
 */
export function renderLinkedInBannerCanvas(args: {
  width: number;
  height: number;
  design: BannerDesignInput;
  logo: CanvasImageSource | null;
}): HTMLCanvasElement {
  const { width: w, height: h, design: d, logo } = args;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const tw = normalizedTemplateTweaks(d.templateTweaks);

  const cA = hexOrFallback(d.colorA, "#2563eb");
  const cB = hexOrFallback(d.colorB, "#7c3aed");
  const solid = hexOrFallback(d.solidColor, "#0f172a");

  const padX = Math.max(16, Math.floor(w * 0.045));
  const padY = Math.max(12, Math.floor(h * 0.08));

  if (d.templateId === "split") {
    const splitAt = Math.floor((w * tw.splitLeftPercent) / 100);
    ctx.fillStyle = cA;
    ctx.fillRect(0, 0, splitAt, h);
    if (d.backgroundMode === "solid") {
      ctx.fillStyle = solid;
      ctx.fillRect(splitAt, 0, w - splitAt, h);
    } else {
      ctx.fillStyle = createLinearGradientForAngle(
        ctx,
        w - splitAt,
        h,
        d.angleDeg,
        cA,
        cB,
      );
      ctx.fillRect(splitAt, 0, w - splitAt, h);
    }
  } else {
    if (d.backgroundMode === "solid") {
      ctx.fillStyle = solid;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = createLinearGradientForAngle(
        ctx,
        w,
        h,
        d.angleDeg,
        cA,
        cB,
      );
      ctx.fillRect(0, 0, w, h);
    }
  }

  if (d.showGrid) drawGrid(ctx, w, h);
  drawNoise(ctx, w, h, d.noiseOpacity);

  if (d.templateId !== "split") {
    drawTemplateDecorations(ctx, d.templateId, w, h, padX, cB, tw);
  }

  const sampleForText =
    d.templateId === "split" ? cA : d.backgroundMode === "solid" ? solid : cA;
  const primary = resolveTextColor(
    sampleForText,
    d.textColorMode,
    d.customTextColor,
  );
  const secondary =
    d.textColorMode === "custom"
      ? hexOrFallback(d.customTextColor, "#ffffff")
      : primary === "#ffffff"
        ? "rgba(255,255,255,0.82)"
        : "rgba(0,0,0,0.72)";

  const tf = normalizedFontStyle(d.tagFont);
  const hf = normalizedFontStyle(d.headlineFont);
  const sf = normalizedFontStyle(d.subheadlineFont);

  const baseTitle = Math.max(14, Math.floor(h * (h < 240 ? 0.2 : 0.14)));
  const titleSize = Math.max(
    10,
    Math.round(baseTitle * (hf.sizePercent / 100)),
  );
  const subBase = Math.max(11, Math.floor(baseTitle * 0.48));
  const subSize = Math.max(9, Math.round(subBase * (sf.sizePercent / 100)));
  const tagBase = Math.max(10, Math.floor(subBase * 0.92));
  const tagSize = Math.max(8, Math.round(tagBase * (tf.sizePercent / 100)));

  function drawHeroStyle(
    textX: number,
    maxW: number,
    logoBox: { maxW: number; maxH: number },
  ) {
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let y = padY;

    if (d.tag.trim()) {
      ctx.save();
      applyLetterSpacing(ctx, tf.letterSpacingPx);
      ctx.fillStyle = secondary;
      ctx.font = canvasFontString(tf.weight, tagSize, tf.familyId);
      ctx.fillText(d.tag.trim().toUpperCase(), textX, y);
      ctx.restore();
      y += tagSize * 1.75;
    }

    ctx.save();
    applyLetterSpacing(ctx, hf.letterSpacingPx);
    ctx.fillStyle = primary;
    ctx.font = canvasFontString(hf.weight, titleSize, hf.familyId);
    for (const line of wrapLines(ctx, d.headline || "Your headline", maxW)) {
      ctx.fillText(line, textX, y);
      y += titleSize * 1.12;
    }
    ctx.restore();

    if (d.subheadline.trim()) {
      ctx.save();
      applyLetterSpacing(ctx, sf.letterSpacingPx);
      y += subSize * 0.4;
      ctx.fillStyle = secondary;
      ctx.font = canvasFontString(sf.weight, subSize, sf.familyId);
      for (const line of wrapLines(ctx, d.subheadline, maxW)) {
        ctx.fillText(line, textX, y);
        y += subSize * 1.2;
      }
      ctx.restore();
    }

    if (logo) {
      drawLogo(ctx, logo, {
        x: w - padX - logoBox.maxW,
        y: padY,
        maxW: logoBox.maxW,
        maxH: logoBox.maxH,
      });
    }
  }

  switch (d.templateId) {
    case "minimal": {
      const textBlockW = Math.floor((w * tw.centerTextWidthPercent) / 100);
      const cx = w / 2;
      let y = h / 2 - titleSize * 0.35;

      if (d.tag.trim()) {
        ctx.save();
        applyLetterSpacing(ctx, tf.letterSpacingPx);
        ctx.fillStyle = secondary;
        ctx.font = canvasFontString(tf.weight, tagSize, tf.familyId);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(d.tag.trim().toUpperCase(), cx, y - titleSize * 0.95);
        ctx.restore();
      }

      ctx.save();
      applyLetterSpacing(ctx, hf.letterSpacingPx);
      ctx.fillStyle = primary;
      ctx.font = canvasFontString(hf.weight, titleSize, hf.familyId);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const titleLines = wrapLines(
        ctx,
        d.headline || "Your headline",
        textBlockW,
      );
      const lh = titleSize * 1.18;
      y += d.tag.trim() ? titleSize * 0.35 : -titleSize * 0.5;
      for (const line of titleLines) {
        ctx.fillText(line, cx, y);
        y += lh;
      }
      ctx.restore();

      if (d.subheadline.trim()) {
        ctx.save();
        applyLetterSpacing(ctx, sf.letterSpacingPx);
        ctx.fillStyle = secondary;
        ctx.font = canvasFontString(sf.weight, subSize, sf.familyId);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const subLines = wrapLines(ctx, d.subheadline, textBlockW);
        y += subSize * 0.35;
        for (const line of subLines) {
          ctx.fillText(line, cx, y);
          y += subSize * 1.2;
        }
        ctx.restore();
      }

      if (logo) {
        const maxH = h * 0.2;
        const maxW = w * 0.18;
        drawLogo(ctx, logo, {
          x: w - padX - maxW,
          y: h - padY - maxH,
          maxW,
          maxH,
        });
      }
      break;
    }
    case "split": {
      const leftW = Math.floor((w * tw.splitLeftPercent) / 100);
      const textColorLeft = resolveTextColor(
        cA,
        d.textColorMode,
        d.customTextColor,
      );
      const textColorRight = resolveTextColor(
        d.backgroundMode === "solid" ? solid : cB,
        d.textColorMode,
        d.customTextColor,
      );

      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const leftMax = leftW - padX * 2;
      let y = padY;
      if (d.tag.trim()) {
        ctx.save();
        applyLetterSpacing(ctx, tf.letterSpacingPx);
        ctx.fillStyle = textColorLeft;
        ctx.font = canvasFontString(tf.weight, tagSize, tf.familyId);
        ctx.fillText(d.tag.trim().toUpperCase(), padX, y);
        ctx.restore();
        y += tagSize * 1.65;
      }
      const headSize = Math.max(
        10,
        Math.min(titleSize, Math.floor(leftMax / 11)),
      );
      ctx.save();
      applyLetterSpacing(ctx, hf.letterSpacingPx);
      ctx.fillStyle = textColorLeft;
      ctx.font = canvasFontString(hf.weight, headSize, hf.familyId);
      for (const line of wrapLines(ctx, d.headline || "Headline", leftMax)) {
        ctx.fillText(line, padX, y);
        y += headSize * 1.15;
      }
      ctx.restore();

      const rightX = leftW + padX;
      const rightW = w - leftW - padX * 2;
      ctx.save();
      applyLetterSpacing(ctx, sf.letterSpacingPx);
      ctx.fillStyle = textColorRight;
      ctx.font = canvasFontString(sf.weight, subSize, sf.familyId);
      y = padY + Math.floor(h * 0.12);
      for (const line of wrapLines(ctx, d.subheadline || "", rightW)) {
        ctx.fillText(line, rightX, y);
        y += subSize * 1.22;
      }
      ctx.restore();

      if (logo) {
        drawLogo(ctx, logo, {
          x: w - padX - w * 0.22,
          y: padY,
          maxW: w * 0.2,
          maxH: h * 0.35,
        });
      }
      break;
    }
    case "editorial": {
      const barW = Math.max(4, Math.floor(w * 0.011 * tw.editorialBarScale));
      const textX = padX + barW + Math.floor(w * 0.02);
      const maxW = w - textX - padX - (logo ? w * 0.2 : 0);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      let y = padY + Math.floor(h * 0.025);
      if (d.tag.trim()) {
        ctx.save();
        applyLetterSpacing(ctx, tf.letterSpacingPx);
        ctx.fillStyle = secondary;
        ctx.font = canvasFontString(tf.weight, tagSize, tf.familyId);
        ctx.fillText(d.tag.trim().toUpperCase(), textX, y);
        ctx.restore();
        y += tagSize * 1.55;
      }
      ctx.save();
      applyLetterSpacing(ctx, hf.letterSpacingPx);
      ctx.fillStyle = primary;
      ctx.font = canvasFontString(hf.weight, titleSize, hf.familyId);
      const edLines = wrapLines(ctx, d.headline || "Your headline", maxW);
      for (const line of edLines) {
        ctx.fillText(line, textX, y);
        y += titleSize * 1.12;
      }
      let ruleW = maxW * 0.28;
      for (const line of edLines) {
        ruleW = Math.max(ruleW, ctx.measureText(line).width);
      }
      ruleW = Math.min(ruleW + titleSize * 0.25, maxW * 0.55);
      ctx.restore();
      ctx.fillStyle = secondary;
      const rh = Math.max(1, Math.floor(titleSize * 0.065));
      ctx.fillRect(textX, y + Math.floor(titleSize * 0.1), ruleW, rh);
      y += Math.floor(titleSize * 0.22) + rh;
      if (d.subheadline.trim()) {
        ctx.save();
        applyLetterSpacing(ctx, sf.letterSpacingPx);
        ctx.fillStyle = secondary;
        ctx.font = canvasFontString(sf.weight, subSize, sf.familyId);
        for (const line of wrapLines(ctx, d.subheadline, maxW)) {
          ctx.fillText(line, textX, y);
          y += subSize * 1.2;
        }
        ctx.restore();
      }
      if (logo) {
        drawLogo(ctx, logo, {
          x: w - padX - w * 0.2,
          y: padY,
          maxW: w * 0.18,
          maxH: h * 0.38,
        });
      }
      break;
    }
    case "frame": {
      const inset = Math.max(
        8,
        Math.floor(Math.min(w, h) * 0.042 * tw.frameInsetScale),
      );
      const innerW = w - 2 * (inset + padX);
      const textBlockW = Math.min(
        innerW,
        Math.floor((w * tw.centerTextWidthPercent) / 100),
      );
      const cx = w / 2;
      let y = h * 0.44 - titleSize * 0.25;
      if (d.tag.trim()) {
        ctx.save();
        applyLetterSpacing(ctx, tf.letterSpacingPx);
        ctx.fillStyle = secondary;
        ctx.font = canvasFontString(tf.weight, tagSize, tf.familyId);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(d.tag.trim().toUpperCase(), cx, y - titleSize * 0.95);
        ctx.restore();
      }
      ctx.save();
      applyLetterSpacing(ctx, hf.letterSpacingPx);
      ctx.fillStyle = primary;
      ctx.font = canvasFontString(hf.weight, titleSize, hf.familyId);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const frTitleLines = wrapLines(
        ctx,
        d.headline || "Your headline",
        textBlockW,
      );
      const frLh = titleSize * 1.15;
      y += d.tag.trim() ? titleSize * 0.32 : -titleSize * 0.45;
      for (const line of frTitleLines) {
        ctx.fillText(line, cx, y);
        y += frLh;
      }
      ctx.restore();
      if (d.subheadline.trim()) {
        ctx.save();
        applyLetterSpacing(ctx, sf.letterSpacingPx);
        ctx.fillStyle = secondary;
        ctx.font = canvasFontString(sf.weight, subSize, sf.familyId);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const frSubLines = wrapLines(ctx, d.subheadline, textBlockW);
        y += subSize * 0.35;
        for (const line of frSubLines) {
          ctx.fillText(line, cx, y);
          y += subSize * 1.18;
        }
        ctx.restore();
      }
      if (logo) {
        drawLogo(ctx, logo, {
          x: w - padX - w * 0.16,
          y: h - padY - h * 0.22,
          maxW: w * 0.14,
          maxH: h * 0.18,
        });
      }
      break;
    }
    case "diagonalSlash": {
      const dx = Math.floor((w * tw.diagonalColumnStartPercent) / 100);
      drawHeroStyle(dx, w - dx - padX - (logo ? w * 0.2 : 0), {
        maxW: w * 0.2,
        maxH: h * 0.4,
      });
      break;
    }
    case "ledger": {
      const lx = Math.floor((w * tw.ledgerMarginPercent) / 100) + 10;
      drawHeroStyle(lx, w - lx - padX - (logo ? w * 0.18 : 0), {
        maxW: w * 0.18,
        maxH: h * 0.38,
      });
      break;
    }
    case "orbit": {
      const oxMax = Math.min(
        Math.floor((w * tw.orbitColumnPercent) / 100),
        w - padX * 2 - (logo ? w * 0.24 : 0),
      );
      drawHeroStyle(padX, oxMax, { maxW: w * 0.22, maxH: h * 0.4 });
      break;
    }
    case "brutalist": {
      drawHeroStyle(padX, w - padX * 2 - (logo ? w * 0.22 : 0), {
        maxW: w * 0.2,
        maxH: h * 0.36,
      });
      break;
    }
    case "spotlight":
    case "hero": {
      drawHeroStyle(padX, w - padX * 2 - (logo ? w * 0.22 : 0), {
        maxW: w * 0.22,
        maxH: h * 0.42,
      });
      break;
    }
  }

  return canvas;
}
