import { create } from "zustand";
import { repositionCirclesAvoidOverlap } from "@/lib/mesh-gradient/circle-layout";
import { INITIAL_COLORS } from "@/lib/mesh-gradient/constants";
import { generateHarmoniousMeshPalette } from "@/lib/mesh-gradient/palette";
import type { TrendingMeshGradientItem } from "@/lib/mesh-gradient/trending-mesh-types";
import type { CircleProps } from "@/lib/mesh-gradient/types";

interface MeshGradientState {
  circles: CircleProps[];
  backgroundColor: string;
  blur: number;
  saturation: number;
  contrast: number;
  brightness: number;
  grainIntensity: number;
  resolution: { width: number; height: number };

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

  setCircles: (circles: CircleProps[]) => void;
  updateCircleColor: (index: number, color: string) => void;
  setBackgroundColor: (color: string) => void;
  shufflePositions: () => void;
  resetPalette: () => void;
  applyHarmoniousPalette: () => void;
  applyTrendingMeshPreset: (preset: TrendingMeshGradientItem) => void;
  setBlur: (blur: number) => void;
  setSaturation: (saturation: number) => void;
  setContrast: (contrast: number) => void;
  setBrightness: (brightness: number) => void;
  setGrainIntensity: (grainIntensity: number) => void;
  setResolution: (resolution: { width: number; height: number }) => void;

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

const initialCircles: CircleProps[] = INITIAL_COLORS.map((color) => ({
  color,
  cx: Math.random() * 100,
  cy: Math.random() * 100,
}));

export const useMeshGradientStore = create<MeshGradientState>((set, get) => ({
  circles: repositionCirclesAvoidOverlap(initialCircles),
  backgroundColor: "#001220",
  blur: 600,
  saturation: 100,
  contrast: 100,
  brightness: 100,
  grainIntensity: 25,
  resolution: { width: 1920, height: 1080 },

  text: "Your title",
  fontSize: 6,
  fontWeight: 600,
  letterSpacing: -0.02,
  opacity: 100,
  fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif",
  lineHeight: 1,
  textColor: "#f1f1f1",
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

  setCircles: (circles) =>
    set({ circles: repositionCirclesAvoidOverlap(circles) }),

  updateCircleColor: (index, color) => {
    const { circles } = get();
    if (index < 0 || index >= circles.length) return;
    const next = [...circles];
    const current = next[index];
    if (!current) return;
    next[index] = { ...current, color };
    set({ circles: next });
  },

  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),

  shufflePositions: () => {
    const { circles } = get();
    set({
      circles: circles.map((c) => ({
        ...c,
        cx: Math.random() * 100,
        cy: Math.random() * 100,
      })),
    });
  },

  resetPalette: () => {
    const { circles } = get();
    const newCircles = INITIAL_COLORS.map((color, index) => ({
      color,
      cx: circles[index]?.cx ?? Math.random() * 100,
      cy: circles[index]?.cy ?? Math.random() * 100,
    }));
    set({
      backgroundColor: "#001220",
      circles: repositionCirclesAvoidOverlap(newCircles),
    });
  },

  applyHarmoniousPalette: () => {
    const { circles } = get();
    const { backgroundColor, circleColors } = generateHarmoniousMeshPalette();
    set({
      backgroundColor,
      circles: repositionCirclesAvoidOverlap(
        circleColors.map((color, i) => ({
          color,
          cx: circles[i]?.cx ?? Math.random() * 100,
          cy: circles[i]?.cy ?? Math.random() * 100,
        })),
      ),
    });
  },

  applyTrendingMeshPreset: (preset) => {
    set({
      circles: preset.circles.map((c) => ({ ...c })),
      backgroundColor: preset.backgroundColor,
      blur: preset.blur,
      saturation: preset.saturation,
      contrast: preset.contrast,
      brightness: preset.brightness,
      grainIntensity: preset.grainIntensity,
    });
  },

  setBlur: (blur) => set({ blur }),
  setSaturation: (saturation) => set({ saturation }),
  setContrast: (contrast) => set({ contrast }),
  setBrightness: (brightness) => set({ brightness }),
  setGrainIntensity: (grainIntensity) => set({ grainIntensity }),
  setResolution: (resolution) => set({ resolution }),

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
