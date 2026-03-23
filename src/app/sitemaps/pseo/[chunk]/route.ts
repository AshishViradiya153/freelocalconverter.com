import {
  getPseoSitemapChunk,
  getPseoSitemapChunkCount,
} from "@/lib/pseo/sitemap";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ chunk: string }> },
) {
  const { chunk } = await context.params;
  const index = Number.parseInt(chunk.replace(/\.xml$/i, ""), 10);
  if (!Number.isFinite(index) || index < 0) {
    return new Response("Not Found", { status: 404 });
  }

  const chunkCount = getPseoSitemapChunkCount();
  if (chunkCount === 0 || index >= chunkCount) {
    return new Response("Not Found", { status: 404 });
  }

  const entries = getPseoSitemapChunk(index);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => {
    const last =
      e.lastModified instanceof Date
        ? e.lastModified.toISOString()
        : String(e.lastModified ?? new Date().toISOString());
    return `  <url>
    <loc>${escapeXml(e.url)}</loc>
    <lastmod>${escapeXml(last)}</lastmod>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
