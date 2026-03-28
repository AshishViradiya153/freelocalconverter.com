import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { HomeToolsDirectory } from "@/app/components/home-tools-directory";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import {
  buildJsonLdGraph,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/schema";

interface IndexPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: IndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const tLanding = await getTranslations({ locale, namespace: "landing" });

  return buildPageMetadata({
    locale,
    pathname: "/",
    title: `${tLanding("heroTitle")} · ${siteConfig.name}`,
    description: tLanding("directorySubtitle"),
    canonicalLocale: routing.defaultLocale,
    alternateLocales: false,
    keywords: [
      "csv viewer",
      "csv editor",
      "json converter",
      "pdf tools",
      "image tools",
      "browser file tools",
    ],
  });
}

export default async function IndexPage({ params }: IndexPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tLanding = await getTranslations({ locale, namespace: "landing" });
  const url = buildAbsoluteUrl(locale, "/");
  const graph = buildJsonLdGraph([
    buildOrganizationJsonLd() as unknown as Record<string, unknown>,
    buildWebSiteJsonLd() as unknown as Record<string, unknown>,
    {
      "@type": "CollectionPage",
      name: `${siteConfig.name} Tool Directory`,
      description: tLanding("directorySubtitle"),
      url,
    },
    buildSoftwareApplicationJsonLd({
      name: siteConfig.name,
      description: tLanding("directorySubtitle"),
      url,
      applicationCategory: "UtilitiesApplication",
    }) as unknown as Record<string, unknown>,
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <HomeToolsDirectory />
    </>
  );
}
