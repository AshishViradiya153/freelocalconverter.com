import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { BreadcrumbNavItem } from "@/components/seo/breadcrumbs";
import { toolCategories } from "@/data/pseo/tool-categories";
import { routing } from "@/i18n/routing";
import { getPseoToolPage, pseoPages } from "@/lib/pseo";
import { generatePseoToolLandingStaticParams } from "@/lib/pseo/static-params";
import {
  hubPathForToolCategory,
  pickRelatedPseoPages,
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
  const { category, slug, locale } = await params;
  const page = getPseoToolPage(category, slug);
  if (!page) {
    return { title: "Not found" };
  }
  const pathname = `/tools/${category}/${slug}`;
  return buildPageMetadata({
    locale,
    pathname,
    title: page.title,
    description: page.metaDescription,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
    alternateLocales: false,
    canonicalLocale: routing.defaultLocale,
  });
}

export default async function ToolPseoPage({ params }: ToolLandingPageProps) {
  const { locale, category, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pseo");

  const categoryDef = toolCategories.find((c) => c.slug === category);
  const page = getPseoToolPage(category, slug);
  if (!page || !categoryDef) {
    notFound();
  }

  const related = pickRelatedPseoPages(pseoPages, page);

  const breadcrumbNav: BreadcrumbNavItem[] = [
    { name: t("crumbHome"), href: "/" },
    { name: t("crumbTools"), href: "/tools" },
    { name: categoryDef.title, href: hubPathForToolCategory(category) },
    { name: page.heroHeading },
  ];

  const hubPath = hubPathForToolCategory(category);
  const hubUrl = buildAbsoluteUrl(locale, hubPath);
  const pageUrl = buildAbsoluteUrl(locale, `/tools/${category}/${slug}`);

  const schemaBreadcrumbs = [
    { name: t("crumbHome"), url: buildAbsoluteUrl(locale, "/") },
    { name: t("crumbTools"), url: buildAbsoluteUrl(locale, "/tools") },
    { name: categoryDef.title, url: hubUrl },
    { name: page.heroHeading, url: pageUrl },
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
