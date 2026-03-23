import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "export-and-download-csv",
  title: "Export and download: turning your edited grid back into a CSV file",
  description:
    "Best practices for downloading CSV from a browser viewer, preserving headers, handling commas in fields, and handing off to Excel, databases, or pipelines.",
  publishedAt: "2025-03-22",
  category: "guide",
  readTimeMinutes: 6,
  keywords: [
    "download csv",
    "export csv from browser",
    "csv utf-8",
    "csv escape",
  ],
};

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        The last mile of a browser-based workflow is <strong>export</strong>:
        you want a file that opens cleanly in Excel, loads into Snowflake or
        BigQuery, or attaches to a ticket without broken quoting. A solid
        exporter writes <strong>RFC-style CSV</strong> with proper delimiters,
        escaped quotes inside fields, and a consistent newline strategy.
      </p>

      <h2>What a good export includes</h2>
      <ul>
        <li>
          A <strong>header row</strong> aligned with column order in the grid.
        </li>
        <li>
          <strong>UTF-8</strong> encoding (with BOM only if your downstream
          Windows Excel workflow still requires it, many modern stacks prefer
          plain UTF-8).
        </li>
        <li>
          Stable column ordering after <strong>reorders</strong> in the UI.
        </li>
        <li>
          Filename hinting source and date, e.g.{" "}
          <code className="text-foreground">orders_cleaned_2025-03-22.csv</code>
          .
        </li>
      </ul>

      <h2>Common pitfalls</h2>
      <p>
        <strong>Commas and quotes</strong> inside text fields must be wrapped
        and inner quotes doubled, otherwise rows shift and imports fail silently
        or misalign. <strong>Locale-specific numbers</strong> (1.234,56 vs
        1,234.56) confuse parsers; normalize to a single decimal convention
        before feeding strict numeric columns. <strong>Leading zeros</strong> in
        IDs can be stripped if a tool coerces to number, keep such columns as
        text.
      </p>

      <h2>Handoff checklist</h2>
      <ul>
        <li>
          Open the downloaded file in a second tool to spot encoding issues.
        </li>
        <li>
          Confirm row count vs. grid after clearing filters if you expect a full
          export.
        </li>
        <li>
          Document what changed versus the original extract for compliance or
          SOX-style trails where needed.
        </li>
      </ul>
      <p>
        Our viewer&apos;s download flow is built around these realities so you
        can move from exploration to production systems without surprises.
      </p>
    </BlogProse>
  );
}
