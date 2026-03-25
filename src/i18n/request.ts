import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>,
): T {
  const result: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = result[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
      continue;
    }
    result[key] = overrideValue;
  }

  return result as T;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const loaders: Record<string, () => Promise<{ default: unknown }>> = {
    en: () => import("../../messages/en.json"),
    zh: () => import("../../messages/zh.json"),
    es: () => import("../../messages/es.json"),
    pt: () => import("../../messages/pt.json"),
    fr: () => import("../../messages/fr.json"),
    de: () => import("../../messages/de.json"),
    nl: () => import("../../messages/nl.json"),
    it: () => import("../../messages/it.json"),
    ja: () => import("../../messages/ja.json"),
    tr: () => import("../../messages/tr.json"),
    az: () => import("../../messages/az.json"),
    ko: () => import("../../messages/ko.json"),
    ar: () => import("../../messages/ar.json"),
    fa: () => import("../../messages/fa.json"),
    ru: () => import("../../messages/ru.json"),
    he: () => import("../../messages/he.json"),
    el: () => import("../../messages/el.json"),
  };

  const load = loaders[locale];
  if (!load) {
    throw new Error(
      `Missing messages loader for locale "${locale}". Add it to src/i18n/request.ts`,
    );
  }
  const localeMessages = (await load()).default as Record<string, unknown>;
  const enLoader = loaders.en;
  if (!enLoader) {
    throw new Error('Missing `en` messages loader in src/i18n/request.ts');
  }
  const enMessages = (await enLoader()).default as Record<string, unknown>;

  // Locale values win; missing keys fall back to English.
  const messages = deepMerge(
    enMessages,
    localeMessages as Partial<typeof enMessages>,
  );

  return { locale, messages };
});
