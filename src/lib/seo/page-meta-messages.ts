import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { type AppLocale, routing } from "@/i18n/routing";

import { buildPageMetadata } from "./metadata";

export type PageMetaGroup =
  | "csvViewer"
  | "meshGradient"
  | "meshGradientTrending"
  | "linkedinBanner"
  | "svgToCode"
  | "gradients"
  | "gradientsBest"
  | "palettesTrending"
  | "palettesBest";

interface BuildPageMetaFromMessagesInput {
  locale: string;
  pathname: string;
  group: PageMetaGroup;
  canonicalLocale?: string;
  alternateLocales?: boolean;
}

function parseKeywords(raw: string): string[] | undefined {
  const list = raw
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

/**
 * SEO metadata from the `pageMeta` next-intl namespace (messages/*.json).
 */
export async function buildPageMetaFromMessages(
  input: BuildPageMetaFromMessagesInput,
): Promise<Metadata> {
  const {
    locale,
    pathname,
    group,
    canonicalLocale,
    alternateLocales = true,
  } = input;

  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? locale
    : routing.defaultLocale;

  const t = await getTranslations({
    locale: safeLocale,
    namespace: "pageMeta",
  });
  const tr = t as unknown as (id: string) => string;

  const keywords = parseKeywords(tr(`${group}.keywords`));

  return buildPageMetadata({
    locale: safeLocale,
    ...(canonicalLocale != null ? { canonicalLocale } : {}),
    alternateLocales,
    pathname,
    title: tr(`${group}.title`),
    description: tr(`${group}.description`),
    keywords,
  });
}

/** FAQ triples for JSON-LD and visible FAQ blocks (pageMeta.*). */
export async function getPageMetaFaqTriples(
  locale: string,
  group:
    | "gradients"
    | "palettesTrending"
    | "meshGradientTrending"
    | "gradientsBest"
    | "palettesBest",
): Promise<{ question: string; answer: string }[]> {
  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: safeLocale,
    namespace: "pageMeta",
  });
  const tr = t as unknown as (id: string) => string;

  return [
    {
      question: tr(`${group}.faq1Question`),
      answer: tr(`${group}.faq1Answer`),
    },
    {
      question: tr(`${group}.faq2Question`),
      answer: tr(`${group}.faq2Answer`),
    },
    {
      question: tr(`${group}.faq3Question`),
      answer: tr(`${group}.faq3Answer`),
    },
  ];
}
