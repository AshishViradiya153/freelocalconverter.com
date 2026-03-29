"use client";

import { MeshGradientTrendingCard } from "./mesh-gradient-trending-card";
import type { TrendingMeshGradientItem } from "@/lib/mesh-gradient/trending-mesh-types";

interface MeshGradientTrendingGridProps {
  items: TrendingMeshGradientItem[];
  openLabel: string;
  downloadLabel: string;
}

export function MeshGradientTrendingGrid({
  items,
  openLabel,
  downloadLabel,
}: MeshGradientTrendingGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <MeshGradientTrendingCard
          key={item.id}
          item={item}
          openLabel={openLabel}
          downloadLabel={downloadLabel}
        />
      ))}
    </div>
  );
}
