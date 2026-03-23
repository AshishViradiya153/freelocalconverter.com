import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "csv-compare-two-files-browser",
  title: "Compare two CSV files in the browser (side by side, locally)",
  description:
    "How browser-based CSV compare works: matching columns, row alignment, difference counts, and when to pre-process exports—plus where to try it in Table.",
  publishedAt: "2025-03-22",
  category: "guide",
  readTimeMinutes: 7,
  keywords: [
    "compare csv files",
    "csv diff browser",
    "side by side csv",
    "local csv compare",
  ],
};

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        Comparing two CSV exports sounds trivial until you factor in{" "}
        <strong>column order</strong>, <strong>escaped commas</strong>, and{" "}
        <strong>policy constraints</strong> that make uploading both files to a
        random online merger unacceptable. A browser-based grid can keep both
        datasets on the device while still giving humans sortable, filterable
        tables instead of raw diff text.
      </p>

      <h2>Row alignment: what “compare” usually means first</h2>
      <p>
        Most lightweight compare flows line up{" "}
        <strong>row one with row one</strong>, <strong>row two with row two</strong>
        , and so on, after each file parses. That works beautifully when both
        exports came from the same query with a stable sort, or when you only
        need to verify a vendor replaced the entire file and row counts match.
      </p>
      <p>
        When row order is meaningless—think user ids that appear in different
        sequences—you should <strong>sort both files by the same key</strong>{" "}
        in a trusted environment first, then compare. Otherwise you will see
        false positives even though the underlying entities match.
      </p>

      <h2>Column parity before trusting automatic stats</h2>
      <p>
        Automatic cell-diff counts depend on the same logical columns appearing
        in the <strong>same order</strong> with compatible headers. Renamed
        fields, extra trailing columns, or a reordered export profile will break
        that assumption. Good tools still render both grids for visual review,
        but they should stop short of claiming “37 cells differ” when fields
        are misaligned.
      </p>
      <ul>
        <li>
          Normalize headers at the source when you control the pipeline (ERP,
          warehouse, Shopify reporting app).
        </li>
        <li>
          Document the export profile version next to the filename so QA knows
          which layout to expect.
        </li>
        <li>
          When structures diverge, use filters and search per column rather than
          relying on aggregate diff numbers.
        </li>
      </ul>

      <h2>Privacy and performance habits</h2>
      <p>
        Treat compare sessions like any other CSV review: use managed devices,
        avoid public Wi‑Fi for sensitive extracts, and clear browser state on
        shared machines when finished. Local parsing avoids uploading two files
        at once, which is exactly when data-loss concerns spike for security
        reviewers.
      </p>
      <p>
        Very wide or tall files still stress memory. Respect the product&apos;s
        import limits, split extracts when needed, and compare slices that
        represent the business question—one region, one day, one account
        segment—before you attempt full-file analysis.
      </p>

      <h2>Try it in Table</h2>
      <p>
        Table includes a dedicated{" "}
        <Link
          href="/compare"
          className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/90"
        >
          Compare
        </Link>{" "}
        page: load a left and right CSV, read the summary when columns match,
        optionally show only rows with differences, and use the same search and
        filter affordances you expect from the main grid—in read-only mode so
        you do not accidentally overwrite a reference extract.
      </p>
      <p>
        For structured landing copy and internal links from our guides and tools
        hub, see the programmatic pages about{" "}
        <strong>browser CSV compare</strong> and{" "}
        <strong>compare workflows</strong> linked from the Guides and Tools
        sections of the site.
      </p>
    </BlogProse>
  );
}
