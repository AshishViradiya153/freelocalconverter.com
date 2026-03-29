import {
  buildRootSitemapIndexLocators,
  escapeXmlForSitemap,
  rootSitemapUrl,
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  const now = new Date().toISOString();
  const locators = buildRootSitemapIndexLocators();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locators
  .map(
    (loc) => `  <sitemap>
    <loc>${escapeXmlForSitemap(loc)}</loc>
    <lastmod>${escapeXmlForSitemap(now)}</lastmod>
  </sitemap>`,
  )
  .join("\n")}
</sitemapindex>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      Link: `<${rootSitemapUrl()}>; rel="self"`,
    },
  });
}
