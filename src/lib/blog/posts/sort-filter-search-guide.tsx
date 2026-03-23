import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "sort-filter-search-guide",
  title: "Sort, filter, and search: finding answers in large CSV tables",
  description:
    "Step-by-step patterns for sorting columns, applying filters, and searching cell text in browser-based CSV grids, plus tips for faster QA on exports.",
  publishedAt: "2025-03-22",
  category: "guide",
  readTimeMinutes: 8,
  keywords: [
    "sort csv",
    "filter csv",
    "search spreadsheet",
    "data grid filter",
  ],
};

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        Once a CSV is loaded into a grid, most questions boil down to three
        operations: <strong>sort</strong> (order rows), <strong>filter</strong>{" "}
        (hide rows that do not match), and <strong>search</strong> (jump to
        literal text matches). Together they mirror how analysts explore tables
        in SQL or BI tools, but in a lightweight, interactive surface that loads
        in seconds.
      </p>

      <h2>Sorting: establish a baseline order</h2>
      <p>
        Sorting by a <strong>date</strong> or <strong>ID</strong> column is the
        fastest way to see newest records, find duplicates, or verify monotonic
        sequences. Sorting <strong>numeric</strong> columns surfaces outliers
        (unexpectedly large amounts, negative inventory). For{" "}
        <strong>text</strong> columns, lexical order helps group brands,
        regions, or campaign names, even before you add explicit filters.
      </p>
      <p>
        In our viewer, column headers expose sort actions so you do not need to
        remember shortcuts. After sorting, scroll the virtualized grid: only
        visible rows are heavily rendered, which keeps interaction smooth on
        wide files with tens of thousands of rows (subject to import limits).
      </p>

      <h2>Filtering: narrow to the slice you care about</h2>
      <p>
        Filters answer questions like &quot;show only <em>status = paid</em>
        &quot; or &quot;hide empty <em>email</em>&quot;. Good filters treat
        column types sensibly: numbers as numeric comparisons, dates as
        chronological ranges, and text as faceted or substring matches depending
        on the implementation.
      </p>
      <ul>
        <li>
          Start with the <strong>highest cardinality</strong> column only if
          necessary; over-filtering early can hide data issues elsewhere.
        </li>
        <li>
          Combine filters when debugging pipelines: e.g. same{" "}
          <code className="text-foreground">order_id</code> should align across
          fact and dimension extracts.
        </li>
        <li>
          Clear filters before exporting if you need the <strong>full</strong>{" "}
          dataset in the download.
        </li>
      </ul>

      <h2>Search: literal match across visible data</h2>
      <p>
        Search complements filters: use it when you know a{" "}
        <strong>specific string</strong> (SKU fragment, email domain, error
        code) and want the grid to highlight matching cells and step through
        occurrences. Literal search is predictable for QA; regex-heavy search
        (where offered) is powerful but requires care so broad patterns do not
        miss edge cases.
      </p>
      <p>
        On <strong>paginated</strong> grids, search may be scoped to the current
        page or to all loaded rows depending on the product. Check your
        tool&apos;s behavior so you do not assume coverage across pages when it
        is not there.
      </p>

      <h2>Practical QA checklist</h2>
      <ul>
        <li>Header row present; no shifted columns in the first 100 rows.</li>
        <li>
          Expected row count vs. source system (ballpark) after filters cleared.
        </li>
        <li>Key columns have no surprising nulls after sort.</li>
        <li>
          Cross-check one known entity (account, SKU) via search end-to-end.
        </li>
      </ul>
    </BlogProse>
  );
}
