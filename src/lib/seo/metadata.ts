import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import {
  buildAbsoluteUrl,
  buildLocalizedPath,
  normalizeSiteBase,
  openGraphLocaleForSeo,
} from "./paths";

export interface BuildPageMetadataInput {
  locale: string;
  pathname: string;
  title: string;
  description: string;
  keywords?: string[];
  canonicalLocale?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  alternateLocales?: boolean;
  ogImagePath?: string;
  noindex?: boolean;
}

function normalizeOgText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function truncateForOgQuery(raw: string, maxChars: number): string {
  const s = normalizeOgText(raw);
  if (s.length <= maxChars) return s;
  return `${s.slice(0, Math.max(0, maxChars - 3))}...`;
}

/**
 * shadcn/ui-style OG image URL:
 * `https://example.com/og?title=...&description=...`
 */
export function buildOgImageUrl(title: string, description: string): string {
  const base = normalizeSiteBase();
  const safeTitle = truncateForOgQuery(title, 80);
  const safeDescription = truncateForOgQuery(description, 160);
  return `${base}/og?title=${encodeURIComponent(safeTitle)}&description=${encodeURIComponent(safeDescription)}`;
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const {
    locale,
    pathname,
    title,
    description,
    keywords,
    canonicalLocale = locale,
    type = "website",
    publishedTime,
    modifiedTime,
    alternateLocales = true,
    ogImagePath = "/og",
    noindex = false,
  } = input;

  const canonicalUrl = buildAbsoluteUrl(canonicalLocale, pathname);
  const base = normalizeSiteBase();
  const ogImageUrl =
    ogImagePath === "/og"
      ? buildOgImageUrl(title, description)
      : `${base}${ogImagePath.startsWith("/") ? ogImagePath : `/${ogImagePath}`}`;

  const languages: Record<string, string> | undefined = alternateLocales
    ? {
        ...Object.fromEntries(
          routing.locales.map((loc) => [loc, buildAbsoluteUrl(loc, pathname)]),
        ),
        "x-default": buildAbsoluteUrl(routing.defaultLocale, pathname),
      }
    : undefined;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: type === "article" ? "article" : "website",
      url: canonicalUrl,
      title,
      description,
      siteName: siteConfig.name,
      locale: openGraphLocaleForSeo(canonicalLocale),
      publishedTime,
      modifiedTime,
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export function metadataPathForLocale(
  locale: string,
  pathname: string,
): string {
  return buildLocalizedPath(locale, pathname);
}
