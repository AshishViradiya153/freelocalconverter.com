import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ColorGradientApp } from "@/app/components/color-gradients-app";
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

interface GradientsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: GradientsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetaFromMessages({
    locale,
    pathname: "/gradients",
    group: "gradients",
  });
}

export default async function GradientsPage({ params }: GradientsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pathname = "/gradients";
  const url = buildAbsoluteUrl(locale, pathname);

  const faq = await getPageMetaFaqTriples(locale, "gradients");

  const t = await getTranslations({ locale, namespace: "pageMeta" });
  const tr = t as unknown as (id: string) => string;

  const breadcrumb = buildBreadcrumbListJsonLd([
    { name: tr("breadcrumbHome"), url: buildAbsoluteUrl(locale, "/") },
    { name: tr("gradients.breadcrumbLabel"), url: buildAbsoluteUrl(locale, pathname) },
  ]);

  const graph = buildJsonLdGraph([
    breadcrumb as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: tr("gradients.jsonLdName"),
      description: tr("gradients.jsonLdDescription"),
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
            <div className="container flex flex-col gap-4 py-4">
              <div className="h-10 w-[min(520px,100%)] animate-pulse rounded-md bg-muted/40" />
              <div className="h-24 w-full animate-pulse rounded-xl bg-muted/30" />
              <div className="h-[380px] w-full animate-pulse rounded-xl bg-muted/20" />
            </div>
          }
        >
          <ColorGradientApp />
        </Suspense>
      </Shell>
    </>
  );
}
