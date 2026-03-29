import "server-only";

import { generateRandomSkater } from "@/app/lib/utils";
import { generateId } from "@/lib/id";
import type { Skater } from "@/lib/skaters-model";

const DEFAULT_COUNT = 100;

let rows: Skater[] = [];
let initialized = false;

function ensureLoaded() {
  if (initialized) return;
  rows = Array.from({ length: DEFAULT_COUNT }, (_, i) =>
    generateRandomSkater({ order: i }),
  );
  initialized = true;
}

export function listSkaters(): Skater[] {
  ensureLoaded();
  return rows;
}

export function insertSkaters(
  partials: Array<
    Partial<Omit<Skater, "createdAt" | "updatedAt">> & { id?: string }
  >,
): Skater[] {
  ensureLoaded();
  const now = new Date();
  const inserted: Skater[] = partials.map((p) => {
    const row: Skater = {
      id: p.id ?? generateId("skater"),
      order: p.order ?? 0,
      name: p.name ?? null,
      email: p.email ?? null,
      stance: p.stance ?? "regular",
      style: p.style ?? "street",
      status: p.status ?? "amateur",
      yearsSkating: p.yearsSkating ?? 0,
      startedSkating: p.startedSkating ?? null,
      isPro: p.isPro ?? false,
      tricks: p.tricks ?? null,
      media: p.media ?? null,
      createdAt: now,
      updatedAt: now,
    };
    rows.push(row);
    return row;
  });
  return inserted;
}

export function updateSkaters(
  updates: Array<{ id: string; changes: Partial<Skater> }>,
): number {
  ensureLoaded();
  let count = 0;
  for (const { id, changes } of updates) {
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) continue;
    const prev = rows[idx];
    if (!prev) continue;
    const next: Skater = {
      ...prev,
      ...changes,
      id: prev.id,
      createdAt: prev.createdAt,
      updatedAt: new Date(),
    };
    rows[idx] = next;
    count += 1;
  }
  return count;
}

export function deleteSkatersByIds(ids: string[]): number {
  ensureLoaded();
  const idSet = new Set(ids);
  const before = rows.length;
  rows = rows.filter((r) => !idSet.has(r.id));
  return before - rows.length;
}
