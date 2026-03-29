/** Curated backgrounds for the favicon design studio (canvas). */

export interface LinearGradientPreset {
  id: string;
  angleDeg: number;
  stops: readonly [number, string][];
}

export interface MeshBlob {
  cx: number;
  cy: number;
  r: number;
  color: string;
  alpha: number;
}

export interface MeshGradientPreset {
  id: string;
  base: string;
  blobs: readonly MeshBlob[];
}

export const LINEAR_GRADIENT_PRESETS: readonly LinearGradientPreset[] = [
  {
    id: "indigo-violet",
    angleDeg: 135,
    stops: [
      [0, "#4f46e5"],
      [1, "#7c3aed"],
    ],
  },
  {
    id: "ocean",
    angleDeg: 145,
    stops: [
      [0, "#0369a1"],
      [0.5, "#06b6d4"],
      [1, "#67e8f9"],
    ],
  },
  {
    id: "sunset",
    angleDeg: 120,
    stops: [
      [0, "#f97316"],
      [0.55, "#ec4899"],
      [1, "#a855f7"],
    ],
  },
  {
    id: "forest",
    angleDeg: 160,
    stops: [
      [0, "#14532d"],
      [1, "#22c55e"],
    ],
  },
  {
    id: "midnight",
    angleDeg: 135,
    stops: [
      [0, "#0f172a"],
      [1, "#6366f1"],
    ],
  },
  {
    id: "ember",
    angleDeg: 45,
    stops: [
      [0, "#7f1d1d"],
      [0.5, "#ea580c"],
      [1, "#fbbf24"],
    ],
  },
  {
    id: "lavender",
    angleDeg: 180,
    stops: [
      [0, "#c084fc"],
      [0.5, "#818cf8"],
      [1, "#38bdf8"],
    ],
  },
  {
    id: "slate-rose",
    angleDeg: 128,
    stops: [
      [0, "#1e293b"],
      [0.45, "#be123c"],
      [1, "#fb7185"],
    ],
  },
  {
    id: "mint",
    angleDeg: 155,
    stops: [
      [0, "#0d9488"],
      [1, "#86efac"],
    ],
  },
  {
    id: "gold",
    angleDeg: 90,
    stops: [
      [0, "#422006"],
      [0.4, "#ca8a04"],
      [1, "#fde047"],
    ],
  },
] as const;

export const MESH_GRADIENT_PRESETS: readonly MeshGradientPreset[] = [
  {
    id: "aurora",
    base: "#0f172a",
    blobs: [
      { cx: 0.2, cy: 0.25, r: 0.55, color: "#6366f1", alpha: 0.85 },
      { cx: 0.75, cy: 0.2, r: 0.5, color: "#a855f7", alpha: 0.75 },
      { cx: 0.55, cy: 0.75, r: 0.6, color: "#06b6d4", alpha: 0.7 },
    ],
  },
  {
    id: "coral-bloom",
    base: "#fff1f2",
    blobs: [
      { cx: 0.15, cy: 0.35, r: 0.5, color: "#fb7185", alpha: 0.9 },
      { cx: 0.85, cy: 0.3, r: 0.45, color: "#f97316", alpha: 0.75 },
      { cx: 0.5, cy: 0.8, r: 0.55, color: "#fda4af", alpha: 0.65 },
    ],
  },
  {
    id: "deep-sea",
    base: "#020617",
    blobs: [
      { cx: 0.3, cy: 0.6, r: 0.65, color: "#0284c7", alpha: 0.8 },
      { cx: 0.8, cy: 0.45, r: 0.5, color: "#312e81", alpha: 0.85 },
      { cx: 0.45, cy: 0.15, r: 0.4, color: "#22d3ee", alpha: 0.55 },
    ],
  },
  {
    id: "lime-pop",
    base: "#14532d",
    blobs: [
      { cx: 0.25, cy: 0.28, r: 0.48, color: "#84cc16", alpha: 0.85 },
      { cx: 0.72, cy: 0.65, r: 0.52, color: "#4ade80", alpha: 0.7 },
      { cx: 0.55, cy: 0.4, r: 0.35, color: "#fef08a", alpha: 0.45 },
    ],
  },
  {
    id: "plum-mist",
    base: "#1e1b4b",
    blobs: [
      { cx: 0.22, cy: 0.7, r: 0.55, color: "#7e22ce", alpha: 0.8 },
      { cx: 0.78, cy: 0.25, r: 0.48, color: "#db2777", alpha: 0.72 },
      { cx: 0.5, cy: 0.5, r: 0.35, color: "#c4b5fd", alpha: 0.35 },
    ],
  },
  {
    id: "sand-stone",
    base: "#fafaf9",
    blobs: [
      { cx: 0.2, cy: 0.22, r: 0.45, color: "#d6d3d1", alpha: 0.95 },
      { cx: 0.85, cy: 0.35, r: 0.42, color: "#a8a29e", alpha: 0.55 },
      { cx: 0.4, cy: 0.85, r: 0.5, color: "#78716c", alpha: 0.4 },
    ],
  },
  {
    id: "electric",
    base: "#18181b",
    blobs: [
      { cx: 0.5, cy: 0.35, r: 0.45, color: "#eab308", alpha: 0.65 },
      { cx: 0.15, cy: 0.55, r: 0.4, color: "#3b82f6", alpha: 0.7 },
      { cx: 0.85, cy: 0.7, r: 0.42, color: "#ef4444", alpha: 0.55 },
    ],
  },
  {
    id: "peach-sorbet",
    base: "#fff7ed",
    blobs: [
      { cx: 0.35, cy: 0.35, r: 0.5, color: "#fdba74", alpha: 0.85 },
      { cx: 0.75, cy: 0.6, r: 0.48, color: "#f9a8d4", alpha: 0.65 },
      { cx: 0.45, cy: 0.82, r: 0.38, color: "#fcd34d", alpha: 0.5 },
    ],
  },
] as const;

export const TEXT_FONT_PRESETS: readonly { id: string; stack: string }[] = [
  { id: "system", stack: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: "georgia", stack: "Georgia, 'Times New Roman', serif" },
  { id: "mono", stack: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
  { id: "display", stack: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
  { id: "rounded", stack: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" },
] as const;

export function linearPresetById(id: string): LinearGradientPreset | undefined {
  return LINEAR_GRADIENT_PRESETS.find((p) => p.id === id);
}

export function meshPresetById(id: string): MeshGradientPreset | undefined {
  return MESH_GRADIENT_PRESETS.find((p) => p.id === id);
}
