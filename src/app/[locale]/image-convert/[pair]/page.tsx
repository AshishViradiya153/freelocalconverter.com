import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ImageConvertApp } from "@/app/components/image-convert-app";
import { Shell } from "@/components/shell";
import { ImageConvertPairProgrammaticSeo } from "@/components/seo/image-convert-pair-programmatic-seo";
import { redirect } from "@/i18n/navigation";
import {
  formatDisplayLabel,
  getAllImageConvertPairs,
  imageConvertPairTitle,
  parseImageConvertPairParam,
  toAppOutputFormat,
} from "@/lib/image/image-convert-pairs";
import { PSEO_PREBUILD_LEAF_PER_LOCALE } from "@/lib/pseo/config";
import {
  buildImageConvertPairMetadata,
  getImageConvertPairMetaDescription,
} from "@/lib/seo/image-convert-pair-metadata";
import { getImageConvertPairLocalizedCopy } from "@/lib/seo/image-convert-pair-messages";
import { pickRelatedImageConvertPairs } from "@/lib/seo/linking";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { type AppLocale, routing } from "@/i18n/routing";

export function generateStaticParams(): { pair: string }[] {
  return getAllImageConvertPairs()
    .slice()
    .sort((a, b) => a.pairSlug.localeCompare(b.pairSlug))
    .slice(0, PSEO_PREBUILD_LEAF_PER_LOCALE)
    .map(({ pairSlug }) => ({ pair: pairSlug }));
}

export async function generateMetadata({
  params,
}: ImageConvertPairPageProps): Promise<Metadata> {
  const { locale, pair } = await params;
  const parsed = parseImageConvertPairParam(pair);
  if (!parsed) {
    notFound();
  }
  const pairKey = pair.trim().toLowerCase();
  if (parsed.pairSlug !== pairKey) {
    redirect({ href: `/image-convert/${parsed.pairSlug}`, locale });
  }
  return await buildImageConvertPairMetadata(locale, parsed.from, parsed.to);
}

interface ImageConvertPairPageProps {
  params: Promise<{ locale: string; pair: string }>;
}

export default async function ImageConvertPairPage({
  params,
}: ImageConvertPairPageProps) {
  const { locale, pair } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pseo");

  const parsed = parseImageConvertPairParam(pair);
  if (!parsed) {
    notFound();
  }

  const pairKey = pair.trim().toLowerCase();
  if (parsed.pairSlug !== pairKey) {
    redirect({ href: `/image-convert/${parsed.pairSlug}`, locale });
  }

  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;
  const title = imageConvertPairTitle(safeLocale, parsed.from, parsed.to);
  const initialFormat = toAppOutputFormat(parsed.to);
  const fromL = formatDisplayLabel(parsed.from);
  const toL = formatDisplayLabel(parsed.to);
  const pairCopy = await getImageConvertPairLocalizedCopy(locale, fromL, toL);
  const metaDescription = getImageConvertPairMetaDescription(
    locale,
    parsed.from,
    parsed.to,
  );
  const relatedPairs = pickRelatedImageConvertPairs(parsed, 8);

  const breadcrumbNav = [
    { name: t("crumbHome"), href: "/" },
    { name: t("crumbImageConverter"), href: "/image-convert" },
    { name: title },
  ];

  const schemaBreadcrumbs = [
    { name: t("crumbHome"), url: buildAbsoluteUrl(locale, "/") },
    {
      name: t("crumbImageConverter"),
      url: buildAbsoluteUrl(locale, "/image-convert"),
    },
    {
      name: title,
      url: buildAbsoluteUrl(locale, `/image-convert/${parsed.pairSlug}`),
    },
  ];

  return (
    <Shell>
      <ImageConvertPairProgrammaticSeo
        locale={locale}
        parsed={parsed}
        title={title}
        metaDescription={metaDescription}
        breadcrumbNav={breadcrumbNav}
        schemaBreadcrumbs={schemaBreadcrumbs}
        relatedPairs={relatedPairs}
        relatedTitle={t("relatedImageConvertTitle")}
        faqHeading={t("faqHeading")}
        introParagraphs={pairCopy.introParagraphs}
        faqs={pairCopy.faqs}
      >
        <Suspense
          fallback={
            <div className="container flex flex-col gap-4 py-4">
              <div className="h-10 w-[min(520px,100%)] animate-pulse rounded-md bg-muted/40" />
              <div className="h-24 w-full animate-pulse rounded-xl bg-muted/30" />
              <div className="h-[380px] w-full animate-pulse rounded-xl bg-muted/20" />
            </div>
          }
        >
          <ImageConvertApp
            key={parsed.pairSlug}
            title={title}
            subtitle={pairCopy.subtitle}
            inputId={`image-convert-${parsed.pairSlug}-input`}
            initialFormat={initialFormat}
          />
        </Suspense>
      </ImageConvertPairProgrammaticSeo>
    </Shell>
  );
}
