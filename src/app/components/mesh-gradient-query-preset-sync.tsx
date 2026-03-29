"use client";

import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

import type { TrendingMeshGradientFile } from "@/lib/mesh-gradient/trending-mesh-types";
import { useMeshGradientStore } from "@/stores/mesh-gradient-store";

/** Applies `?mesh=<id>` from trending JSON into the zustand store once the file loads. */
export function MeshGradientQueryPresetSync() {
  const searchParams = useSearchParams();
  const appliedId = useRef<number | null>(null);

  useLayoutEffect(() => {
    const raw = searchParams.get("mesh");
    if (!raw) {
      appliedId.current = null;
      return;
    }
    const id = Number(raw);
    if (!Number.isFinite(id) || id < 1) return;
    if (appliedId.current === id) return;

    let cancelled = false;
    void (async () => {
      const res = await fetch("/data/trending-mesh-gradients.json");
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as TrendingMeshGradientFile;
      const preset = data.items.find((x) => x.id === id);
      if (!preset || cancelled) return;
      useMeshGradientStore.getState().applyTrendingMeshPreset(preset);
      appliedId.current = id;
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return null;
}
