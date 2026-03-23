import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { pseoPathForRecord } from "@/lib/seo/linking";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { pseoPages } from "./registry";
import type { PseoPageRecord } from "./types";

/** Google allows up to 50,000 URLs per sitemap file; stay under for headroom. */
export const PSEO_SITEMAP_CHUNK_SIZE = 45_000;

export function buildPseoSitemapUrls(
  pages: readonly PseoPageRecord[],
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const page of pages) {
      const path = pseoPathForRecord(page);
      entries.push({
        url: buildAbsoluteUrl(locale, path),
        lastModified: new Date(
          `${page.updatedAt ?? page.publishedAt}T12:00:00Z`,
        ),
      });
    }
  }
  return entries;
}

export function getPseoSitemapChunkCount(): number {
  const total = pseoPages.length * routing.locales.length;
  if (total === 0) return 0;
  return Math.ceil(total / PSEO_SITEMAP_CHUNK_SIZE);
}

function entryForFlatIndex(flatIndex: number): MetadataRoute.Sitemap[number] {
  const pageCount = pseoPages.length;
  if (pageCount === 0) {
    throw new Error("No pSEO pages available for sitemap entry lookup.");
  }
  const localeIndex = Math.floor(flatIndex / pageCount);
  const pageIndex = flatIndex % pageCount;
  const locale = routing.locales[localeIndex];
  const page = pseoPages[pageIndex];
  if (!locale || !page) {
    throw new Error(`Invalid pSEO sitemap flat index ${flatIndex}`);
  }
  return {
    url: buildAbsoluteUrl(locale, pseoPathForRecord(page)),
    lastModified: new Date(`${page.updatedAt ?? page.publishedAt}T12:00:00Z`),
  };
}

export function getPseoSitemapChunk(chunkIndex: number): MetadataRoute.Sitemap {
  const total = pseoPages.length * routing.locales.length;
  const start = chunkIndex * PSEO_SITEMAP_CHUNK_SIZE;
  const end = Math.min(start + PSEO_SITEMAP_CHUNK_SIZE, total);
  if (start >= total || start < 0) return [];
  const entries: MetadataRoute.Sitemap = [];
  for (let i = start; i < end; i++) {
    entries.push(entryForFlatIndex(i));
  }
  return entries;
}

export function pseoSitemapChunkUrl(chunkIndex: number): string {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}/sitemaps/pseo/${chunkIndex}.xml`;
}

export function pseoSitemapIndexUrl(): string {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}/sitemaps/pseo.xml`;
}
