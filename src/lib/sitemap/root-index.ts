import { getPseoSitemapChunkCount, pseoSitemapIndexUrl } from "@/lib/pseo/sitemap";
import { staticChildSitemapUrl } from "./site-urls";

/**
 * Locators for the root `sitemap.xml` index (hub-and-spoke for crawlers).
 * Order: static urlset first, then programmatic index when chunks exist.
 */
export function buildRootSitemapIndexLocators(): string[] {
  const locs = [staticChildSitemapUrl()];
  if (getPseoSitemapChunkCount() > 0) {
    locs.push(pseoSitemapIndexUrl());
  }
  return locs;
}
