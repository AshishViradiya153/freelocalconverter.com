import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { MeshGradientApp } from "@/app/components/mesh-gradient-app";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
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
  const pathname = "/gradient-generator";
  return buildPageMetadata({
    locale,
    canonicalLocale: routing.defaultLocale,
    alternateLocales: false,
    pathname,
    title: `Mesh gradient generator · ${siteConfig.name}`,
    description:
      "Create soft mesh-style gradients from blurred color blobs on canvas. Harmonious palettes, grain, and PNG export.",
    keywords: [
      "mesh gradient",
      "blob gradient",
      "canvas gradient",
      "gradient wallpaper",
      "png gradient",
    ],
  });
}

export default async function GradientGeneratorPage({
  params,
}: GradientGeneratorPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pathname = "/gradient-generator";
  const url = buildAbsoluteUrl(locale, pathname);

  const breadcrumb = buildBreadcrumbListJsonLd([
    { name: "Home", url: buildAbsoluteUrl(locale, "/") },
    {
      name: "Mesh gradient generator",
      url: buildAbsoluteUrl(locale, pathname),
    },
  ]);

  const graph = buildJsonLdGraph([
    breadcrumb as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: "Mesh gradient generator",
      description:
        "Generate soft mesh-style gradients with harmonious colors, blur, and film grain; export PNG.",
      url,
      applicationCategory: "DesignApplication",
    }) as unknown as Record<string, unknown>,
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <Shell>
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
