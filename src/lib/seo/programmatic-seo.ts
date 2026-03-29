/**
 * Programmatic SEO architecture (registry + scale)
 *
 * 1. **Structured records + messages** – `PseoPageRecord` / image pair slugs; tool routes use
 *    `messages/*/toolMeta.{slug}.{title|description|keywords}` (pipe-separated keywords). CI:
 *    `pnpm validate:pseo`, `node scripts/validate-tool-meta-locales.mjs`, image pair copy under
 *    `imageConvertPair.*`.
 *
 * 2. **Templates** – Render through `GuidePageTemplate`, `ToolLandingPageTemplate`, and
 *    category hubs so headings, FAQs, and JSON-LD stay consistent.
 *
 * 3. **Sitemaps** – High-volume URLs belong in chunked XML (`/sitemaps/pseo.xml`), not the
 *    root `sitemap.xml`. See `getProgrammaticSitemapTotalUrlCount` and chunk routes.
 *
 * 4. **Build caps** – `PSEO_PREBUILD_LEAF_PER_LOCALE` limits `generateStaticParams`; long-tail
 *    URLs remain valid on demand.
 *
 * 5. **Internal linking** – Use `pickRelatedPseoPages` and `pickRelatedImageConvertPairs` for
 *    hub-and-spoke patterns; set explicit `relatedSlugs` on registry pages when intent overlaps.
 */

export {};
