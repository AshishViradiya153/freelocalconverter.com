import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toolCategories } from "@/data/pseo/tool-categories";
import { routing } from "@/i18n/routing";
import { getPseoToolPage, pseoPages } from "@/lib/pseo";
import { generatePseoToolLandingStaticParams } from "@/lib/pseo/static-params";
import {
  hubPathForToolCategory,
  pickRelatedPseoPages,
  pseoPathForRecord,
  toolsHubPath,
} from "@/lib/seo/linking";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { ToolLandingPageTemplate } from "@/templates/pseo/tool-landing-page";

interface ToolLandingPageProps {
  params: Promise<{ locale: string; category: string; slug: string }>;
}

export function generateStaticParams() {
  return generatePseoToolLandingStaticParams();
}

export async function generateMetadata({
  params,
}: ToolLandingPageProps): Promise<Metadata> {
  const { locale, category, slug } = await params;
  const page = getPseoToolPage(category, slug);
  if (!page || page.route.type !== "tool") {
    return { title: "Not found" };
  }
  if (page.route.category !== category) {
    return { title: "Not found" };
  }
  const pathname = pseoPathForRecord(page);
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

export default async function PseoToolLandingPage({
  params,
}: ToolLandingPageProps) {
  const { locale, category, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pseo");

  const page = getPseoToolPage(category, slug);
  if (!page || page.route.type !== "tool") {
    notFound();
  }
  if (page.route.category !== category) {
    notFound();
  }

  const categoryDef = toolCategories.find((c) => c.slug === category);
  if (!categoryDef) {
    notFound();
  }

  const related = pickRelatedPseoPages(pseoPages, page);

  const breadcrumbNav = [
    { name: t("crumbHome"), href: "/" },
    { name: t("crumbTools"), href: toolsHubPath() },
    { name: categoryDef.title, href: hubPathForToolCategory(category) },
    { name: page.heroHeading },
  ];

  const schemaBreadcrumbs = [
    { name: t("crumbHome"), url: buildAbsoluteUrl(locale, "/") },
    {
      name: t("crumbTools"),
      url: buildAbsoluteUrl(locale, toolsHubPath()),
    },
    {
      name: categoryDef.title,
      url: buildAbsoluteUrl(locale, hubPathForToolCategory(category)),
    },
    {
      name: page.heroHeading,
      url: buildAbsoluteUrl(locale, pseoPathForRecord(page)),
    },
  ];

  return (
    <ToolLandingPageTemplate
      locale={locale}
      page={page}
      categoryTitle={categoryDef.title}
      related={related}
      breadcrumbNav={breadcrumbNav}
      schemaBreadcrumbs={schemaBreadcrumbs}
      toolKicker={t("toolLandingKicker", { category: categoryDef.title })}
      faqHeading={t("faqHeading")}
      relatedTitle={t("relatedPagesTitle")}
    />
  );
}
