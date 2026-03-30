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
  {
    id: "sunset-blaze",
    base: "#1c0a0a",
    blobs: [
      { cx: 0.2, cy: 0.75, r: 0.58, color: "#dc2626", alpha: 0.82 },
      { cx: 0.78, cy: 0.28, r: 0.52, color: "#f97316", alpha: 0.78 },
      { cx: 0.48, cy: 0.48, r: 0.38, color: "#fbbf24", alpha: 0.45 },
    ],
  },
  {
    id: "arctic-frost",
    base: "#f0f9ff",
    blobs: [
      { cx: 0.18, cy: 0.32, r: 0.48, color: "#bae6fd", alpha: 0.95 },
      { cx: 0.82, cy: 0.38, r: 0.5, color: "#e0f2fe", alpha: 0.85 },
      { cx: 0.42, cy: 0.78, r: 0.52, color: "#7dd3fc", alpha: 0.55 },
    ],
  },
  {
    id: "noir-rose",
    base: "#0a0a0a",
    blobs: [
      { cx: 0.72, cy: 0.22, r: 0.42, color: "#fda4af", alpha: 0.55 },
      { cx: 0.25, cy: 0.65, r: 0.55, color: "#be123c", alpha: 0.72 },
      { cx: 0.55, cy: 0.55, r: 0.35, color: "#fb7185", alpha: 0.4 },
    ],
  },
  {
    id: "honey-glow",
    base: "#422006",
    blobs: [
      { cx: 0.3, cy: 0.35, r: 0.52, color: "#ca8a04", alpha: 0.8 },
      { cx: 0.75, cy: 0.62, r: 0.48, color: "#eab308", alpha: 0.65 },
      { cx: 0.5, cy: 0.18, r: 0.35, color: "#fde047", alpha: 0.4 },
    ],
  },
  {
    id: "cyber-mint",
    base: "#042f2e",
    blobs: [
      { cx: 0.22, cy: 0.28, r: 0.5, color: "#2dd4bf", alpha: 0.75 },
      { cx: 0.78, cy: 0.35, r: 0.45, color: "#d946ef", alpha: 0.55 },
      { cx: 0.48, cy: 0.72, r: 0.5, color: "#5eead4", alpha: 0.5 },
    ],
  },
  {
    id: "twilight-violet",
    base: "#1e1033",
    blobs: [
      { cx: 0.35, cy: 0.3, r: 0.55, color: "#7c3aed", alpha: 0.78 },
      { cx: 0.8, cy: 0.65, r: 0.5, color: "#4c1d95", alpha: 0.85 },
      { cx: 0.15, cy: 0.72, r: 0.42, color: "#c084fc", alpha: 0.5 },
    ],
  },
  {
    id: "moss-earth",
    base: "#1a2e1a",
    blobs: [
      { cx: 0.28, cy: 0.58, r: 0.55, color: "#3f6212", alpha: 0.82 },
      { cx: 0.72, cy: 0.32, r: 0.48, color: "#65a30d", alpha: 0.7 },
      { cx: 0.52, cy: 0.82, r: 0.4, color: "#a3e635", alpha: 0.45 },
    ],
  },
  {
    id: "cherry-depth",
    base: "#2b0612",
    blobs: [
      { cx: 0.65, cy: 0.28, r: 0.5, color: "#be123c", alpha: 0.85 },
      { cx: 0.25, cy: 0.42, r: 0.48, color: "#881337", alpha: 0.8 },
      { cx: 0.55, cy: 0.72, r: 0.45, color: "#fb7185", alpha: 0.55 },
    ],
  },
  {
    id: "soft-lilac",
    base: "#faf5ff",
    blobs: [
      { cx: 0.25, cy: 0.4, r: 0.52, color: "#ddd6fe", alpha: 0.9 },
      { cx: 0.78, cy: 0.45, r: 0.48, color: "#f5d0fe", alpha: 0.75 },
      { cx: 0.45, cy: 0.8, r: 0.42, color: "#e9d5ff", alpha: 0.65 },
    ],
  },
  {
    id: "graphite-neon",
    base: "#27272a",
    blobs: [
      { cx: 0.5, cy: 0.28, r: 0.42, color: "#a3e635", alpha: 0.55 },
      { cx: 0.18, cy: 0.62, r: 0.5, color: "#71717a", alpha: 0.65 },
      { cx: 0.82, cy: 0.68, r: 0.45, color: "#22d3ee", alpha: 0.45 },
    ],
  },
  {
    id: "cocoa-dream",
    base: "#292524",
    blobs: [
      { cx: 0.35, cy: 0.35, r: 0.52, color: "#78716c", alpha: 0.75 },
      { cx: 0.72, cy: 0.58, r: 0.5, color: "#a8a29e", alpha: 0.55 },
      { cx: 0.22, cy: 0.75, r: 0.4, color: "#d6d3d1", alpha: 0.35 },
    ],
  },
  {
    id: "glacier-bay",
    base: "#ecfeff",
    blobs: [
      { cx: 0.3, cy: 0.25, r: 0.45, color: "#a5f3fc", alpha: 0.88 },
      { cx: 0.75, cy: 0.55, r: 0.55, color: "#22d3ee", alpha: 0.5 },
      { cx: 0.4, cy: 0.78, r: 0.42, color: "#67e8f9", alpha: 0.55 },
    ],
  },
  {
    id: "ember-smoke",
    base: "#18181b",
    blobs: [
      { cx: 0.45, cy: 0.22, r: 0.48, color: "#f97316", alpha: 0.6 },
      { cx: 0.2, cy: 0.65, r: 0.52, color: "#52525b", alpha: 0.75 },
      { cx: 0.82, cy: 0.55, r: 0.42, color: "#ea580c", alpha: 0.5 },
    ],
  },
  {
    id: "sakura-mist",
    base: "#fdf2f8",
    blobs: [
      { cx: 0.32, cy: 0.38, r: 0.5, color: "#fbcfe8", alpha: 0.88 },
      { cx: 0.75, cy: 0.35, r: 0.45, color: "#fce7f3", alpha: 0.8 },
      { cx: 0.48, cy: 0.75, r: 0.48, color: "#f9a8d4", alpha: 0.55 },
    ],
  },
  {
    id: "teal-depth",
    base: "#042f2e",
    blobs: [
      { cx: 0.65, cy: 0.3, r: 0.52, color: "#0d9488", alpha: 0.82 },
      { cx: 0.28, cy: 0.55, r: 0.55, color: "#134e4a", alpha: 0.88 },
      { cx: 0.55, cy: 0.78, r: 0.42, color: "#2dd4bf", alpha: 0.5 },
      { cx: 0.12, cy: 0.22, r: 0.32, color: "#5eead4", alpha: 0.35 },
    ],
  },
  {
    id: "wine-velvet",
    base: "#1c0a14",
    blobs: [
      { cx: 0.55, cy: 0.35, r: 0.55, color: "#86198f", alpha: 0.78 },
      { cx: 0.22, cy: 0.58, r: 0.48, color: "#701a75", alpha: 0.82 },
      { cx: 0.78, cy: 0.68, r: 0.4, color: "#c026d3", alpha: 0.45 },
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
