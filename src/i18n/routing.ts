import { defineRouting } from "next-intl/routing";

/** BCP 47-style codes; `az` = Azerbaijani, `fa` = Persian (Farsi). */
export const routing = defineRouting({
  locales: [
    "en",
    "zh",
    "es",
    "pt",
    "fr",
    "de",
    "nl",
    "it",
    "ja",
    "tr",
    "az",
    "ko",
    "ar",
    "fa",
    "ru",
    "he",
    "el",
  ],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];

export const RTL_LOCALES = new Set<AppLocale>(["ar", "fa", "he"]);
