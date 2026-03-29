import { normalizeSiteBase } from "@/lib/seo/paths";

export function rootSitemapUrl(): string {
  return `${normalizeSiteBase()}/sitemap.xml`;
}

/** Child urlset: marketing, tools, hubs, blog — not programmatic leaf URLs. */
export function staticChildSitemapUrl(): string {
  return `${normalizeSiteBase()}/sitemaps/static.xml`;
}
