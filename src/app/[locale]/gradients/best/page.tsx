import type { Metadata } from "next";
import * as React from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  type BreadcrumbNavItem,
  Breadcrumbs,
} from "@/components/seo/breadcrumbs";
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
import BestGradientsContent from "./best-gradients-content";

interface BestGradientsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: BestGradientsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetaFromMessages({
    locale,
    pathname: "/gradients/best",
    group: "gradientsBest",
  });
}

export default async function BestGradientsPage({
  params,
}: BestGradientsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pathname = "/gradients/best";
  const url = buildAbsoluteUrl(locale, pathname);
  const faq = await getPageMetaFaqTriples(locale, "gradientsBest");

  const t = await getTranslations({ locale, namespace: "pageMeta" });
  const tr = t as unknown as (id: string) => string;
  const tp = await getTranslations({ locale, namespace: "pseo" });

  const breadcrumbNav: BreadcrumbNavItem[] = [
    { name: tr("breadcrumbHome"), href: "/" },
    { name: tr("gradients.breadcrumbLabel"), href: "/gradients" },
    { name: tr("gradientsBest.breadcrumbLabel") },
  ];

  const graph = buildJsonLdGraph([
    buildBreadcrumbListJsonLd([
      { name: tr("breadcrumbHome"), url: buildAbsoluteUrl(locale, "/") },
      {
        name: tr("gradients.breadcrumbLabel"),
        url: buildAbsoluteUrl(locale, "/gradients"),
      },
      { name: tr("gradientsBest.breadcrumbLabel"), url },
    ]) as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: tr("gradientsBest.jsonLdName"),
      description: tr("gradientsBest.jsonLdDescription"),
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
            <h1 className="text-2xl font-semibold tracking-tight">
              {tr("gradientsBest.h1")}
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
              {tr("gradientsBest.intro")}
            </p>
            <HubDiscoveryLinks className="max-w-3xl" locale={locale} />
          </header>

          <React.Suspense
            fallback={
              <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
                {tr("gradientsBest.loadingFallback")}
              </div>
            }
          >
            <BestGradientsContent locale={locale} />
          </React.Suspense>

          <section
            className="max-w-3xl border-border border-t pt-10"
            aria-labelledby="gradients-best-faq-heading"
          >
            <h2
              id="gradients-best-faq-heading"
              className="font-semibold text-foreground text-lg tracking-tight"
            >
              {tp("faqHeading")}
            </h2>
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
