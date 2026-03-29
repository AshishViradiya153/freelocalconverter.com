import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  type BreadcrumbNavItem,
  Breadcrumbs,
} from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PseoContentLocaleNotice } from "@/components/seo/pseo-content-locale-notice";
import {
  ToolSectionHeading,
  toolHeroTitleClassName,
} from "@/components/tool-ui";
import { toolCategories } from "@/data/pseo/tool-categories";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { hubPathForToolCategory, toolsHubPath } from "@/lib/seo/linking";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { buildBreadcrumbListJsonLd, buildJsonLdGraph } from "@/lib/seo/schema";

interface ToolsHubPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ToolsHubPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pseo");
  const pathname = toolsHubPath();
  return buildPageMetadata({
    locale,
    pathname,
    title: t("toolsHubTitle"),
    description: t("toolsHubDescription"),
    alternateLocales: false,
    canonicalLocale: routing.defaultLocale,
    keywords: [
      "browser tools",
      "csv tools",
      "local data tools",
      "workflow hubs",
    ],
  });
}

export default async function ToolsHubPage({ params }: ToolsHubPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pseo");
  const pathname = toolsHubPath();
  const hubUrl = buildAbsoluteUrl(locale, pathname);

  const breadcrumbNav: BreadcrumbNavItem[] = [
    { name: t("crumbHome"), href: "/" },
    { name: t("crumbTools") },
  ];

  const graph = buildJsonLdGraph([
    buildBreadcrumbListJsonLd([
      { name: t("crumbHome"), url: buildAbsoluteUrl(locale, "/") },
      { name: t("crumbTools"), url: hubUrl },
    ]) as unknown as Record<string, unknown>,
    {
      "@type": "CollectionPage",
      name: t("toolsHubTitle"),
      description: t("toolsHubDescription"),
      url: hubUrl,
    },
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <div className="container max-w-3xl py-10 pb-20">
        <Breadcrumbs items={breadcrumbNav} />
        <div className="mt-4">
          <PseoContentLocaleNotice locale={locale} />
        </div>
        <header className="mt-8 border-border border-b pb-8">
          <h1 className={toolHeroTitleClassName}>{t("toolsHubTitle")}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
            {t("toolsHubDescription")}
          </p>
        </header>
        <section className="mt-12" aria-labelledby="tools-hub-sections-heading">
          <ToolSectionHeading id="tools-hub-sections-heading">
            {t("toolsHubSectionsTitle")}
          </ToolSectionHeading>
          <ul className="mt-6 flex flex-col gap-6">
            {toolCategories.map((c) => (
              <li key={c.slug}>
                <article>
                  <Link
                    href={hubPathForToolCategory(c.slug)}
                    className="group block rounded-lg border border-transparent outline-none transition-colors hover:border-border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <div className="rounded-lg px-1 py-2 sm:px-2">
                      <h3 className="font-semibold text-base text-foreground tracking-tight group-hover:underline">
                        {c.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                        {c.description}
                      </p>
                    </div>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
