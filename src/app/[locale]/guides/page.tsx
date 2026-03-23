import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  type BreadcrumbNavItem,
  Breadcrumbs,
} from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PseoContentLocaleNotice } from "@/components/seo/pseo-content-locale-notice";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listPseoGuides } from "@/lib/pseo";
import { guideHubPath, pseoPathForRecord } from "@/lib/seo/linking";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { buildBreadcrumbListJsonLd, buildJsonLdGraph } from "@/lib/seo/schema";

interface GuidesHubPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: GuidesHubPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pseo");
  const pathname = guideHubPath();
  return buildPageMetadata({
    locale,
    pathname,
    title: t("guidesHubTitle"),
    description: t("guidesHubDescription"),
    alternateLocales: false,
    canonicalLocale: routing.defaultLocale,
    keywords: ["csv guides", "browser csv", "data grid guides"],
  });
}

export default async function GuidesHubPage({ params }: GuidesHubPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pseo");
  const guides = listPseoGuides();
  const pathname = guideHubPath();
  const hubUrl = buildAbsoluteUrl(locale, pathname);

  const breadcrumbNav: BreadcrumbNavItem[] = [
    { name: t("crumbHome"), href: "/" },
    { name: t("crumbGuides") },
  ];

  const graph = buildJsonLdGraph([
    buildBreadcrumbListJsonLd([
      { name: t("crumbHome"), url: buildAbsoluteUrl(locale, "/") },
      { name: t("crumbGuides"), url: hubUrl },
    ]) as unknown as Record<string, unknown>,
    {
      "@type": "CollectionPage",
      name: t("guidesHubTitle"),
      description: t("guidesHubDescription"),
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
          <h1 className="font-semibold text-3xl tracking-tight">
            {t("guidesHubTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
            {t("guidesHubDescription")}
          </p>
        </header>
        <ul className="mt-12 flex flex-col gap-6">
          {guides.map((g) => (
            <li key={g.id}>
              <article>
                <Link
                  href={pseoPathForRecord(g)}
                  className="group block rounded-lg border border-transparent outline-none transition-colors hover:border-border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <div className="rounded-lg px-1 py-2 sm:px-2">
                    <h2 className="font-semibold text-base text-foreground tracking-tight group-hover:underline">
                      {g.heroHeading}
                    </h2>
                    <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                      {g.metaDescription}
                    </p>
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
