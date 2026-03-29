/**
 * Seeds `toolMeta` in messages/en.json from code fallbacks (titles, descriptions, keywords).
 * Run: pnpm exec tsx scripts/seed-tool-meta-en.ts && pnpm run messages:sync
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AppLocale } from "../src/i18n/routing.ts";
import { routing } from "../src/i18n/routing.ts";
import {
  ALL_TOOL_PAGE_SLUGS,
  getToolPageMetaFallback,
} from "../src/lib/seo/tool-page-metadata.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enPath = path.join(__dirname, "..", "messages", "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8")) as Record<
  string,
  unknown
>;

const locale = routing.defaultLocale as AppLocale;
const toolMeta: Record<
  string,
  { title: string; description: string; keywords: string }
> = {};

for (const slug of ALL_TOOL_PAGE_SLUGS) {
  const fb = getToolPageMetaFallback(locale, slug);
  toolMeta[slug] = {
    title: fb.title,
    description: fb.description,
    keywords: fb.keywords.join(" | "),
  };
}

en.toolMeta = toolMeta;
fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`);

console.log(
  `Wrote toolMeta for ${ALL_TOOL_PAGE_SLUGS.length} tools to en.json`,
);
