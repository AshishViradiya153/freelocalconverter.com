import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "pagination-and-large-csv-files",
  title:
    "Pagination and performance: working with large CSV files in the browser",
  description:
    "Why paginated grids help with big tables, how virtual scrolling relates to page size, and what to expect when opening wide or long CSV exports.",
  publishedAt: "2025-03-22",
  category: "insights",
  readTimeMinutes: 7,
  keywords: [
    "large csv file",
    "csv performance",
    "virtual scrolling",
    "paginated table",
  ],
};

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        Opening a &quot;large&quot; CSV means different things to different
        teams: a <strong>long</strong> file (many rows), a <strong>wide</strong>{" "}
        file (many columns), or both. Browsers are capable of impressive work,
        but they are not unlimited databases. Well-designed viewers combine{" "}
        <strong>pagination</strong> (show a subset of rows per screen),{" "}
        <strong>virtualization</strong> (render only rows near the viewport),
        and <strong>import caps</strong> (reject or truncate files beyond safe
        limits) to keep the UI responsive.
      </p>

      <h2>What pagination changes for you</h2>
      <p>
        Pagination splits the sorted, filtered result into pages, e.g. 10, 20,
        50, 100, 500 rows, or &quot;all&quot; when the dataset is small enough.
        Benefits include faster initial paint, less DOM work, and clearer mental
        models when you present data to stakeholders (&quot;here is page 3 of
        refunds this week&quot;).
      </p>
      <p>
        Trade-off: any operation that only scans the{" "}
        <strong>current page</strong> (such as search highlights) may need you
        to switch to <strong>show all rows</strong> for exhaustive scans, or use
        filters to reduce the universe of rows first. Our app documents this
        behavior so you can choose page size deliberately.
      </p>

      <h2>Virtual scrolling vs. pagination</h2>
      <p>
        <strong>Virtual scrolling</strong> reuses row elements as you scroll,
        which makes tall grids feel continuous even when tens of thousands of
        rows exist <em>on the current page</em>. Pagination and virtualization
        solve different layers: pagination limits how many rows participate in
        the active row model; virtualization limits how many row nodes mount in
        the DOM. Together they keep both memory and layout work predictable.
      </p>

      <h2>Global market context</h2>
      <p>
        As more regions adopt stricter <strong>data residency</strong> and{" "}
        <strong>privacy</strong> rules, teams increasingly prefer tools that
        process CSVs <strong>on device</strong> instead of shipping raw tables
        to multi-tenant SaaS analytics layers for simple review. Pagination is
        part of that story: it signals honest boundaries about what the browser
        can chew through without freezing the tab.
      </p>

      <h2>Recommendations</h2>
      <ul>
        <li>
          Prefer <strong>smaller page sizes</strong> when editing intensively;
          use <strong>larger</strong> or <strong>all</strong> for pattern
          scanning after filtering.
        </li>
        <li>
          Pre-aggregate in your warehouse when possible; viewers are for
          inspection, not replacing ETL.
        </li>
        <li>
          For files beyond product limits, split by date or region upstream
          rather than forcing a single mega-export.
        </li>
      </ul>
    </BlogProse>
  );
}
