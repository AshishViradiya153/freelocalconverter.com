import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  type BreadcrumbNavItem,
  Breadcrumbs,
} from "@/components/seo/breadcrumbs";
import { HubLinks } from "@/components/seo/hub-links";
import { JsonLd } from "@/components/seo/json-ld";
import { PseoContentLocaleNotice } from "@/components/seo/pseo-content-locale-notice";
import { toolCategories } from "@/data/pseo/tool-categories";
import { routing } from "@/i18n/routing";
import { hubPathForToolCategory } from "@/lib/seo/linking";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { buildBreadcrumbListJsonLd, buildJsonLdGraph } from "@/lib/seo/schema";

interface ToolsHubPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ToolsHubPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pseo");
  return buildPageMetadata({
    locale,
    pathname: "/tools",
    title: t("toolsHubTitle"),
    description: t("toolsHubDescription"),
    alternateLocales: false,
    canonicalLocale: routing.defaultLocale,
    keywords: ["csv tools", "browser csv", "local csv review"],
  });
}

export default async function ToolsHubPage({ params }: ToolsHubPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pseo");
  const hubUrl = buildAbsoluteUrl(locale, "/tools");

  const breadcrumbNav: BreadcrumbNavItem[] = [
    { name: t("crumbHome"), href: "/" },
    { name: t("crumbTools") },
  ];

  const graph = buildJsonLdGraph([
    buildBreadcrumbListJsonLd([
      { name: t("crumbHome"), url: buildAbsoluteUrl(locale, "/") },
      { name: t("crumbTools"), url: hubUrl },
    ]) as unknown as Record<string, unknown>,
    {
      "@type": "CollectionPage",
      name: t("toolsHubTitle"),
      description: t("toolsHubDescription"),
      url: hubUrl,
    },
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <div className="container max-w-3xl py-10 pb-20">
        <Breadcrumbs items={breadcrumbNav} />
        <div className="mt-4">
          <PseoContentLocaleNotice locale={locale} />
        </div>
        <header className="mt-8 border-border border-b pb-8">
          <h1 className="font-semibold text-3xl tracking-tight">
            {t("toolsHubTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
            {t("toolsHubDescription")}
          </p>
        </header>
        <HubLinks
          className="mt-10 border-0 pt-0"
          title={t("toolsHubSectionsTitle")}
          items={toolCategories.map((c) => ({
            title: c.title,
            description: c.description,
            href: hubPathForToolCategory(c.slug),
          }))}
        />
      </div>
    </>
  );
}
