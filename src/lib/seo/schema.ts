import { siteConfig } from "@/config/site";
import { normalizeSiteBase } from "./paths";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleSchemaInput {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SoftwareApplicationSchemaInput {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  offers?: { price: string; priceCurrency: string };
}

export function buildOrganizationJsonLd() {
  const base = normalizeSiteBase();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: `${base}/`,
    description: siteConfig.description,
  };
}

export function buildWebSiteJsonLd() {
  const base = normalizeSiteBase();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: `${base}/`,
    description: siteConfig.description,
    publisher: { "@id": `${base}/#organization` },
  };
}

export function buildBreadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildArticleJsonLd(input: ArticleSchemaInput) {
  const base = normalizeSiteBase();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: `${base}/`,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: `${base}/`,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
  };
}

export function buildFaqPageJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildSoftwareApplicationJsonLd(
  input: SoftwareApplicationSchemaInput,
) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: input.applicationCategory ?? "BusinessApplication",
    operatingSystem: "Web",
    offers: input.offers ?? {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/** Merge multiple graph nodes (Organization + WebPage + Article + FAQ, etc.). */
export function buildJsonLdGraph(nodes: Record<string, unknown>[]) {
  const graph = nodes.map((node) => {
    const rest = { ...node };
    delete rest["@context"];
    return rest;
  });
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
