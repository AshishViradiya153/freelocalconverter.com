import type { ReactNode } from "react";
import {
  type BreadcrumbNavItem,
  Breadcrumbs,
} from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RelatedImageConvertPairs } from "@/components/seo/related-image-convert-pairs";
import { ToolSectionHeading } from "@/components/tool-ui";
import type { ImageConvertPair } from "@/lib/image/image-convert-pairs";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import {
  type BreadcrumbItem,
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildJsonLdGraph,
  buildSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/schema";

interface ImageConvertPairProgrammaticSeoProps {
  locale: string;
  parsed: ImageConvertPair;
  title: string;
  metaDescription: string;
  breadcrumbNav: BreadcrumbNavItem[];
  schemaBreadcrumbs: BreadcrumbItem[];
  relatedPairs: ImageConvertPair[];
  relatedTitle: string;
  faqHeading: string;
  introParagraphs: string[];
  faqs: { question: string; answer: string }[];
  children: ReactNode;
}

export function ImageConvertPairProgrammaticSeo({
  locale,
  parsed,
  title,
  metaDescription,
  breadcrumbNav,
  schemaBreadcrumbs,
  relatedPairs,
  relatedTitle,
  faqHeading,
  introParagraphs,
  faqs,
  children,
}: ImageConvertPairProgrammaticSeoProps) {
  const pathname = `/image-convert/${parsed.pairSlug}`;
  const pageUrl = buildAbsoluteUrl(locale, pathname);

  const graph = buildJsonLdGraph([
    buildBreadcrumbListJsonLd(schemaBreadcrumbs) as unknown as Record<
      string,
      unknown
    >,
    buildWebPageJsonLd({
      name: title,
      description: metaDescription,
      url: pageUrl,
    }) as unknown as Record<string, unknown>,
    buildSoftwareApplicationJsonLd({
      name: title,
      description: metaDescription,
      url: pageUrl,
      applicationCategory: "MultimediaApplication",
    }) as unknown as Record<string, unknown>,
    buildFaqPageJsonLd(faqs) as unknown as Record<string, unknown>,
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <div className="container py-4">
        <Breadcrumbs items={breadcrumbNav} />
      </div>
      {children}
      <div className="container flex max-w-3xl flex-col gap-10 pb-16">
        <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
          {introParagraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
        <section aria-labelledby="faq-image-pair-heading">
          <ToolSectionHeading id="faq-image-pair-heading">
            {faqHeading}
          </ToolSectionHeading>
          <dl className="mt-6 space-y-6">
            {faqs.map((faq) => (
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
        <RelatedImageConvertPairs
          locale={locale}
          pairs={relatedPairs}
          title={relatedTitle}
        />
      </div>
    </>
  );
}
