import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { toolCategories } from "@/data/pseo/tool-categories";
import { routing } from "@/i18n/routing";
import { getAllPostSlugs } from "@/lib/blog/registry";

function buildUrl(locale: string, path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const p = path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  if (locale === routing.defaultLocale) {
    return `${base}${p || "/"}`;
  }
  return `${base}/${locale}${p || ""}`;
}

/**
 * Core sitemap: static routes, blog, and pSEO hub URLs. Programmatic leaf pages
 * (`/guides/[topic]`, `/tools/[category]/[slug]`) are listed in chunked XML at
 * `/sitemaps/pseo/{n}.xml` so the file stays under search-engine URL limits at scale.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/compare",
    "/csv-to-json",
    "/json-to-csv",
    "/pdf-to-image",
    "/pdf-to-word",
    "/split-pdf",
    "/reorder-pdf",
    "/pdf-watermark",
    "/bulk-pdf-watermark",
    "/merge-pdf",
    "/video-compress",
    "/image-compress",
    "/image-convert",
    "/image-resize",
    "/heic-to-jpg",
    "/images-to-pdf",
    "/csv-to-parquet",
    "/parquet-to-csv",
    "/json-to-parquet",
    "/parquet-to-json",
    "/csv-to-markdown-table",
    "/csv-to-excel",
    "/palettes/trending",
    "/palettes/best",
    "/gradients",
    "/gradients/best",
    "/xls-to-csv",
    "/xls-viewer",
    "/parquet-viewer",
    "/json-to-excel",
    "/privacy",
    "/terms",
    "/blog",
    "/guides",
    "/tools",
  ];
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date().toISOString();

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({
        url: buildUrl(locale, path),
        lastModified: now,
      });
    }
    for (const c of toolCategories) {
      entries.push({
        url: buildUrl(locale, `/tools/${c.slug}`),
        lastModified: now,
      });
    }
    for (const slug of getAllPostSlugs()) {
      entries.push({
        url: buildUrl(locale, `/blog/${slug}`),
        lastModified: now,
      });
    }
  }

  return entries;
}
