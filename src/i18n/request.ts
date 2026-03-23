import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import en from "../../messages/en.json";
import { getLocaleNavPseoExtras } from "./locale-nav-pseo-extras";
import { localeOverrides } from "./locale-overrides";
import { mergeLocaleMessages } from "./merge-messages";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const base = en as Record<string, unknown>;
  if (locale === routing.defaultLocale) {
    return { locale, messages: en };
  }

  const override =
    locale in localeOverrides
      ? localeOverrides[locale as keyof typeof localeOverrides]
      : null;
  let messages: typeof en = override
    ? (mergeLocaleMessages(
        base,
        override as Record<string, unknown>,
      ) as typeof en)
    : en;

  const navPseoExtras = getLocaleNavPseoExtras(locale);
  if (navPseoExtras) {
    messages = mergeLocaleMessages(
      messages as unknown as Record<string, unknown>,
      navPseoExtras,
    ) as typeof en;
  }

  return { locale, messages };
});
