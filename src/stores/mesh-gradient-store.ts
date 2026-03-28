import { create } from "zustand";

import { INITIAL_COLORS } from "@/lib/mesh-gradient/constants";
import { generateHarmoniousMeshPalette } from "@/lib/mesh-gradient/palette";
import type { CircleProps } from "@/lib/mesh-gradient/types";

function repositionCirclesAvoidOverlap(circles: CircleProps[]): CircleProps[] {
  return circles.map((circle, index) => {
    const overlapping = circles.some((other, otherIndex) => {
      if (index === otherIndex) return false;
      const distance = Math.hypot(circle.cx - other.cx, circle.cy - other.cy);
      return distance < 20;
    });

    if (!overlapping) return circle;

    let attempts = 0;
    let newCx = circle.cx;
    let newCy = circle.cy;

    while (attempts < 10) {
      newCx = Math.random() * 100;
      newCy = Math.random() * 100;

      const hasOverlap = circles.some((other, otherIndex) => {
        if (index === otherIndex) return false;
        const distance = Math.hypot(newCx - other.cx, newCy - other.cy);
        return distance < 20;
      });

      if (!hasOverlap) break;
      attempts++;
    }

    return { ...circle, cx: newCx, cy: newCy };
  });
}

interface MeshGradientState {
  circles: CircleProps[];
  backgroundColor: string;
  blur: number;
  saturation: number;
  contrast: number;
  brightness: number;
  grainIntensity: number;
  resolution: { width: number; height: number };

  setCircles: (circles: CircleProps[]) => void;
  updateCircleColor: (index: number, color: string) => void;
  setBackgroundColor: (color: string) => void;
  shufflePositions: () => void;
  resetPalette: () => void;
  applyHarmoniousPalette: () => void;
  setBlur: (blur: number) => void;
  setSaturation: (saturation: number) => void;
  setContrast: (contrast: number) => void;
  setBrightness: (brightness: number) => void;
  setGrainIntensity: (grainIntensity: number) => void;
  setResolution: (resolution: { width: number; height: number }) => void;
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

  setBlur: (blur) => set({ blur }),
  setSaturation: (saturation) => set({ saturation }),
  setContrast: (contrast) => set({ contrast }),
  setBrightness: (brightness) => set({ brightness }),
  setGrainIntensity: (grainIntensity) => set({ grainIntensity }),
  setResolution: (resolution) => set({ resolution }),
}));
