import { zipSync } from "fflate";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

export interface MarkdownToEpubOptions {
  title: string;
  author?: string;
  language?: string;
  /** Optional stable ID, otherwise a random UUID is generated. */
  identifier?: string;
}

export interface MarkdownToEpubResult {
  filename: string;
  epubBytes: Uint8Array;
}

function safeBaseName(raw: string) {
  const trimmed = raw.trim();
  const normalized = trimmed.replace(/[^\w-]+/g, "-").replace(/-+/g, "-");
  const safe = normalized.replace(/^-|-$/g, "").slice(0, 64);
  return safe || "book";
}

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtmlAttribute(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function buildContainerXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n` +
    `  <rootfiles>\n` +
    `    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n` +
    `  </rootfiles>\n` +
    `</container>\n`;
}

function buildNavXhtml(args: { title: string; lang: string }) {
  return `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<!DOCTYPE html>\n` +
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeHtmlAttribute(args.lang)}">\n` +
    `<head>\n` +
    `  <title>${escapeXml(args.title)}</title>\n` +
    `  <meta charset="utf-8"/>\n` +
    `</head>\n` +
    `<body>\n` +
    `  <nav epub:type="toc" id="toc">\n` +
    `    <h1>${escapeXml(args.title)}</h1>\n` +
    `    <ol>\n` +
    `      <li><a href="chapter.xhtml">Chapter</a></li>\n` +
    `    </ol>\n` +
    `  </nav>\n` +
    `</body>\n` +
    `</html>\n`;
}

function buildChapterXhtml(args: {
  title: string;
  lang: string;
  sanitizedHtml: string;
}) {
  const css = `
body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.55; margin: 0; padding: 0; }
.wrap { max-width: 48rem; margin: 0 auto; padding: 1.25rem; }
h1,h2,h3 { line-height: 1.15; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
img { max-width: 100%; height: auto; }
blockquote { border-left: 3px solid #999; padding-left: 0.9rem; margin-left: 0; color: #444; }
`.trim();

  return `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<!DOCTYPE html>\n` +
    `<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeHtmlAttribute(args.lang)}">\n` +
    `<head>\n` +
    `  <title>${escapeXml(args.title)}</title>\n` +
    `  <meta charset="utf-8"/>\n` +
    `  <style>${css}</style>\n` +
    `</head>\n` +
    `<body>\n` +
    `  <div class="wrap">\n` +
    `    ${args.sanitizedHtml}\n` +
    `  </div>\n` +
    `</body>\n` +
    `</html>\n`;
}

function buildContentOpf(args: {
  title: string;
  author?: string;
  lang: string;
  identifier: string;
}) {
  const authorLine = args.author?.trim()
    ? `    <dc:creator>${escapeXml(args.author.trim())}</dc:creator>\n`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">\n` +
    `  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
    `    <dc:identifier id="bookid">${escapeXml(args.identifier)}</dc:identifier>\n` +
    `    <dc:title>${escapeXml(args.title)}</dc:title>\n` +
    authorLine +
    `    <dc:language>${escapeXml(args.lang)}</dc:language>\n` +
    `  </metadata>\n` +
    `  <manifest>\n` +
    `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n` +
    `    <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>\n` +
    `  </manifest>\n` +
    `  <spine>\n` +
    `    <itemref idref="chapter"/>\n` +
    `  </spine>\n` +
    `</package>\n`;
}

export function markdownToEpubBytes(
  markdown: string,
  options: MarkdownToEpubOptions,
): MarkdownToEpubResult {
  const title = options.title.trim() || "Untitled";
  const lang = options.language?.trim() || "en";
  const identifier = options.identifier?.trim() || crypto.randomUUID();

  const html = marked.parse(markdown, { gfm: true });
  if (typeof html !== "string") {
    throw new Error("Markdown parser returned unexpected async output");
  }
  const sanitizedHtml = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });

  const encoder = new TextEncoder();

  const epubBytes = zipSync(
    {
      // Note: EPUB wants `mimetype` stored uncompressed and first.
      // `zipSync` doesn't guarantee "stored", but this is still widely accepted.
      // If we need strict compliance, we can switch to fflate streaming Zip.
      mimetype: encoder.encode("application/epub+zip"),
      "META-INF/container.xml": encoder.encode(buildContainerXml()),
      "OEBPS/content.opf": encoder.encode(
        buildContentOpf({
          title,
          author: options.author,
          lang,
          identifier,
        }),
      ),
      "OEBPS/nav.xhtml": encoder.encode(buildNavXhtml({ title, lang })),
      "OEBPS/chapter.xhtml": encoder.encode(
        buildChapterXhtml({ title, lang, sanitizedHtml }),
      ),
    },
    { level: 6 },
  );
  const filename = `${safeBaseName(title)}.epub`;
  return { filename, epubBytes };
}

