import type { Metadata } from "next";
import * as React from "react";
import { setRequestLocale } from "next-intl/server";

import { Shell } from "@/components/shell";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";
import BestGradientsContent from "./best-gradients-content";

interface BestGradientsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: BestGradientsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const pathname = "/gradients/best";

  return buildPageMetadata({
    locale,
    canonicalLocale: routing.defaultLocale,
    alternateLocales: false,
    pathname,
    title: `Best gradients · ${siteConfig.name}`,
    description:
      "Browse 500 curated, accessibility-friendly gradients and instantly reuse any gradient in the generator.",
    keywords: ["best gradients", "gradient generator", "linear-gradient"],
  });
}

export default async function BestGradientsPage({
  params,
}: BestGradientsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Best gradients
          </h1>
          <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
            Curated to be distinct and keep readable contrast across stops. Pick
            any card to reuse it in the gradient generator.
          </p>
        </header>

        <React.Suspense
          fallback={
            <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
              Loading best gradients...
            </div>
          }
        >
          <BestGradientsContent locale={locale} />
        </React.Suspense>
      </div>
    </Shell>
  );
}

