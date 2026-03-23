import { routing } from "@/i18n/routing";
import { PSEO_PREBUILD_LEAF_PER_LOCALE } from "./config";
import { listPseoGuides, listPseoToolCategoriesInUse, pseoPages } from "./data";

/** Build-time param sets for `[locale]/guides/[topic]` (Next.js Cache Components). */
export function generatePseoGuideTopicStaticParams() {
  const guides = listPseoGuides()
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, PSEO_PREBUILD_LEAF_PER_LOCALE);
  return routing.locales.flatMap((locale) =>
    guides.map((g) => ({ locale, topic: g.slug })),
  );
}

/** Build-time param sets for `[locale]/tools/[category]`. */
export function generatePseoToolCategoryStaticParams() {
  const categories = listPseoToolCategoriesInUse();
  return routing.locales.flatMap((locale) =>
    categories.map((category) => ({ locale, category })),
  );
}

/** Build-time param sets for `[locale]/tools/[category]/[slug]`. */
export function generatePseoToolLandingStaticParams() {
  const tools = pseoPages
    .filter((p) => p.route.type === "tool")
    .slice()
    .sort((a, b) => {
      if (a.route.type !== "tool" || b.route.type !== "tool") return 0;
      const byCategory = a.route.category.localeCompare(b.route.category);
      if (byCategory !== 0) return byCategory;
      return a.slug.localeCompare(b.slug);
    })
    .slice(0, PSEO_PREBUILD_LEAF_PER_LOCALE);
  return routing.locales.flatMap((locale) =>
    tools.map((p) => {
      const route = p.route;
      if (route.type !== "tool") {
        throw new Error(`Expected tool route for page "${p.id}"`);
      }
      return { locale, category: route.category, slug: p.slug };
    }),
  );
}
