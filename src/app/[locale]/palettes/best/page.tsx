import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import * as React from "react";

import {
  type BreadcrumbNavItem,
  Breadcrumbs,
} from "@/components/seo/breadcrumbs";
import { HubDiscoveryLinks } from "@/components/seo/hub-discovery-links";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shell";
import {
  ToolSectionHeading,
  toolHeroTitleClassName,
} from "@/components/tool-ui";
import {
  buildPageMetaFromMessages,
  getPageMetaFaqTriples,
} from "@/lib/seo/page-meta-messages";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import {
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildJsonLdGraph,
  buildSoftwareApplicationJsonLd,
} from "@/lib/seo/schema";
import BestPalettesContent from "./best-palettes-content";

interface BestPalettesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: BestPalettesPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetaFromMessages({
    locale,
    pathname: "/palettes/best",
    group: "palettesBest",
  });
}

export default async function BestPalettesPage({
  params,
}: BestPalettesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pathname = "/palettes/best";
  const url = buildAbsoluteUrl(locale, pathname);
  const faq = await getPageMetaFaqTriples(locale, "palettesBest");

  const t = await getTranslations({ locale, namespace: "pageMeta" });
  const tr = t as unknown as (id: string) => string;
  const tp = await getTranslations({ locale, namespace: "pseo" });

  const breadcrumbNav: BreadcrumbNavItem[] = [
    { name: tr("breadcrumbHome"), href: "/" },
    {
      name: tr("palettesTrending.breadcrumbLabel"),
      href: "/palettes/trending",
    },
    { name: tr("palettesBest.breadcrumbLabel") },
  ];

  const graph = buildJsonLdGraph([
    buildBreadcrumbListJsonLd([
      { name: tr("breadcrumbHome"), url: buildAbsoluteUrl(locale, "/") },
      {
        name: tr("palettesTrending.breadcrumbLabel"),
        url: buildAbsoluteUrl(locale, "/palettes/trending"),
      },
      { name: tr("palettesBest.breadcrumbLabel"), url },
    ]) as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: tr("palettesBest.jsonLdName"),
      description: tr("palettesBest.jsonLdDescription"),
      url,
      applicationCategory: "DesignApplication",
    }) as unknown as Record<string, unknown>,
    buildFaqPageJsonLd(faq) as unknown as Record<string, unknown>,
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <Shell>
        <div className="flex flex-col gap-6">
          <Breadcrumbs className="text-sm" items={breadcrumbNav} />
          <header className="flex flex-col gap-2">
            <h1 className={toolHeroTitleClassName}>{tr("palettesBest.h1")}</h1>
            <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
              {tr("palettesBest.intro")}
            </p>
            <HubDiscoveryLinks className="max-w-3xl" locale={locale} />
          </header>

          <React.Suspense
            fallback={
              <div className="rounded-xl bg-muted/30 p-4 text-muted-foreground text-sm">
                {tr("palettesBest.loadingFallback")}
              </div>
            }
          >
            <BestPalettesContent locale={locale} />
          </React.Suspense>

          <section
            className="max-w-3xl border-border border-t pt-10"
            aria-labelledby="palettes-best-faq-heading"
          >
            <ToolSectionHeading id="palettes-best-faq-heading">
              {tp("faqHeading")}
            </ToolSectionHeading>
            <dl className="mt-6 space-y-6">
              {faq.map((item) => (
                <div key={item.question}>
                  <dt className="font-medium text-foreground text-sm">
                    {item.question}
                  </dt>
                  <dd className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </Shell>
    </>
  );
}
