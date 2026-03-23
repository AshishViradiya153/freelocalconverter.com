import {
  type BreadcrumbNavItem,
  Breadcrumbs,
} from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PseoContentLocaleNotice } from "@/components/seo/pseo-content-locale-notice";
import { RelatedPages } from "@/components/seo/related-pages";
import type { PseoPageRecord } from "@/lib/pseo/types";
import { pseoPathForRecord } from "@/lib/seo/linking";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import {
  type BreadcrumbItem,
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildJsonLdGraph,
  buildSoftwareApplicationJsonLd,
} from "@/lib/seo/schema";

interface ToolLandingPageTemplateProps {
  locale: string;
  page: PseoPageRecord;
  categoryTitle: string;
  related: PseoPageRecord[];
  breadcrumbNav: BreadcrumbNavItem[];
  schemaBreadcrumbs: BreadcrumbItem[];
  /** Localized kicker line (e.g. "Tool · Category"). */
  toolKicker: string;
  faqHeading: string;
  relatedTitle: string;
}

export function ToolLandingPageTemplate({
  locale,
  page,
  related,
  breadcrumbNav,
  schemaBreadcrumbs,
  toolKicker,
  faqHeading,
  relatedTitle,
}: ToolLandingPageTemplateProps) {
  if (page.route.type !== "tool") {
    throw new Error("ToolLandingPageTemplate expects a tool route");
  }

  const pathname = pseoPathForRecord(page);
  const pageUrl = buildAbsoluteUrl(locale, pathname);

  const breadcrumbJson = buildBreadcrumbListJsonLd(schemaBreadcrumbs);

  const graph = buildJsonLdGraph([
    breadcrumbJson as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: page.title,
      description: page.metaDescription,
      url: pageUrl,
      applicationCategory: "BusinessApplication",
    }) as unknown as Record<string, unknown>,
    buildFaqPageJsonLd(page.faqs) as unknown as Record<string, unknown>,
  ]);

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
              {toolKicker}
            </p>
            <h1 className="mt-2 font-semibold text-3xl tracking-tight">
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
                <h2 className="font-semibold text-foreground text-xl tracking-tight">
                  {section.heading}
                </h2>
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
            aria-labelledby="faq-tool-heading"
          >
            <h2
              id="faq-tool-heading"
              className="font-semibold text-foreground text-lg tracking-tight"
            >
              {faqHeading}
            </h2>
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
