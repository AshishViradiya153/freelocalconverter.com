import {
  buildStaticSitemapEntries,
  escapeXmlForSitemap,
  staticChildSitemapUrl,
} from "@/lib/sitemap";

export async function GET() {
  const entries = buildStaticSitemapEntries();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => {
    const last =
      e.lastModified instanceof Date
        ? e.lastModified.toISOString()
        : String(e.lastModified ?? new Date().toISOString());
    return `  <url>
    <loc>${escapeXmlForSitemap(e.url)}</loc>
    <lastmod>${escapeXmlForSitemap(last)}</lastmod>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      Link: `<${staticChildSitemapUrl()}>; rel="self"`,
    },
  });
}
