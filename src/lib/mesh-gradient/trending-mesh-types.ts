import type { CircleProps } from "@/lib/mesh-gradient/types";

export interface TrendingMeshGradientItem {
  id: number;
  name: string;
  backgroundColor: string;
  circles: CircleProps[];
  blur: number;
  saturation: number;
  contrast: number;
  brightness: number;
  grainIntensity: number;
}

export interface TrendingMeshGradientFile {
  version: 1;
  items: TrendingMeshGradientItem[];
}
