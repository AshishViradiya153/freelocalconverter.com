import { siteConfig } from "@/config/site";
import { buildAbsoluteUrl, normalizeSiteBase } from "./paths";

function absoluteUrlFromSitePath(path: string): string {
  const base = normalizeSiteBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** URLs for Schema.org `sameAs` (social, repos, official profiles). */
function buildOrganizationSameAs(): string[] {
  const { links } = siteConfig;
  const candidates = [links.github, links.twitter, links.linkedin];
  const out: string[] = [];
  for (const raw of candidates) {
    const u = raw.trim();
    if (!u) continue;
    try {
      const parsed = new URL(u);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        out.push(parsed.href);
      }
    } catch {
      // skip invalid URLs
    }
  }
  return [...new Set(out)];
}

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
  const logoUrl = absoluteUrlFromSitePath(siteConfig.brandLogoPath);
  const sameAs = buildOrganizationSameAs();
  const contact = siteConfig.organizationContact;
  const email = contact?.email?.trim();

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: siteConfig.name,
    url: `${base}/`,
    description: siteConfig.description,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
    },
  };

  if (sameAs.length > 0) {
    node.sameAs = sameAs;
  }

  if (email) {
    node.contactPoint = {
      "@type": "ContactPoint",
      email,
      contactType: contact?.contactType ?? "customer support",
    };
  }

  return node;
}

export function buildWebSiteJsonLd(opts: { locale: string }) {
  const base = normalizeSiteBase();
  const homeUrl = buildAbsoluteUrl(opts.locale, "/");
  const urlTemplate = homeUrl.includes("?")
    ? `${homeUrl}&q={search_term_string}`
    : `${homeUrl}?q={search_term_string}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${homeUrl}#website`,
    name: siteConfig.name,
    url: homeUrl,
    description: siteConfig.description,
    publisher: { "@id": `${base}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate,
      },
      "query-input": "required name=search_term_string",
    },
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
  const orgRef = { "@id": `${base}/#organization` };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: orgRef,
    publisher: orgRef,
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

export interface HowToStepInput {
  name: string;
  text: string;
}

export interface HowToSchemaInput {
  name: string;
  description: string;
  url: string;
  steps: HowToStepInput[];
}

/** HowTo steps must mirror visible on-page sections (headings + body). */
export function buildHowToJsonLd(input: HowToSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    step: input.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
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

export interface WebPageSchemaInput {
  name: string;
  description: string;
  url: string;
}

/** Use for programmatic tool-style URLs where Article dates do not apply. */
export function buildWebPageJsonLd(input: WebPageSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: input.url,
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
