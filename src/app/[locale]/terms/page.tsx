import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import {
  LEGAL_TERMS_SECTION_KEYS,
  legalParagraphs,
} from "@/lib/legal-sections";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return {
    title: `${t("termsTitle")} · ${siteConfig.name}`,
    description: t("termsDescription", { name: siteConfig.name }),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <div className="container max-w-3xl py-10 pb-16">
      <header className="border-border border-b pb-8">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {t("kicker")}
        </p>
        <h1 className={cn(toolHeroTitleClassName, "mt-2")}>
          {t("termsTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
          {t("termsBody", { name: siteConfig.name, url: siteConfig.url })}
        </p>
        <p className="mt-4 text-muted-foreground text-xs">
          {t("lastUpdatedLine")}
        </p>
      </header>

      <div className="mt-10 space-y-10 text-muted-foreground text-sm leading-relaxed">
        {LEGAL_TERMS_SECTION_KEYS.map(([titleKey, bodyKey]) => {
          const body = t(bodyKey, {
            name: siteConfig.name,
            url: siteConfig.url,
          });
          return (
            <section
              key={bodyKey}
              className="space-y-3"
              aria-labelledby={bodyKey}
            >
              <h2
                id={bodyKey}
                className="font-medium text-base text-foreground"
              >
                {t(titleKey)}
              </h2>
              <div className="space-y-3">
                {legalParagraphs(body).map((paragraph, index) => (
                  <p key={`${bodyKey}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          );
        })}

        <nav className="flex flex-wrap gap-x-6 gap-y-2 border-border border-t pt-8 text-foreground text-sm">
          <Link
            className="underline underline-offset-2"
            href="/"
            locale={locale}
          >
            {t("backToViewer")}
          </Link>
          <Link
            className="underline underline-offset-2"
            href="/privacy"
            locale={locale}
          >
            {t("privacyLink")}
          </Link>
        </nav>
      </div>
    </div>
  );
}
