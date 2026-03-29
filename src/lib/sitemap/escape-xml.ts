/** Escape text for XML sitemap `loc` / `lastmod` character data. */
export function escapeXmlForSitemap(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
