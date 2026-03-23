import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { BreadcrumbNavItem } from "@/components/seo/breadcrumbs";
import { routing } from "@/i18n/routing";
import { getPseoGuideBySlug, pseoPages } from "@/lib/pseo";
import { generatePseoGuideTopicStaticParams } from "@/lib/pseo/static-params";
import { pickRelatedPseoPages } from "@/lib/seo/linking";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { GuidePageTemplate } from "@/templates/pseo/guide-page";

interface GuideTopicPageProps {
  params: Promise<{ locale: string; topic: string }>;
}

export function generateStaticParams() {
  return generatePseoGuideTopicStaticParams();
}

export async function generateMetadata({
  params,
}: GuideTopicPageProps): Promise<Metadata> {
  const { topic, locale } = await params;
  const page = getPseoGuideBySlug(topic);
  if (!page) {
    return { title: "Not found" };
  }
  const pathname = `/guides/${page.slug}`;
  return buildPageMetadata({
    locale,
    pathname,
    title: page.title,
    description: page.metaDescription,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
    type: "article",
    publishedTime: `${page.publishedAt}T12:00:00Z`,
    modifiedTime: page.updatedAt ? `${page.updatedAt}T12:00:00Z` : undefined,
    alternateLocales: false,
    canonicalLocale: routing.defaultLocale,
  });
}

export default async function GuideTopicPage({ params }: GuideTopicPageProps) {
  const { locale, topic } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pseo");

  const page = getPseoGuideBySlug(topic);
  if (!page) {
    notFound();
  }

  const related = pickRelatedPseoPages(pseoPages, page);

  const breadcrumbNav: BreadcrumbNavItem[] = [
    { name: t("crumbHome"), href: "/" },
    { name: t("crumbGuides"), href: "/guides" },
    { name: page.heroHeading },
  ];

  const schemaBreadcrumbs = [
    { name: t("crumbHome"), url: buildAbsoluteUrl(locale, "/") },
    { name: t("crumbGuides"), url: buildAbsoluteUrl(locale, "/guides") },
    {
      name: page.heroHeading,
      url: buildAbsoluteUrl(locale, `/guides/${page.slug}`),
    },
  ];

  return (
    <GuidePageTemplate
      locale={locale}
      page={page}
      related={related}
      breadcrumbNav={breadcrumbNav}
      schemaBreadcrumbs={schemaBreadcrumbs}
      badgeGuide={t("badgeGuide")}
      faqHeading={t("faqHeading")}
      relatedTitle={t("relatedPagesTitle")}
    />
  );
}
