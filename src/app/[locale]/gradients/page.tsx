import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shell";
import { ColorGradientApp } from "@/app/components/color-gradients-app";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/config/site";
import {
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildJsonLdGraph,
  buildSoftwareApplicationJsonLd,
} from "@/lib/seo/schema";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";

interface GradientsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: GradientsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const pathname = "/gradients";
  return buildPageMetadata({
    locale,
    canonicalLocale: routing.defaultLocale,
    alternateLocales: false,
    pathname,
    title: `Gradients · ${siteConfig.name}`,
    description:
      "Create trending gradients from any base color. Lock stops, copy CSS, and export PNG/JSON with quick contrast guidance per stop.",
    keywords: [
      "gradient generator",
      "trending gradients",
      "css linear-gradient",
      "color stops",
      "gradient export png",
      "accessibility contrast",
    ],
  });
}

export default async function GradientsPage({ params }: GradientsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pathname = "/gradients";
  const url = buildAbsoluteUrl(locale, pathname);

  const faq = [
    {
      question: "Can I lock a stop and regenerate the gradient?",
      answer:
        "Yes. Click the lock icon on any stop to keep it fixed while you change harmony mode, base color, or sliders.",
    },
    {
      question: "How does contrast guidance work here?",
      answer:
        "For each stop we compute the best text color (black/white) using WCAG contrast ratio, and show an AA/AAA badge.",
    },
    {
      question: "What can I export?",
      answer:
        "Copy CSS linear-gradient, and download PNG, JSON, and a CSS file containing variables + the full gradient.",
    },
  ];

  const breadcrumb = buildBreadcrumbListJsonLd([
    { name: "Home", url: buildAbsoluteUrl(locale, "/") },
    { name: "Gradients", url: buildAbsoluteUrl(locale, "/gradients") },
  ]);

  const graph = buildJsonLdGraph([
    breadcrumb as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: "Gradient Generator",
      description:
        "Generate trending gradients from any base color with lockable stops and PNG/CSS/JSON export.",
      url,
      applicationCategory: "BusinessApplication",
    }) as unknown as Record<string, unknown>,
    buildFaqPageJsonLd(faq) as unknown as Record<string, unknown>,
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <Shell>
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

