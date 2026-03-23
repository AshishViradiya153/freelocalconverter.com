import { siteConfig } from "@/config/site";
import { OPEN_GRAPH_LOCALE } from "@/i18n/open-graph-locale";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export function normalizeSiteBase(): string {
  return siteConfig.url.replace(/\/$/, "");
}

/**
 * Path with optional locale prefix (`localePrefix: as-needed` from next-intl).
 * `pathname` must start with `/` (e.g. `/guides/slug`).
 */
export function buildLocalizedPath(locale: string, pathname: string): string {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) {
    return p;
  }
  return `/${locale}${p}`;
}

export function buildAbsoluteUrl(locale: string, pathname: string): string {
  const base = normalizeSiteBase();
  const localized = buildLocalizedPath(locale, pathname);
  if (localized === "/") {
    return `${base}/`;
  }
  return `${base}${localized}`;
}

export function openGraphLocaleForSeo(locale: string): string {
  if (locale in OPEN_GRAPH_LOCALE) {
    return OPEN_GRAPH_LOCALE[locale as AppLocale];
  }
  return `${locale}_${locale.toUpperCase()}`;
}
