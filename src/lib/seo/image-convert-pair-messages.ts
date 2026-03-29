import { getTranslations } from "next-intl/server";

import { type AppLocale, routing } from "@/i18n/routing";

export async function getImageConvertPairLocalizedCopy(
  locale: string,
  fromLabel: string,
  toLabel: string,
): Promise<{
  subtitle: string;
  introParagraphs: string[];
  faqs: { question: string; answer: string }[];
}> {
  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: safeLocale,
    namespace: "imageConvertPair",
  });
  const v = { from: fromLabel, to: toLabel };
  return {
    subtitle: t("subtitle", v),
    introParagraphs: [t("intro1", v), t("intro2", v)],
    faqs: [
      { question: t("faq1Question", v), answer: t("faq1Answer", v) },
      { question: t("faq2Question", v), answer: t("faq2Answer", v) },
      { question: t("faq3Question", v), answer: t("faq3Answer", v) },
    ],
  };
}
