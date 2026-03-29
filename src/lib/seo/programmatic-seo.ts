/**
 * Programmatic SEO system (structured data → templates → scale)
 *
 * ## Data layer
 * - **Registry** – `src/data/pseo/pages.ts` exports `rawPseoPages`; `PseoPageRecord` in
 *   `src/lib/pseo/types.ts` holds unique `primaryKeyword`, sections, FAQs, `relatedSlugs`.
 * - **Validation** – Importing `src/lib/pseo/registry.ts` runs Zod (`validation.ts`),
 *   cannibalization checks (`cannibalization.ts`), fingerprint / word-count guards
 *   (`uniqueness.ts`), and related-slug resolution. CI: `pnpm validate:pseo`.
 * - **Tool marketing pages** – Per-locale `toolMeta.{slug}` in `messages/`; fallbacks in
 *   `tool-page-metadata.ts`. CI: `validate-tool-meta-locales.mjs`, image pair copy under
 *   `imageConvertPair.*`.
 *
 * ## Templates & routing
 * - **Guides** – `GuidePageTemplate` → Article + HowTo + FAQPage + BreadcrumbList JSON-LD.
 * - **Tool landings** – `ToolLandingPageTemplate` → SoftwareApplication + FAQPage + Breadcrumbs.
 * - **Hubs** – `ToolCategoryHubTemplate`; linking helpers in `src/lib/seo/linking.ts`
 *   (`pickRelatedPseoPages`, `pickRelatedImageConvertPairs`, hub paths).
 *
 * ## Metadata
 * - Use `buildPageMetadata` (`metadata.ts`) for canonical, hreflang, Open Graph, Twitter.
 * - pSEO leaves set `alternateLocales: false` + `canonicalLocale: default` when English-only
 *   body copy is intentional (see `[locale]/tools/.../page.tsx`).
 *
 * ## Sitemaps (superfa.st–style index chain)
 * - **`/sitemap.xml`** – Sitemap **index** only: points at `/sitemaps/static.xml` and, when
 *   programmatic URLs exist, `/sitemaps/pseo.xml` (`src/app/sitemap.xml/route.ts`,
 *   `src/lib/sitemap/root-index.ts`).
 * - **`/sitemaps/static.xml`** – Urlset for marketing routes, category hubs, blog (`static-entries.ts`).
 * - **`/sitemaps/pseo.xml`** – Index of chunked urlsets `/sitemaps/pseo/{n}.xml` (≤50k URLs each,
 *   lazy `entryForFlatIndex` in `src/lib/pseo/sitemap.ts`).
 * - **`robots.ts`** – Single `Sitemap:` line to the root index; crawlers discover children.
 *
 * ## Build & runtime at very large counts
 * - **`PSEO_PREBUILD_LEAF_PER_LOCALE`** (`src/lib/pseo/config.ts`) caps `generateStaticParams`;
 *   remaining URLs stay valid on demand (ISR/SSR per deployment).
 * - Prefer **shared modules** for sitemap XML (`escapeXmlForSitemap`) and URL builders to avoid
 *   drift between discovery documents.
 *
 * ## Adding pages safely
 * 1. Add a `PseoPageRecord` (or tool route + messages) with unique primary keyword and body.
 * 2. Set `relatedSlugs` where intents overlap to reinforce hub-and-spoke and reduce cannibalization.
 * 3. Run `pnpm validate:pseo` and message validators.
 * 4. For new **top-level** app URLs, append `STATIC_SITEMAP_PATH_SEGMENTS` in `static-entries.ts`.
 */

export {};
