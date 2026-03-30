import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import * as React from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shell";
import {
  ToolSectionHeading,
  toolHeroTitleClassName,
} from "@/components/tool-ui";
import { Link } from "@/i18n/navigation";
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
import { MeshGradientTrendingContent } from "./mesh-gradient-trending-content";

interface MeshGradientTrendingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: MeshGradientTrendingPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetaFromMessages({
    locale,
    pathname: "/gradient-generator/trending",
    group: "meshGradientTrending",
  });
}

export default async function MeshGradientTrendingPage({
  params,
}: MeshGradientTrendingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pathname = "/gradient-generator/trending";
  const url = buildAbsoluteUrl(locale, pathname);
  const generatorPath = "/gradient-generator";
  const faq = await getPageMetaFaqTriples(locale, "meshGradientTrending");

  const t = await getTranslations({ locale, namespace: "pageMeta" });
  const tr = t as unknown as (id: string) => string;
  const tp = await getTranslations({ locale, namespace: "pseo" });

  const breadcrumb = buildBreadcrumbListJsonLd([
    { name: tr("breadcrumbHome"), url: buildAbsoluteUrl(locale, "/") },
    {
      name: tr("meshGradient.breadcrumbLabel"),
      url: buildAbsoluteUrl(locale, generatorPath),
    },
    {
      name: tr("meshGradientTrending.breadcrumbLabel"),
      url: buildAbsoluteUrl(locale, pathname),
    },
  ]);

  const graph = buildJsonLdGraph([
    breadcrumb as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: tr("meshGradientTrending.jsonLdName"),
      description: tr("meshGradientTrending.jsonLdDescription"),
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
          <header className="flex flex-col gap-2">
            <h1 className={toolHeroTitleClassName}>
              {tr("meshGradientTrending.h1")}
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
              {tr("meshGradientTrending.intro")}
            </p>
            <div className="flex flex-col gap-2">
              <p>
                <Link
                  href={generatorPath}
                  className="text-primary text-sm underline-offset-4 hover:underline"
                >
                  {tr("meshGradientTrending.linkToGenerator")}
                </Link>
              </p>
            </div>
          </header>

          <React.Suspense
            fallback={
              <div className="rounded-xl bg-muted/30 p-4 text-muted-foreground text-sm">
                {tr("meshGradientTrending.loadingFallback")}
              </div>
            }
          >
            <MeshGradientTrendingContent
              openLabel={tr("meshGradientTrending.openInGenerator")}
              downloadLabel={tr("meshGradientTrending.downloadPng")}
            />
          </React.Suspense>

          <section
            className="max-w-3xl border-border border-t pt-10"
            aria-labelledby="mesh-trending-faq-heading"
          >
            <ToolSectionHeading id="mesh-trending-faq-heading">
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
