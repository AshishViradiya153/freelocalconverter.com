"use client";

import { useEffect, useMemo, useState } from "react";
import type { TrendingMeshGradientItem } from "@/lib/mesh-gradient/trending-mesh-types";
import { MeshGradientTrendingCard } from "./mesh-gradient-trending-card";

interface MeshGradientTrendingGridProps {
  items: TrendingMeshGradientItem[];
  openLabel: string;
  downloadLabel: string;
}

const FAVORITES_STORAGE_KEY = "mesh-gradient-trending-favorites";

export function MeshGradientTrendingGrid({
  items,
  openLabel,
  downloadLabel,
}: MeshGradientTrendingGridProps) {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const safeIds = parsed.filter((v) => Number.isInteger(v)) as number[];
      setFavoriteIds(safeIds);
    } catch {
      // ignore bad local data
    }
  }, []);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const favoriteItems = useMemo(
    () => items.filter((item) => favoriteIdSet.has(item.id)),
    [items, favoriteIdSet],
  );

  function persistFavorites(next: number[]) {
    setFavoriteIds(next);
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }

  function onToggleFavorite(id: number) {
    if (favoriteIdSet.has(id)) {
      persistFavorites(favoriteIds.filter((x) => x !== id));
      return;
    }
    persistFavorites([...favoriteIds, id]);
  }

  return (
    <div className="space-y-8">
      {favoriteItems.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-semibold text-foreground text-sm">Favorites</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteItems.map((item) => (
              <MeshGradientTrendingCard
                key={`favorite-${item.id}`}
                item={item}
                openLabel={openLabel}
                downloadLabel={downloadLabel}
                isFavorite={favoriteIdSet.has(item.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div
        className={
          favoriteItems.length > 0
            ? "grid gap-4 border-border border-t pt-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }
      >
        {items.map((item) => (
          <MeshGradientTrendingCard
            key={item.id}
            item={item}
            openLabel={openLabel}
            downloadLabel={downloadLabel}
            isFavorite={favoriteIdSet.has(item.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
