export type PseoTemplate = "guide" | "tool";

export type PseoRoute = { type: "guide" } | { type: "tool"; category: string };

/**
 * Structured record for programmatic pages. Keep copy unique per `primaryKeyword`
 * and `id` to limit thin content and cannibalization.
 */
export interface PseoPageRecord {
  /** Stable id for sitemaps and analytics (never change once indexed). */
  id: string;
  template: PseoTemplate;
  route: PseoRoute;
  slug: string;
  /** One primary phrase per URL; enforced uniquely across the registry. */
  primaryKeyword: string;
  secondaryKeywords: string[];
  title: string;
  metaDescription: string;
  heroHeading: string;
  intro: string[];
  sections: { heading: string; paragraphs: string[] }[];
  faqs: { question: string; answer: string }[];
  /** Explicit spoke links (slugs in same or other templates). */
  relatedSlugs: string[];
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes?: number;
}

export interface ToolCategoryDefinition {
  slug: string;
  title: string;
  description: string;
  hubIntro: string[];
}
