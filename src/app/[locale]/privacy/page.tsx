import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
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
    title: `${t("privacyTitle")} · ${siteConfig.name}`,
    description: t("privacyDescription", { name: siteConfig.name }),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });
  const marketing = await getTranslations({ locale, namespace: "marketing" });

  return (
    <div className="container max-w-3xl py-10 pb-16">
      <header className="border-border border-b pb-8">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {t("kicker")}
        </p>
        <h1 className={cn(toolHeroTitleClassName, "mt-2")}>
          {t("privacyTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
          {marketing("privacyBody")}
        </p>
        <p className="mt-4 text-muted-foreground text-xs">
          {t("lastUpdatedLine")}
        </p>
      </header>

      <div className="mt-10 space-y-10 text-muted-foreground text-sm leading-relaxed">
        <section className="space-y-3" aria-labelledby="privacy-notice">
          <h2
            id="privacy-notice"
            className="font-medium text-base text-foreground"
          >
            {t("privacyNoticeTitle")}
          </h2>
          <p>{t("privacyNoticeBody", { name: siteConfig.name })}</p>
        </section>

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
            href="/terms"
            locale={locale}
          >
            {t("termsLink")}
          </Link>
        </nav>
      </div>
    </div>
  );
}
