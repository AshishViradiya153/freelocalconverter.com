import type { MetadataRoute } from "next";
import { toolCategories } from "@/data/pseo/tool-categories";
import { routing } from "@/i18n/routing";
import { getAllPostSlugs } from "@/lib/blog/registry";
import { buildAbsoluteUrl } from "@/lib/seo/paths";

/**
 * Paths merged into the static sitemap (per locale). Empty string = home.
 * Keep in sync when adding new top-level marketing or app routes.
 */
export const STATIC_SITEMAP_PATH_SEGMENTS: readonly string[] = [
  "",
  "/compare",
  "/csv-to-json",
  "/json-to-csv",
  "/json-formatter",
  "/sql-formatter",
  "/json-yaml-converter",
  "/jwt-decoder",
  "/cron-parser",
  "/uuid-generator",
  "/regex-tester",
  "/curl-converter",
  "/fetch-converter",
  "/axios-converter",
  "/base64-converter",
  "/unix-timestamp-converter",
  "/python-requests-converter",
  "/pdf-to-image",
  "/pdf-to-word",
  "/split-pdf",
  "/reorder-pdf",
  "/pdf-watermark",
  "/bulk-pdf-watermark",
  "/merge-pdf",
  "/audio-convert",
  "/srt-to-vtt",
  "/video-compress",
  "/image-compress",
  "/image-convert",
  "/svg-to-code",
  "/image-resize",
  "/favicon-generator",
  "/gif-tools",
  "/image-base64",
  "/linkedin-banner",
  "/open-graph-preview",
  "/svg-to-png",
  "/heic-to-jpg",
  "/images-to-pdf",
  "/csv-to-parquet",
  "/parquet-to-csv",
  "/json-to-parquet",
  "/parquet-to-json",
  "/csv-to-markdown-table",
  "/markdown-html-converter",
  "/markdown-to-epub",
  "/csv-to-sql",
  "/csv-to-excel",
  "/palettes/trending",
  "/palettes/best",
  "/gradients",
  "/gradients/best",
  "/gradient-generator",
  "/gradient-generator/trending",
  "/xls-to-csv",
  "/xls-viewer",
  "/parquet-viewer",
  "/json-to-excel",
  "/privacy",
  "/terms",
  "/blog",
  "/guides",
  "/contact",
  "/tools",
];

function segmentToPathname(segment: string): string {
  if (segment === "") return "/";
  return segment.startsWith("/") ? segment : `/${segment}`;
}

/** Core + hubs + blog posts × locales (excludes programmatic leaf URLs). */
export function buildStaticSitemapEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date().toISOString();

  for (const locale of routing.locales) {
    for (const segment of STATIC_SITEMAP_PATH_SEGMENTS) {
      entries.push({
        url: buildAbsoluteUrl(locale, segmentToPathname(segment)),
        lastModified: now,
      });
    }
    for (const c of toolCategories) {
      entries.push({
        url: buildAbsoluteUrl(locale, `/tools/${c.slug}`),
        lastModified: now,
      });
    }
    for (const slug of getAllPostSlugs()) {
      entries.push({
        url: buildAbsoluteUrl(locale, `/blog/${slug}`),
        lastModified: now,
      });
    }
  }

  return entries;
}
