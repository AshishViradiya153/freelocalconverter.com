import {
  LINEAR_GRADIENT_PRESETS,
  MESH_GRADIENT_PRESETS,
  type LinearGradientPreset,
  type MeshGradientPreset,
  linearPresetById,
  meshPresetById,
} from "./design-presets";
import { MASTER_SQUARE_MAX } from "./render-square-png";

export type DesignedBackground =
  | { kind: "solid"; color: string }
  | { kind: "linear"; preset: LinearGradientPreset }
  | { kind: "mesh"; preset: MeshGradientPreset };

export interface DesignedForegroundText {
  kind: "text";
  text: string;
  color: string;
  fontStack: string;
}

export interface DesignedForegroundEmoji {
  kind: "emoji";
  emoji: string;
}

export type DesignedForeground = DesignedForegroundText | DesignedForegroundEmoji;

export interface DesignedFaviconSpec {
  background: DesignedBackground;
  foreground: DesignedForeground;
}

function drawLinearGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  preset: LinearGradientPreset,
) {
  const rad = (preset.angleDeg * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const L = Math.hypot(w, h) / 2;
  const x0 = cx - Math.cos(rad) * L;
  const y0 = cy - Math.sin(rad) * L;
  const x1 = cx + Math.cos(rad) * L;
  const y1 = cy + Math.sin(rad) * L;
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [pos, color] of preset.stops) {
    g.addColorStop(pos, color);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  const rs = m?.[1];
  const gs = m?.[2];
  const bs = m?.[3];
  if (!rs || !gs || !bs) return hex;
  const r = Number.parseInt(rs, 16);
  const g = Number.parseInt(gs, 16);
  const b = Number.parseInt(bs, 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawMeshGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  preset: MeshGradientPreset,
) {
  ctx.fillStyle = preset.base;
  ctx.fillRect(0, 0, w, h);
  for (const blob of preset.blobs) {
    const x = blob.cx * w;
    const y = blob.cy * h;
    const r = blob.r * Math.max(w, h);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(blob.color, blob.alpha));
    g.addColorStop(1, withAlpha(blob.color, 0));
    ctx.fillStyle = g;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillRect(0, 0, w, h);
  }
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: DesignedBackground,
) {
  if (bg.kind === "solid") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (bg.kind === "linear") {
    drawLinearGradient(ctx, w, h, bg.preset);
    return;
  }
  drawMeshGradient(ctx, w, h, bg.preset);
}

export function firstGrapheme(input: string): string {
  const t = input.trim();
  if (!t) return "\u2605";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    for (const { segment } of seg.segment(t)) {
      if (segment.trim()) return segment;
    }
  }
  const arr = [...t];
  return arr[0] ?? "\u2605";
}

function fitTextFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontStack: string,
  maxW: number,
  maxH: number,
  weight: number,
): number {
  let size = Math.min(maxW, maxH) * 0.72;
  while (size > 10) {
    ctx.font = `${weight} ${Math.floor(size)}px ${fontStack}`;
    const m = ctx.measureText(text);
    const h =
      m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || size * 0.9;
    if (m.width <= maxW * 0.9 && h <= maxH * 0.88) return Math.floor(size);
    size -= 3;
  }
  return 12;
}

function drawForeground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fg: DesignedForeground,
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = w / 2;
  const cy = h / 2;
  const pad = Math.min(w, h) * 0.08;

  if (fg.kind === "emoji") {
    const emoji = firstGrapheme(fg.emoji);
    const base = Math.min(w, h) * 0.58;
    ctx.font = `${Math.floor(base)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillText(emoji, cx, cy + pad * 0.15);
    return;
  }

  const raw = fg.text.trim().slice(0, 3) || "A";
  const fontSize = fitTextFont(
    ctx,
    raw,
    fg.fontStack,
    w - pad * 2,
    h - pad * 2,
    700,
  );
  ctx.font = `700 ${fontSize}px ${fg.fontStack}`;
  ctx.fillStyle = fg.color;
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = Math.max(2, fontSize * 0.06);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(1, fontSize * 0.04);
  ctx.fillText(raw, cx, cy + pad * 0.1);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/** Renders a square favicon master (same edge as MASTER_SQUARE_MAX) for ZIP export and preview. */
export function renderDesignedFaviconCanvas(spec: DesignedFaviconSpec): HTMLCanvasElement {
  const edge = MASTER_SQUARE_MAX;
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  drawBackground(ctx, edge, edge, spec.background);
  drawForeground(ctx, edge, edge, spec.foreground);
  return canvas;
}

export function canvasToPngFile(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed"));
          return;
        }
        resolve(new File([blob], filename, { type: "image/png" }));
      },
      "image/png",
      1,
    );
  });
}

/** Build spec from UI model (validated ids fall back to first preset). */
export function buildDesignedSpec(args: {
  bgKind: "solid" | "linear" | "mesh";
  solidColor: string;
  linearPresetId: string;
  customLinearFrom: string;
  customLinearTo: string;
  useCustomLinear: boolean;
  meshPresetId: string;
  sourceMode: "text" | "emoji";
  textValue: string;
  emojiValue: string;
  textColor: string;
  fontStack: string;
}): DesignedFaviconSpec {
  let background: DesignedBackground;
  if (args.bgKind === "solid") {
    background = { kind: "solid", color: args.solidColor };
  } else if (args.bgKind === "mesh") {
    const fallbackMesh = MESH_GRADIENT_PRESETS[0];
    if (!fallbackMesh) {
      throw new Error("Mesh gradient presets missing");
    }
    const preset = meshPresetById(args.meshPresetId) ?? fallbackMesh;
    background = { kind: "mesh", preset };
  } else {
    const fallbackLinear = LINEAR_GRADIENT_PRESETS[0];
    if (!fallbackLinear) {
      throw new Error("Linear gradient presets missing");
    }
    const preset: LinearGradientPreset = args.useCustomLinear
      ? {
          id: "custom",
          angleDeg: 132,
          stops: [
            [0, args.customLinearFrom],
            [1, args.customLinearTo],
          ],
        }
      : (linearPresetById(args.linearPresetId) ?? fallbackLinear);
    background = { kind: "linear", preset };
  }

  const foreground: DesignedForeground =
    args.sourceMode === "emoji"
      ? { kind: "emoji", emoji: args.emojiValue }
      : {
        kind: "text",
        text: args.textValue,
        color: args.textColor,
        fontStack: args.fontStack,
      };

  return { background, foreground };
}
