import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toolCategories } from "@/data/pseo/tool-categories";
import { routing } from "@/i18n/routing";
import { listPseoToolsInCategory } from "@/lib/pseo";
import { generatePseoToolCategoryStaticParams } from "@/lib/pseo/static-params";
import { hubPathForToolCategory, toolsHubPath } from "@/lib/seo/linking";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { ToolCategoryHubTemplate } from "@/templates/pseo/tool-category-hub";

interface ToolCategoryPageProps {
  params: Promise<{ locale: string; category: string }>;
}

export function generateStaticParams() {
  return generatePseoToolCategoryStaticParams();
}

export async function generateMetadata({
  params,
}: ToolCategoryPageProps): Promise<Metadata> {
  const { locale, category } = await params;
  const def = toolCategories.find((c) => c.slug === category);
  if (!def) {
    return { title: "Not found" };
  }
  const pathname = hubPathForToolCategory(category);
  return buildPageMetadata({
    locale,
    pathname,
    title: def.title,
    description: def.description,
    alternateLocales: false,
    canonicalLocale: routing.defaultLocale,
    keywords: [def.slug, "browser tools", "csv workflow"],
  });
}

export default async function ToolCategoryPage({
  params,
}: ToolCategoryPageProps) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pseo");

  const def = toolCategories.find((c) => c.slug === category);
  if (!def) {
    notFound();
  }

  const tools = listPseoToolsInCategory(category);
  if (tools.length === 0) {
    notFound();
  }

  const breadcrumbNav = [
    { name: t("crumbHome"), href: "/" },
    { name: t("crumbTools"), href: toolsHubPath() },
    { name: def.title },
  ];

  const schemaBreadcrumbs = [
    { name: t("crumbHome"), url: buildAbsoluteUrl(locale, "/") },
    {
      name: t("crumbTools"),
      url: buildAbsoluteUrl(locale, toolsHubPath()),
    },
    {
      name: def.title,
      url: buildAbsoluteUrl(locale, hubPathForToolCategory(category)),
    },
  ];

  return (
    <ToolCategoryHubTemplate
      locale={locale}
      category={def}
      tools={tools}
      breadcrumbNav={breadcrumbNav}
      schemaBreadcrumbs={schemaBreadcrumbs}
      badgeToolsHub={t("badgeToolsHub")}
      pagesInCategoryHub={t("pagesInCategoryHub")}
    />
  );
}
