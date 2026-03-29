import {
  type BreadcrumbNavItem,
  Breadcrumbs,
} from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PseoContentLocaleNotice } from "@/components/seo/pseo-content-locale-notice";
import { RelatedPages } from "@/components/seo/related-pages";
import {
  ToolSectionHeading,
  toolHeroTitleClassName,
} from "@/components/tool-ui";
import type { PseoPageRecord } from "@/lib/pseo/types";
import { pseoPathForRecord } from "@/lib/seo/linking";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import {
  type BreadcrumbItem,
  buildArticleJsonLd,
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildHowToJsonLd,
  buildJsonLdGraph,
  buildOrganizationJsonLd,
} from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

interface GuidePageTemplateProps {
  locale: string;
  page: PseoPageRecord;
  related: PseoPageRecord[];
  breadcrumbNav: BreadcrumbNavItem[];
  /** Breadcrumb labels for JSON-LD (match visible UI language). */
  schemaBreadcrumbs: BreadcrumbItem[];
  badgeGuide: string;
  faqHeading: string;
  relatedTitle: string;
}

export function GuidePageTemplate({
  locale,
  page,
  related,
  breadcrumbNav,
  schemaBreadcrumbs,
  badgeGuide,
  faqHeading,
  relatedTitle,
}: GuidePageTemplateProps) {
  const pathname = pseoPathForRecord(page);
  const pageUrl = buildAbsoluteUrl(locale, pathname);

  const breadcrumbJson = buildBreadcrumbListJsonLd(schemaBreadcrumbs);

  const howToSteps = page.sections.map((section) => ({
    name: section.heading,
    text: section.paragraphs.join("\n\n"),
  }));

  const graphNodes: Record<string, unknown>[] = [
    buildOrganizationJsonLd() as unknown as Record<string, unknown>,
    breadcrumbJson as unknown as Record<string, unknown>,
    buildArticleJsonLd({
      headline: page.heroHeading,
      description: page.metaDescription,
      url: pageUrl,
      datePublished: page.publishedAt,
      dateModified: page.updatedAt,
    }) as unknown as Record<string, unknown>,
    buildHowToJsonLd({
      name: page.heroHeading,
      description: page.metaDescription,
      url: pageUrl,
      steps: howToSteps,
    }) as unknown as Record<string, unknown>,
    buildFaqPageJsonLd(page.faqs) as unknown as Record<string, unknown>,
  ];

  const graph = buildJsonLdGraph(graphNodes);

  return (
    <>
      <JsonLd data={graph} />
      <div className="container max-w-3xl py-10 pb-20">
        <Breadcrumbs items={breadcrumbNav} />
        <div className="mt-4">
          <PseoContentLocaleNotice locale={locale} />
        </div>

        <article className="mt-8">
          <header className="border-border border-b pb-8">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {badgeGuide}
            </p>
            <h1 className={cn(toolHeroTitleClassName, "mt-2")}>
              {page.heroHeading}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
              {page.metaDescription}
            </p>
          </header>

          <div className="mt-10 space-y-4 text-muted-foreground text-sm leading-relaxed">
            {page.intro.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            {page.sections.map((section) => (
              <section key={section.heading} className="pt-6">
                <ToolSectionHeading>{section.heading}</ToolSectionHeading>
                {section.paragraphs.map((para) => (
                  <p key={para.slice(0, 24)} className="mt-3">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <section
            className="mt-14 border-border border-t pt-10"
            aria-labelledby="faq-heading"
          >
            <ToolSectionHeading id="faq-heading">
              {faqHeading}
            </ToolSectionHeading>
            <dl className="mt-6 space-y-6">
              {page.faqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="font-medium text-foreground text-sm">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </article>

        <RelatedPages className="mt-14" title={relatedTitle} pages={related} />
      </div>
    </>
  );
}
