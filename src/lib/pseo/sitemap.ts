import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllImageConvertPairs } from "@/lib/image/image-convert-pairs";
import { routing } from "@/i18n/routing";
import { pseoPathForRecord } from "@/lib/seo/linking";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import { pseoPages } from "./registry";
import type { PseoPageRecord } from "./types";

/**
 * Programmatic sitemap pipeline (100k+ safe):
 * - Registry-backed URLs (guides, tools category pages) and image-convert pair URLs share one
 *   chunked XML index at /sitemaps/pseo.xml so the primary sitemap.xml stays small.
 * - Chunk size stays under Google's 50k URL cap per file.
 * - entryForFlatIndex resolves URLs lazily (no full in-memory list when serving chunks).
 */
export const PSEO_SITEMAP_CHUNK_SIZE = 45_000;

const IMAGE_CONVERT_PAIRS = getAllImageConvertPairs();

function pseoFlatUrlCount(): number {
  return pseoPages.length * routing.locales.length;
}

function imageConvertFlatUrlCount(): number {
  return IMAGE_CONVERT_PAIRS.length * routing.locales.length;
}

export function getProgrammaticSitemapTotalUrlCount(): number {
  return pseoFlatUrlCount() + imageConvertFlatUrlCount();
}

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

function buildImageConvertPairSitemapUrls(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date("2026-03-01T12:00:00Z");
  for (const locale of routing.locales) {
    for (const pair of IMAGE_CONVERT_PAIRS) {
      entries.push({
        url: buildAbsoluteUrl(locale, `/image-convert/${pair.pairSlug}`),
        lastModified,
      });
    }
  }
  return entries;
}

/** Full flattened list: pSEO registry URLs first, then image-convert pairs (tests + validation). */
export function buildProgrammaticSitemapUrls(): MetadataRoute.Sitemap {
  return [...buildPseoSitemapUrls(pseoPages), ...buildImageConvertPairSitemapUrls()];
}

export function getPseoSitemapChunkCount(): number {
  const total = getProgrammaticSitemapTotalUrlCount();
  if (total === 0) return 0;
  return Math.ceil(total / PSEO_SITEMAP_CHUNK_SIZE);
}

function entryForFlatIndex(flatIndex: number): MetadataRoute.Sitemap[number] {
  const pseoTotal = pseoFlatUrlCount();
  if (flatIndex < pseoTotal) {
    const pageCount = pseoPages.length;
    if (pageCount === 0) {
      throw new Error("pSEO sitemap index points at pSEO segment but registry is empty.");
    }
    const localeIndex = Math.floor(flatIndex / pageCount);
    const pageIndex = flatIndex % pageCount;
    const locale = routing.locales[localeIndex];
    const page = pseoPages[pageIndex];
    if (!locale || !page) {
      throw new Error(`Invalid programmatic sitemap flat index ${flatIndex}`);
    }
    return {
      url: buildAbsoluteUrl(locale, pseoPathForRecord(page)),
      lastModified: new Date(`${page.updatedAt ?? page.publishedAt}T12:00:00Z`),
    };
  }

  const imageFlat = flatIndex - pseoTotal;
  const pairCount = IMAGE_CONVERT_PAIRS.length;
  if (pairCount === 0) {
    throw new Error("Programmatic sitemap index points at image segment but no pairs exist.");
  }
  const localeIndex = Math.floor(imageFlat / pairCount);
  const pairIndex = imageFlat % pairCount;
  const locale = routing.locales[localeIndex];
  const pair = IMAGE_CONVERT_PAIRS[pairIndex];
  if (!locale || !pair) {
    throw new Error(`Invalid programmatic sitemap flat index ${flatIndex}`);
  }
  return {
    url: buildAbsoluteUrl(locale, `/image-convert/${pair.pairSlug}`),
    lastModified: new Date("2026-03-01T12:00:00Z"),
  };
}

export function getPseoSitemapChunk(chunkIndex: number): MetadataRoute.Sitemap {
  const total = getProgrammaticSitemapTotalUrlCount();
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
