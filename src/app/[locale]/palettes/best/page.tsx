import type { Metadata } from "next";
import * as React from "react";
import { setRequestLocale } from "next-intl/server";

import { Shell } from "@/components/shell";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";
import BestPalettesContent from "./best-palettes-content";

interface BestPalettesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: BestPalettesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const pathname = "/palettes/best";

  return buildPageMetadata({
    locale,
    canonicalLocale: routing.defaultLocale,
    alternateLocales: false,
    pathname,
    title: `Best color palettes · ${siteConfig.name}`,
    description:
      "Browse 500 curated, accessibility-friendly color palettes and instantly reuse any palette in the generator.",
    keywords: ["best color palettes", "color palette generator", "hex palette"],
  });
}

export default async function BestPalettesPage({
  params,
}: BestPalettesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Best color palettes
          </h1>
          <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
            Curated to look distinct and keep readable contrast. Pick any card to
            reuse it in the palette generator.
          </p>
        </header>

        <React.Suspense
          fallback={
            <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
              Loading best palettes...
            </div>
          }
        >
          <BestPalettesContent locale={locale} />
        </React.Suspense>
      </div>
    </Shell>
  );
}

