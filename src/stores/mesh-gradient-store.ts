import { create } from "zustand";
import { nanoid } from "nanoid";

import type { AuroraBlob, BlobShape } from "@/lib/mesh-gradient/aurora-types";
import {
  AURORA_RANDOM_COLORS,
  createInitialAuroraBlobs,
  generateRandomAuroraBlob,
} from "@/lib/mesh-gradient/aurora-initial";
import { MAX_MESH_BLOB_COUNT } from "@/lib/mesh-gradient/constants";
import type { TrendingMeshGradientItem } from "@/lib/mesh-gradient/trending-mesh-types";

interface MeshGradientState {
  blobs: AuroraBlob[];
  backgroundColor: string;
  blur: number;
  noiseOpacity: number;
  resolution: { width: number; height: number };
  selectedBlobId: string | null;

  text: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  opacity: number;
  fontFamily: string;
  lineHeight: number;
  textColor: string;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  textShadow: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  textPosition: { x: number; y: number };
  textAlign: "left" | "center" | "right";

  setBlobs: (blobs: AuroraBlob[]) => void;
  updateBlob: (id: string, updates: Partial<AuroraBlob>) => void;
  addBlob: () => void;
  removeBlob: (id: string) => void;
  randomizeAllBlobs: () => void;
  randomizeBlobColors: () => void;
  resetToDefaults: () => void;
  setBackgroundColor: (color: string) => void;
  setBlur: (blur: number) => void;
  setNoiseOpacity: (noiseOpacity: number) => void;
  setResolution: (resolution: { width: number; height: number }) => void;
  setSelectedBlobId: (id: string | null) => void;
  applyTrendingMeshPreset: (preset: TrendingMeshGradientItem) => void;

  setText: (text: string) => void;
  setFontSize: (fontSize: number) => void;
  setFontWeight: (fontWeight: number) => void;
  setLetterSpacing: (letterSpacing: number) => void;
  setOpacity: (opacity: number) => void;
  setFontFamily: (fontFamily: string) => void;
  setLineHeight: (lineHeight: number) => void;
  setTextColor: (textColor: string) => void;
  setIsItalic: (isItalic: boolean) => void;
  setIsUnderline: (isUnderline: boolean) => void;
  setIsStrikethrough: (isStrikethrough: boolean) => void;
  setTextShadow: (patch: Partial<MeshGradientState["textShadow"]>) => void;
  setTextPosition: (textPosition: { x: number; y: number }) => void;
  setTextAlign: (textAlign: "left" | "center" | "right") => void;
}

function mapTrendingToBlobs(preset: TrendingMeshGradientItem): AuroraBlob[] {
  return preset.circles.map((c, i) => ({
    id: nanoid(),
    color: c.color,
    x: c.cx,
    y: c.cy,
    size: 55,
    opacity: 0.75,
    shape: "circle" as const,
    zIndex: i + 1,
  }));
}

function trendingBlurToAurora(canvasBlur: number): number {
  return Math.min(200, Math.max(0, Math.round(canvasBlur / 4)));
}

function trendingGrainToNoise(grain: number): number {
  return Math.min(0.5, Math.max(0, (grain / 100) * 0.5));
}

export const useMeshGradientStore = create<MeshGradientState>((set, get) => ({
  blobs: createInitialAuroraBlobs(),
  backgroundColor: "#f5f5f0",
  blur: 80,
  noiseOpacity: 0,
  resolution: { width: 1920, height: 1080 },
  selectedBlobId: null,

  text: "Your title",
  fontSize: 6,
  fontWeight: 600,
  letterSpacing: -0.02,
  opacity: 100,
  fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif",
  lineHeight: 1,
  textColor: "#000000",
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  textShadow: {
    color: "#f5f5f5",
    blur: 24,
    offsetX: 0,
    offsetY: 0,
  },
  textPosition: { x: 0, y: 0 },
  textAlign: "center",

  setBlobs: (blobs) => set({ blobs }),

  updateBlob: (id, updates) => {
    set({
      blobs: get().blobs.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    });
  },

  addBlob: () => {
    const { blobs } = get();
    if (blobs.length >= MAX_MESH_BLOB_COUNT) return;
    const maxZ = blobs.reduce((acc, b) => Math.max(acc, b.zIndex), 0);
    set({
      blobs: [...blobs, { ...generateRandomAuroraBlob(), zIndex: maxZ + 1 }],
    });
  },

  removeBlob: (id) => {
    const { blobs, selectedBlobId } = get();
    if (blobs.length <= 1) return;
    const next = blobs.filter((b) => b.id !== id);
    set({
      blobs: next,
      selectedBlobId: selectedBlobId === id ? null : selectedBlobId,
    });
  },

  randomizeAllBlobs: () => {
    const shapes: BlobShape[] = ["circle", "square", "pill", "organic"];
    set({
      blobs: get().blobs.map((b) => ({
        ...b,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 40 + Math.random() * 60,
        color:
          AURORA_RANDOM_COLORS[
            Math.floor(Math.random() * AURORA_RANDOM_COLORS.length)
          ] ?? b.color,
        shape: shapes[Math.floor(Math.random() * shapes.length)] ?? "circle",
      })),
    });
  },

  randomizeBlobColors: () => {
    set({
      blobs: get().blobs.map((b) => ({
        ...b,
        color:
          AURORA_RANDOM_COLORS[
            Math.floor(Math.random() * AURORA_RANDOM_COLORS.length)
          ] ?? b.color,
      })),
    });
  },

  resetToDefaults: () => {
    set({
      blobs: createInitialAuroraBlobs(),
      backgroundColor: "#f5f5f0",
      blur: 80,
      noiseOpacity: 0,
      selectedBlobId: null,
    });
  },

  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setBlur: (blur) => set({ blur }),
  setNoiseOpacity: (noiseOpacity) => set({ noiseOpacity }),
  setResolution: (resolution) => set({ resolution }),
  setSelectedBlobId: (selectedBlobId) => set({ selectedBlobId }),

  applyTrendingMeshPreset: (preset) => {
    set({
      blobs: mapTrendingToBlobs(preset),
      backgroundColor: preset.backgroundColor,
      blur: trendingBlurToAurora(preset.blur),
      noiseOpacity: trendingGrainToNoise(preset.grainIntensity),
      selectedBlobId: null,
    });
  },

  setText: (text) => set({ text }),
  setFontSize: (fontSize) => set({ fontSize }),
  setFontWeight: (fontWeight) => set({ fontWeight }),
  setLetterSpacing: (letterSpacing) => set({ letterSpacing }),
  setOpacity: (opacity) => set({ opacity }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setTextColor: (textColor) => set({ textColor }),
  setIsItalic: (isItalic) => set({ isItalic }),
  setIsUnderline: (isUnderline) => set({ isUnderline }),
  setIsStrikethrough: (isStrikethrough) => set({ isStrikethrough }),
  setTextShadow: (patch) =>
    set((s) => ({ textShadow: { ...s.textShadow, ...patch } })),
  setTextPosition: (textPosition) => set({ textPosition }),
  setTextAlign: (textAlign) => set({ textAlign }),
}));
