import { nanoid } from "nanoid";

import type { AuroraBlob, BlobShape } from "@/lib/mesh-gradient/aurora-types";

export const AURORA_RANDOM_COLORS = [
  "#FF9E7D",
  "#FF6321",
  "#F5F5F0",
  "#E6E6E6",
  "#FFD700",
  "#FF4500",
  "#FF8C00",
  "#FFA07A",
  "#20B2AA",
  "#87CEFA",
  "#778899",
  "#B0C4DE",
  "#F0E68C",
  "#E6E6FA",
  "#FFF0F5",
] as const;

const SEED: Omit<AuroraBlob, "id">[] = [
  {
    color: "#FF9E7D",
    x: 20,
    y: 30,
    size: 60,
    opacity: 0.8,
    shape: "circle",
    zIndex: 1,
  },
  {
    color: "#FF6321",
    x: 80,
    y: 20,
    size: 70,
    opacity: 0.7,
    shape: "circle",
    zIndex: 2,
  },
  {
    color: "#F5F5F0",
    x: 50,
    y: 50,
    size: 80,
    opacity: 0.6,
    shape: "circle",
    zIndex: 3,
  },
  {
    color: "#E6E6E6",
    x: 30,
    y: 80,
    size: 50,
    opacity: 0.5,
    shape: "circle",
    zIndex: 4,
  },
];

export function createInitialAuroraBlobs(): AuroraBlob[] {
  return SEED.map((b) => ({ ...b, id: nanoid() }));
}

export function generateRandomAuroraBlob(): AuroraBlob {
  const shapes: BlobShape[] = ["circle", "square", "pill", "organic"];
  return {
    id: nanoid(),
    color:
      AURORA_RANDOM_COLORS[
        Math.floor(Math.random() * AURORA_RANDOM_COLORS.length)
      ] ?? "#FF9E7D",
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 40 + Math.random() * 60,
    opacity: 0.4 + Math.random() * 0.5,
    shape: shapes[Math.floor(Math.random() * shapes.length)] ?? "circle",
    zIndex: 1,
  };
}
