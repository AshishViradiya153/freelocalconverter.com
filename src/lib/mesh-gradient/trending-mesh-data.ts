import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import type { TrendingMeshGradientFile } from "@/lib/mesh-gradient/trending-mesh-types";

const TRENDING_MESH_JSON = path.join(
  process.cwd(),
  "public",
  "data",
  "trending-mesh-gradients.json",
);

export async function readTrendingMeshGradients(): Promise<TrendingMeshGradientFile> {
  const raw = await fs.readFile(TRENDING_MESH_JSON, "utf8");
  const data = JSON.parse(raw) as TrendingMeshGradientFile;
  if (data.version !== 1 || !Array.isArray(data.items)) {
    return { version: 1, items: [] };
  }
  return data;
}
