import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import { Shell } from "@/components/shell";
import { ColorPaletteTrendingApp } from "@/app/components/color-palette-trending-app";
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

interface PaletteTrendingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PaletteTrendingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const pathname = "/palettes/trending";

  return buildPageMetadata({
    locale,
    canonicalLocale: routing.defaultLocale,
    alternateLocales: false,
    pathname,
    title: `Trending color palettes · ${siteConfig.name}`,
    description:
      "Generate trending color palettes from any base color. Lock swatches, copy hex and CSS variables, and export to PNG/JSON with quick accessibility contrast guidance.",
    keywords: [
      "color palette generator",
      "trending color palettes",
      "hex color palette",
      "css variables",
      "accessibility contrast",
      "color theory",
    ],
  });
}

export default async function PaletteTrendingPage({
  params,
}: PaletteTrendingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pathname = "/palettes/trending";
  const url = buildAbsoluteUrl(locale, pathname);

  const faq = [
    {
      question: "Can I lock a color and re-generate the rest?",
      answer:
        "Yes. Use the lock button on any swatch to keep it fixed while you shuffle or change harmony mode.",
    },
    {
      question: "Does the tool help with accessibility contrast?",
      answer:
        "For each color, we show the best text color (black/white) based on WCAG contrast ratio and a quick AA/AAA badge.",
    },
    {
      question: "What can I export from the palette?",
      answer:
        "You can copy CSS variables, and download a PNG image or a JSON file with the palette hex values.",
    },
  ];

  const breadcrumb = buildBreadcrumbListJsonLd([
    { name: "Home", url: buildAbsoluteUrl(locale, "/") },
    { name: "Palettes", url: buildAbsoluteUrl(locale, "/palettes/trending") },
  ]);

  const graph = buildJsonLdGraph([
    breadcrumb as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: "Color Palettes Generator",
      description:
        "Generate trending color palettes from any base color with lock swatches, copy, and PNG/JSON export.",
      url,
      applicationCategory: "BusinessApplication",
    }) as unknown as Record<string, unknown>,
    buildFaqPageJsonLd(faq) as unknown as Record<string, unknown>,
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <Shell>
        <ColorPaletteTrendingApp />
      </Shell>
    </>
  );
}

