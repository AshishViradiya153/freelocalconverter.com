import type { PseoPageRecord } from "@/lib/pseo/types";

interface LinkingIndex {
  bySlug: Map<string, PseoPageRecord>;
  guides: PseoPageRecord[];
  toolsByCategory: Map<string, PseoPageRecord[]>;
}

const linkingIndexByRef = new WeakMap<readonly PseoPageRecord[], LinkingIndex>();

function getLinkingIndex(all: readonly PseoPageRecord[]): LinkingIndex {
  const existing = linkingIndexByRef.get(all);
  if (existing) return existing;

  const bySlug = new Map<string, PseoPageRecord>();
  const guides: PseoPageRecord[] = [];
  const toolsByCategory = new Map<string, PseoPageRecord[]>();

  for (const page of all) {
    bySlug.set(page.slug, page);
    if (page.route.type === "guide") {
      guides.push(page);
      continue;
    }
    const row = toolsByCategory.get(page.route.category);
    if (row) row.push(page);
    else toolsByCategory.set(page.route.category, [page]);
  }

  const index: LinkingIndex = { bySlug, guides, toolsByCategory };
  linkingIndexByRef.set(all, index);
  return index;
}

/**
 * Hub-and-spoke: return same-category tool pages and explicitly linked `relatedSlugs`.
 * Caps list length to avoid huge HTML on mega-hubs.
 */
export function pickRelatedPseoPages(
  all: readonly PseoPageRecord[],
  current: PseoPageRecord,
  limit = 8,
): PseoPageRecord[] {
  const index = getLinkingIndex(all);
  const out: PseoPageRecord[] = [];
  const seen = new Set<string>([current.id]);

  for (const slug of current.relatedSlugs) {
    const related = index.bySlug.get(slug);
    if (related?.route.type !== current.route.type) continue;
    if (related && !seen.has(related.id)) {
      out.push(related);
      seen.add(related.id);
    }
  }

  if (current.route.type === "tool") {
    const { category } = current.route;
    const sameCategory = index.toolsByCategory.get(category) ?? [];
    for (const p of sameCategory) {
      if (out.length >= limit) break;
      if (seen.has(p.id)) continue;
      out.push(p);
      seen.add(p.id);
    }
  }

  if (current.route.type === "guide") {
    for (const p of index.guides) {
      if (out.length >= limit) break;
      if (seen.has(p.id)) continue;
      out.push(p);
      seen.add(p.id);
    }
  }

  return out.slice(0, limit);
}

export function pseoPathForRecord(page: PseoPageRecord): string {
  if (page.route.type === "guide") {
    return `/guides/${page.slug}`;
  }
  return `/tools/${page.route.category}/${page.slug}`;
}

export function hubPathForToolCategory(categorySlug: string): string {
  return `/tools/${categorySlug}`;
}

export function guideHubPath(): string {
  return "/guides";
}
