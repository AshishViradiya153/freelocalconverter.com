import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { MeshGradientApp } from "@/app/components/mesh-gradient-app";
import { HubDiscoveryLinks } from "@/components/seo/hub-discovery-links";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shell";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { buildPageMetaFromMessages } from "@/lib/seo/page-meta-messages";
import {
  buildBreadcrumbListJsonLd,
  buildJsonLdGraph,
  buildSoftwareApplicationJsonLd,
} from "@/lib/seo/schema";

interface GradientGeneratorPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: GradientGeneratorPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetaFromMessages({
    locale,
    pathname: "/gradient-generator",
    group: "meshGradient",
  });
}

export default async function GradientGeneratorPage({
  params,
}: GradientGeneratorPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pathname = "/gradient-generator";
  const url = buildAbsoluteUrl(locale, pathname);

  const t = await getTranslations({ locale, namespace: "pageMeta" });
  const tr = t as unknown as (id: string) => string;

  const breadcrumb = buildBreadcrumbListJsonLd([
    { name: tr("breadcrumbHome"), url: buildAbsoluteUrl(locale, "/") },
    {
      name: tr("meshGradient.breadcrumbLabel"),
      url: buildAbsoluteUrl(locale, pathname),
    },
  ]);

  const graph = buildJsonLdGraph([
    breadcrumb as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: tr("meshGradient.jsonLdName"),
      description: tr("meshGradient.jsonLdDescription"),
      url,
      applicationCategory: "DesignApplication",
    }) as unknown as Record<string, unknown>,
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
              <div className="h-[min(56vh,520px)] w-full animate-pulse rounded-xl bg-muted/20" />
            </div>
          }
        >
          <MeshGradientApp />
        </Suspense>
      </Shell>
    </>
  );
}
