import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type AppLocale, routing } from "@/i18n/routing";
import {
  buildImageConvertPairKeywords,
  buildImageConvertPairSlug,
  formatDisplayLabel,
  type ImageConvertFromSlug,
  type ImageConvertOutputSlug,
  imageConvertPairTitle,
} from "@/lib/image/image-convert-pairs";

import { buildPageMetadata } from "./metadata";
import { getToolPageDescription } from "./tool-page-metadata";

function parsePipeKeywords(raw: string): string[] | undefined {
  const list = raw
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

export function getImageConvertPairMetaDescription(
  locale: string,
  from: ImageConvertFromSlug,
  to: ImageConvertOutputSlug,
): string {
  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;
  const title = imageConvertPairTitle(safeLocale, from, to);
  return getToolPageDescription(safeLocale, title);
}

export async function buildImageConvertPairMetadata(
  locale: string,
  from: ImageConvertFromSlug,
  to: ImageConvertOutputSlug,
): Promise<Metadata> {
  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;
  const title = imageConvertPairTitle(safeLocale, from, to);
  const description = getImageConvertPairMetaDescription(locale, from, to);
  const pairSlug = buildImageConvertPairSlug(from, to);
  const pathname = `/image-convert/${pairSlug}`;
  const fromL = formatDisplayLabel(from);
  const toL = formatDisplayLabel(to);

  const t = await getTranslations({
    locale: safeLocale,
    namespace: "imageConvertPair",
  });
  const kwRaw = t("keywordsLine", { from: fromL, to: toL }).trim();
  const fallbackKw = buildImageConvertPairKeywords(from, to);
  const keywords =
    kwRaw.length > 0 ? (parsePipeKeywords(kwRaw) ?? fallbackKw) : fallbackKw;

  return buildPageMetadata({
    locale: safeLocale,
    pathname,
    title,
    description,
    keywords,
  });
}
