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
  /** Localized path without domain, e.g. `/guides/my-topic` */
  pathname: string;
  title: string;
  description: string;
  keywords?: string[];
  /** Canonical locale for this resource (defaults to `locale`) */
  canonicalLocale?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Disable alternate language links when content is language-specific only */
  alternateLocales?: boolean;
  /** Relative OG/Twitter image path on this site */
  ogImagePath?: string;
  noindex?: boolean;
}

/**
 * Consistent metadata: canonical, hreflang alternates, Open Graph, Twitter.
 */
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
    ogImagePath = "/og.png",
    noindex = false,
  } = input;

  const canonicalUrl = buildAbsoluteUrl(canonicalLocale, pathname);
  const base = normalizeSiteBase();
  const ogImageUrl = `${base}${ogImagePath.startsWith("/") ? ogImagePath : `/${ogImagePath}`}`;

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

/** For Layout `metadataBase` resolution of relative OG image URLs. */
export function metadataPathForLocale(
  locale: string,
  pathname: string,
): string {
  return buildLocalizedPath(locale, pathname);
}
