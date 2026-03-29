import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { normalizeSiteBase } from "@/lib/seo/paths";

export interface LlmsSection {
  heading: string;
  blurb?: string;
  items: Array<{ path: string; label: string; detail?: string }>;
}

export const LLMS_SECTIONS: LlmsSection[] = [
  {
    heading: "Primary entry points",
    items: [
      {
        path: "/",
        label: "Home",
        detail: "Product overview and tool directory.",
      },
      {
        path: "/tools",
        label: "Tools hub",
        detail: "Category index of workflows and landing pages.",
      },
      {
        path: "/guides",
        label: "Guides hub",
        detail: "Long-form guides on CSV workflows, grids, and compare.",
      },
      {
        path: "/blog",
        label: "Blog",
        detail: "Articles on CSV workflows, privacy, and tooling.",
      },
    ],
  },
  {
    heading: "Data conversion (CSV, JSON, Parquet, Markdown)",
    blurb: "Tabular and columnar interchange between common formats.",
    items: [
      { path: "/csv-to-json", label: "CSV to JSON" },
      { path: "/json-to-csv", label: "JSON to CSV" },
      { path: "/csv-to-parquet", label: "CSV to Parquet" },
      { path: "/parquet-to-csv", label: "Parquet to CSV" },
      { path: "/json-to-parquet", label: "JSON to Parquet" },
      { path: "/parquet-to-json", label: "Parquet to JSON" },
      { path: "/csv-to-markdown-table", label: "CSV to Markdown table" },
      {
        path: "/markdown-html-converter",
        label: "Markdown HTML converter",
        detail:
          "Convert Markdown ↔ HTML with GFM tables and live preview; sanitized output.",
      },
      {
        path: "/csv-to-sql",
        label: "CSV to SQL",
        detail:
          "CREATE TABLE sketch and batched INSERTs (PostgreSQL, MySQL, SQLite); local parsing.",
      },
    ],
  },
  {
    heading: "Viewers & compare",
    blurb: "Open, explore, and diff datasets in the browser.",
    items: [
      {
        path: "/csv-viewer",
        label: "CSV viewer",
        detail: "Sort, filter, and edit CSV locally.",
      },
      {
        path: "/compare",
        label: "CSV compare",
        detail: "Diff two CSV files side by side.",
      },
      { path: "/xls-viewer", label: "XLS / XLSX viewer" },
      { path: "/parquet-viewer", label: "Parquet viewer" },
    ],
  },
  {
    heading: "Excel workflows",
    items: [
      { path: "/csv-to-excel", label: "CSV to Excel" },
      { path: "/xls-to-csv", label: "Excel (XLS/XLSX) to CSV" },
      { path: "/json-to-excel", label: "JSON to Excel" },
    ],
  },
  {
    heading: "Spreadsheet-style grids",
    blurb: "Interactive table UIs for editing and rendering data.",
    items: [
      { path: "/data-grid", label: "Data grid" },
      { path: "/data-grid-live", label: "Data grid (live)" },
      { path: "/data-grid-render", label: "Data grid render" },
    ],
  },
  {
    heading: "Developer & API utilities",
    blurb: "HTTP clients, specs, and payload inspection.",
    items: [
      {
        path: "/json-formatter",
        label: "JSON formatter",
        detail: "Format and validate JSON locally.",
      },
      {
        path: "/sql-formatter",
        label: "SQL formatter",
        detail:
          "Pretty-print SQL with dialect-aware parsing; read-only, local.",
      },
      {
        path: "/json-yaml-converter",
        label: "JSON YAML converter",
        detail: "Convert between JSON and YAML locally.",
      },
      {
        path: "/markdown-html-converter",
        label: "Markdown HTML converter",
        detail: "Markdown ↔ HTML with GFM and live preview; sanitized HTML.",
      },
      {
        path: "/jwt-decoder",
        label: "JWT decoder",
        detail:
          "Decode JWT header and payload locally; signatures not verified.",
      },
      {
        path: "/cron-parser",
        label: "Cron parser",
        detail:
          "Five-field cron, next run preview, English phrases to cron; local.",
      },
      {
        path: "/uuid-generator",
        label: "UUID / GUID generator",
        detail:
          "Bulk v1, v4, v7, and nil UUIDs; uppercase, hyphens, braces; Web Crypto.",
      },
      {
        path: "/base64-converter",
        label: "Base64 encoder & decoder",
        detail: "UTF-8 text and files; optional Base64URL and line wrap.",
      },
      {
        path: "/unix-timestamp-converter",
        label: "Unix timestamp converter",
        detail:
          "Epoch seconds or ms to human time and back; IANA timezones; local only.",
      },
      {
        path: "/regex-tester",
        label: "Regex tester",
        detail:
          "JavaScript RegExp with flags, multiline subject, groups; capped matches.",
      },
      { path: "/curl-converter", label: "cURL converter" },
      { path: "/fetch-converter", label: "fetch() converter" },
      { path: "/axios-converter", label: "Axios converter" },
      {
        path: "/python-requests-converter",
        label: "Python requests converter",
      },
      {
        path: "/request-converter",
        label: "Request converter",
        detail: "Convert between HTTP client styles.",
      },
      { path: "/http-explainer", label: "HTTP explainer" },
      { path: "/openapi-viewer", label: "OpenAPI viewer" },
      { path: "/graphql-tools", label: "GraphQL tools" },
      { path: "/webhook-viewer", label: "Webhook viewer" },
    ],
  },
  {
    heading: "PDF",
    items: [
      { path: "/pdf-to-word", label: "PDF to Word" },
      { path: "/split-pdf", label: "Split PDF" },
      { path: "/reorder-pdf", label: "Reorder PDF pages" },
      { path: "/merge-pdf", label: "Merge PDF" },
      { path: "/pdf-to-image", label: "PDF to image" },
      { path: "/images-to-pdf", label: "Images to PDF" },
      { path: "/pdf-watermark", label: "PDF watermark" },
      { path: "/bulk-pdf-watermark", label: "Bulk PDF watermark" },
    ],
  },
  {
    heading: "Video",
    items: [{ path: "/video-compress", label: "Video compress" }],
  },
  {
    heading: "Images",
    blurb:
      "Resize, compress, convert formats, and specialized exports. Pair-specific conversion URLs live under `/image-convert/{pair}` (programmatic SEO).",
    items: [
      { path: "/image-compress", label: "Image compress" },
      { path: "/image-convert", label: "Image convert hub" },
      { path: "/image-resize", label: "Image resize" },
      { path: "/heic-to-jpg", label: "HEIC to JPG" },
      { path: "/linkedin-banner", label: "LinkedIn banner maker" },
      { path: "/svg-to-code", label: "SVG to code" },
    ],
  },
  {
    heading: "Color & gradients",
    items: [
      { path: "/palettes/trending", label: "Trending color palettes" },
      { path: "/palettes/best", label: "Best / curated palettes" },
      { path: "/gradients", label: "Gradient generator" },
      { path: "/gradients/best", label: "Best / curated gradients" },
      { path: "/gradient-generator", label: "Mesh gradient generator" },
      {
        path: "/gradient-generator/trending",
        label: "Trending mesh gradients",
      },
    ],
  },
  {
    heading: "Policies, repo, and discovery",
    items: [
      {
        path: "/privacy",
        label: "Privacy",
        detail: "Data handling; aligned with local-first processing.",
      },
      { path: "/terms", label: "Terms" },
      {
        path: "/sitemap.xml",
        label: "Sitemap index",
        detail:
          "Machine-readable URLs, including programmatic routes where configured.",
      },
      {
        path: "/robots.txt",
        label: "robots.txt",
        detail: "Crawl rules and sitemap references.",
      },
    ],
  },
];

function abs(base: string, path: string): string {
  if (path === "/") return `${base}/`;
  return `${base}${path}`;
}

export function buildLlmsTxtBody(): string {
  const base = normalizeSiteBase();
  const name = siteConfig.name;
  const tagline = siteConfig.description;
  const localeList = routing.locales
    .filter((l) => l !== routing.defaultLocale)
    .join(", ");

  const sectionBlocks = LLMS_SECTIONS.map((section) => {
    const intro = section.blurb ? `\n${section.blurb}\n` : "\n";
    const lines = section.items.map((item) => {
      const url = abs(base, item.path);
      const suffix = item.detail ? ` — ${item.detail}` : "";
      return `- [${item.label}](${url})${suffix}`;
    });
    return `## ${section.heading}${intro}${lines.join("\n")}`;
  }).join("\n\n");

  return `# ${name}

> ${tagline} Processing is intended to run locally in the visitor's browser where a tool supports it; sensitive file contents are not sent to our servers for those client-side flows. The site is multilingual: English URLs omit a locale prefix (\`localePrefix: as-needed\` in next-intl). Other locales use paths like \`/de/...\`, \`/fr/...\`, etc.

${sectionBlocks}

## Open source

- Source code: ${siteConfig.links.github}

## For automated agents

Prefer localized URLs when the user's language is known. Paths above are English defaults; use \`${base}/{locale}/path\` for non-English locales (${localeList}).
`;
}
