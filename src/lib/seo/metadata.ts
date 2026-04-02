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

export const defaultOgImagePath = "/og.png";

export const defaultOgImageSize = { width: 1200, height: 630 } as const;

export function defaultOgImageUrl(): string {
  const base = normalizeSiteBase();
  return `${base}${defaultOgImagePath}`;
}

export function buildOgImageUrl(title: string, description: string): string {
  const base = normalizeSiteBase();
  const safeTitle = truncateForOgQuery(title, 80);
  const safeDescription = truncateForOgQuery(description, 160);
  return `${base}/og?title=${encodeURIComponent(safeTitle)}&description=${encodeURIComponent(safeDescription)}`;
}

function usesKnownOgDimensions(ogImagePath: string): boolean {
  return ogImagePath === defaultOgImagePath || ogImagePath === "/og";
}

function buildSocialImageEntry(
  ogImageUrl: string,
  ogImagePath: string,
  alt: string,
) {
  if (usesKnownOgDimensions(ogImagePath)) {
    return { url: ogImageUrl, ...defaultOgImageSize, alt };
  }
  return { url: ogImageUrl, alt };
}

export function buildHomeLayoutSocialMetadata(
  locale: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  const ogImageUrl = defaultOgImageUrl();
  const homeUrl = buildAbsoluteUrl(locale, "/");
  const image = buildSocialImageEntry(
    ogImageUrl,
    defaultOgImagePath,
    siteConfig.name,
  );
  return {
    openGraph: {
      type: "website",
      locale: openGraphLocaleForSeo(locale),
      url: homeUrl,
      title: siteConfig.name,
      description: siteConfig.description,
      siteName: siteConfig.name,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [image],
    },
  };
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
    ogImagePath = defaultOgImagePath,
    noindex = false,
  } = input;

  const canonicalUrl = buildAbsoluteUrl(canonicalLocale, pathname);
  const base = normalizeSiteBase();
  const ogImageUrl =
    ogImagePath === "/og"
      ? buildOgImageUrl(title, description)
      : `${base}${ogImagePath.startsWith("/") ? ogImagePath : `/${ogImagePath}`}`;

  const socialImage = buildSocialImageEntry(ogImageUrl, ogImagePath, title);

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
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export function metadataPathForLocale(
  locale: string,
  pathname: string,
): string {
  return buildLocalizedPath(locale, pathname);
}
