import type { CircleProps } from "@/lib/mesh-gradient/types";

/** Integer weights 1–100 per blob, summing to 100. */
export function equalWeights(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [100];
  const base = Math.floor(100 / count);
  const rem = 100 - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}

export function randomBlobWeights(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [100];
  const weights = Array.from({ length: count }, () => 1);
  let pool = 100 - count;
  for (let p = 0; p < pool; p++) {
    const i = Math.floor(Math.random() * count);
    weights[i] = (weights[i] ?? 1) + 1;
  }
  return weights;
}

function distributeTotalByProportions(
  total: number,
  proportions: number[],
): number[] {
  if (proportions.length === 0) return [];
  const sum = proportions.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const base = Math.floor(total / proportions.length);
    let rem = total - base * proportions.length;
    return proportions.map((_, i) => base + (i < rem ? 1 : 0));
  }
  const raw = proportions.map((p) => (p / sum) * total);
  const floors = raw.map((x) => Math.floor(x));
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < remainder; k++) {
    const idx = order[k]?.i;
    if (idx !== undefined) out[idx] = (out[idx] ?? 0) + 1;
  }
  return out;
}

/** Effective integer weight per circle; legacy presets without `weight` use an equal split. */
export function effectiveWeights(
  circles: CircleProps[] | undefined | null,
): number[] {
  const list = circles ?? [];
  const n = list.length;
  if (n === 0) return [];
  const declared = list.every(
    (c) => typeof c.weight === "number" && Number.isFinite(c.weight),
  );
  if (!declared) return equalWeights(n);
  const w = list.map((c) => Math.round(c.weight!));
  const sum = w.reduce((a, b) => a + b, 0);
  if (sum === 100 && w.every((x) => x >= 1)) return w;
  return equalWeights(n);
}

/** Assign `weight` on each circle from `effectiveWeights`. */
export function circlesWithNormalizedWeights(
  circles: CircleProps[] | undefined | null,
): CircleProps[] {
  const list = circles ?? [];
  if (list.length === 0) return [];
  const w = effectiveWeights(list);
  return list.map((c, i) => ({ ...c, weight: w[i] }));
}

/**
 * Set one blob's share to `newValue` (whole number); others adjust so the sum stays 100.
 */
export function redistributeAfterWeightChange(
  circles: CircleProps[],
  index: number,
  newValue: number,
): CircleProps[] {
  const n = circles.length;
  if (n === 0) return [];
  if (n === 1) return [{ ...circles[0]!, weight: 100 }];

  const w = effectiveWeights(circles);
  const maxForIndex = 100 - (n - 1);
  const target = Math.max(1, Math.min(maxForIndex, Math.round(newValue)));
  const rest = 100 - target;
  const otherIndices = w.map((_, i) => i).filter((i) => i !== index);
  const otherPrev = otherIndices.map((i) => w[i]!);
  const pool = rest - otherIndices.length;
  const extra =
    pool <= 0
      ? otherIndices.map(() => 0)
      : distributeTotalByProportions(pool, otherPrev);
  const next = [...w];
  next[index] = target;
  otherIndices.forEach((j, oi) => {
    next[j] = 1 + (extra[oi] ?? 0);
  });
  return circles.map((c, i) => ({ ...c, weight: next[i] }));
}

/** `sqrt(weight / equalShare)` so area-ish scales with percentage when blur blends blobs. */
export function blobSizeScaleForWeight(
  weight: number,
  circleCount: number,
): number {
  if (circleCount <= 0) return 1;
  const equalShare = 100 / circleCount;
  if (equalShare <= 0) return 1;
  return Math.sqrt(Math.max(0.01, weight / equalShare));
}
