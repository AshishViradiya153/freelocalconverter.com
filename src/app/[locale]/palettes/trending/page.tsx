import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ColorPaletteTrendingApp } from "@/app/components/color-palette-trending-app";
import { HubDiscoveryLinks } from "@/components/seo/hub-discovery-links";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shell";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import {
  buildPageMetaFromMessages,
  getPageMetaFaqTriples,
} from "@/lib/seo/page-meta-messages";
import {
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildJsonLdGraph,
  buildSoftwareApplicationJsonLd,
} from "@/lib/seo/schema";

interface PaletteTrendingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PaletteTrendingPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetaFromMessages({
    locale,
    pathname: "/palettes/trending",
    group: "palettesTrending",
  });
}

export default async function PaletteTrendingPage({
  params,
}: PaletteTrendingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pathname = "/palettes/trending";
  const url = buildAbsoluteUrl(locale, pathname);

  const faq = await getPageMetaFaqTriples(locale, "palettesTrending");

  const t = await getTranslations({ locale, namespace: "pageMeta" });
  const tr = t as unknown as (id: string) => string;

  const breadcrumb = buildBreadcrumbListJsonLd([
    { name: tr("breadcrumbHome"), url: buildAbsoluteUrl(locale, "/") },
    {
      name: tr("palettesTrending.breadcrumbLabel"),
      url: buildAbsoluteUrl(locale, pathname),
    },
  ]);

  const graph = buildJsonLdGraph([
    breadcrumb as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: tr("palettesTrending.jsonLdName"),
      description: tr("palettesTrending.jsonLdDescription"),
      url,
      applicationCategory: "BusinessApplication",
    }) as unknown as Record<string, unknown>,
    buildFaqPageJsonLd(faq) as unknown as Record<string, unknown>,
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <Shell>
        <div className="container pt-4">
          <HubDiscoveryLinks locale={locale} />
        </div>
        <Suspense
          fallback={
            <div className="container flex flex-col gap-4 py-4 text-sm text-muted-foreground">
              {tr("palettesTrending.loadingFallback")}
            </div>
          }
        >
          <ColorPaletteTrendingApp />
        </Suspense>
      </Shell>
    </>
  );
}
