import {
  getPseoSitemapChunkCount,
  pseoSitemapChunkUrl,
  pseoSitemapIndexUrl,
} from "@/lib/pseo/sitemap";
import { escapeXmlForSitemap } from "@/lib/sitemap";

export async function GET() {
  const chunkCount = getPseoSitemapChunkCount();
  if (chunkCount === 0) {
    return new Response("Not Found", { status: 404 });
  }
  const now = new Date().toISOString();
  const entries = Array.from({ length: chunkCount }, (_, i) => ({
    loc: pseoSitemapChunkUrl(i),
    lastmod: now,
  }));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <sitemap>
    <loc>${escapeXmlForSitemap(entry.loc)}</loc>
    <lastmod>${escapeXmlForSitemap(entry.lastmod)}</lastmod>
  </sitemap>`,
  )
  .join("\n")}
</sitemapindex>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      Link: `<${pseoSitemapIndexUrl()}>; rel="self"`,
    },
  });
}
