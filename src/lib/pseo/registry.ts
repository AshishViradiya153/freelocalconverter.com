import { rawPseoPages } from "@/data/pseo/pages";
import { toolCategories } from "@/data/pseo/tool-categories";
import { assertNoKeywordCannibalization } from "./cannibalization";
import type { PseoPageRecord, PseoRoute } from "./types";
import {
  assertContentFingerprintsUnique,
  assertMinimumWordCount,
} from "./uniqueness";
import { validatePseoRegistry } from "./validation";

function assertRouteMatchesTemplate(p: PseoPageRecord) {
  if (p.template === "guide" && p.route.type !== "guide") {
    throw new Error(
      `pSEO route mismatch: ${p.id} template guide but route is not`,
    );
  }
  if (p.template === "tool" && p.route.type !== "tool") {
    throw new Error(
      `pSEO route mismatch: ${p.id} template tool but route is not`,
    );
  }
}

function isToolRoute(
  route: PseoRoute,
): route is Extract<PseoRoute, { type: "tool" }> {
  return route.type === "tool";
}

function assertToolCategoryExists(p: PseoPageRecord) {
  const route = p.route;
  if (!isToolRoute(route)) return;
  const ok = toolCategories.some((c) => c.slug === route.category);
  if (!ok) {
    throw new Error(
      `pSEO unknown tool category "${route.category}" for page "${p.id}"`,
    );
  }
}

function assertRelatedSlugsResolvable(pages: readonly PseoPageRecord[]) {
  const slugs = new Set(pages.map((p) => p.slug));
  for (const p of pages) {
    for (const r of p.relatedSlugs) {
      if (!slugs.has(r)) {
        throw new Error(
          `pSEO broken relatedSlugs: "${p.id}" references missing slug "${r}"`,
        );
      }
    }
  }
}

function assertGloballyUniqueSlugs(pages: readonly PseoPageRecord[]) {
  const seen = new Map<string, string>();
  for (const p of pages) {
    const existing = seen.get(p.slug);
    if (existing) {
      throw new Error(
        `pSEO duplicate slug "${p.slug}" on pages "${existing}" and "${p.id}"`,
      );
    }
    seen.set(p.slug, p.id);
  }
}

const validated = validatePseoRegistry(rawPseoPages as unknown[]);
for (const p of validated) {
  assertRouteMatchesTemplate(p);
  assertToolCategoryExists(p);
}
assertGloballyUniqueSlugs(validated);
assertRelatedSlugsResolvable(validated);
assertNoKeywordCannibalization(validated);
assertContentFingerprintsUnique(validated);
assertMinimumWordCount(validated);

const bySlugGuide = new Map<string, PseoPageRecord>();
const byToolPath = new Map<string, PseoPageRecord>();

for (const p of validated) {
  if (p.route.type === "guide") {
    bySlugGuide.set(p.slug, p);
  } else {
    byToolPath.set(`${p.route.category}/${p.slug}`, p);
  }
}

export const pseoPages: readonly PseoPageRecord[] = validated;

export function getPseoGuideBySlug(slug: string): PseoPageRecord | undefined {
  return bySlugGuide.get(slug);
}

export function getPseoToolPage(
  category: string,
  slug: string,
): PseoPageRecord | undefined {
  return byToolPath.get(`${category}/${slug}`);
}

export function listPseoGuides(): PseoPageRecord[] {
  return validated.filter((p) => p.route.type === "guide");
}

export function listPseoToolsInCategory(category: string): PseoPageRecord[] {
  return validated.filter(
    (p) => p.route.type === "tool" && p.route.category === category,
  );
}

export function listPseoToolCategoriesInUse(): string[] {
  const set = new Set<string>();
  for (const p of validated) {
    if (p.route.type === "tool") {
      set.add(p.route.category);
    }
  }
  return [...set].sort();
}
