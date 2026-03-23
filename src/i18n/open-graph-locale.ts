import type { AppLocale } from "./routing";

/** Open Graph `og:locale` uses `language_TERRITORY` with an underscore. */
export const OPEN_GRAPH_LOCALE: Record<AppLocale, string> = {
  en: "en_US",
  zh: "zh_CN",
  es: "es_ES",
  pt: "pt_BR",
  fr: "fr_FR",
  de: "de_DE",
  nl: "nl_NL",
  it: "it_IT",
  ja: "ja_JP",
  tr: "tr_TR",
  az: "az_AZ",
  ko: "ko_KR",
  ar: "ar_SA",
  fa: "fa_IR",
  ru: "ru_RU",
  he: "he_IL",
  el: "el_GR",
};
