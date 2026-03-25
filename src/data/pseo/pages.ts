/**
 * Programmatic page source data. At very large scale, replace this module with
 * generated JSON, a CMS, or a database loader that outputs the same shape.
 * Runtime validation lives in `@/lib/pseo/data` (Zod + safeguards).
 */
export const rawPseoPages = [
  {
    id: "guide-open-large-csv-without-excel",
    template: "guide",
    route: { type: "guide" },
    slug: "open-large-csv-without-excel",
    primaryKeyword: "open large csv without excel",
    secondaryKeywords: [
      "csv too big for excel",
      "browser csv viewer",
      "local csv grid",
    ],
    title: "Open large CSV files without Excel: a practical browser workflow",
    metaDescription:
      "When Excel slows down or truncates rows, use a browser-based grid to sort, filter, and review big CSV files locally with Table before you export a smaller slice.",
    heroHeading: "How to open and review very large CSV files without Excel",
    intro: [
      "Spreadsheet desktop apps are unbeatable for quick edits, but they are not always the right place for the first pass on a multi-hundred-megabyte extract. Memory limits, slow filters, and accidental type coercion can turn a simple QA task into a fragile workaround.",
      "A browser-based data grid can stream parsing work through the JavaScript runtime you already have open, keep the file on your machine, and pair scrolling with search, column reorder, and pagination so you inspect one slice at a time.",
    ],
    sections: [
      {
        heading: "Why large CSVs break familiar desktop habits",
        paragraphs: [
          "Very tall files stress row buffers, while very wide files multiply formula and format metadata. Excel and similar tools may still open the file, yet sorting a key column or applying a filter across millions of cells can freeze the UI long enough that teams avoid the task entirely.",
          "CSV itself is simple text, which is why pipelines love it. The complexity is almost always in the viewer: how it detects delimiters, how it guesses numeric columns, and how much it tries to render at once. Choosing a viewer that treats the grid as a window on the data, not a full workbook, usually restores control.",
        ],
      },
      {
        heading: "What to do before you import anywhere",
        paragraphs: [
          "Confirm encoding expectations with whoever produced the extract. UTF-8 is standard for modern systems, yet finance and ERP exports sometimes arrive in legacy encodings that make headers look garbled until you normalize the file.",
          "If the source can split by date range, region, or account segment, ask for a narrower pull. Even a strong browser viewer benefits from sane upstream boundaries because you spend less time waiting and more time validating the rows that matter for this decision.",
        ],
      },
      {
        heading: "How Table fits this workflow",
        paragraphs: [
          "Table parses CSV in your browser so you can load a file, move columns next to each other for comparison, and use undo-friendly edits when you spot bad values. Pagination reduces how many rows the interface hydrates at once, which keeps scrolling responsive on dense extracts.",
          "When you only need a corrected subset for stakeholders, export CSV, JSON, or Excel after you filter down. That pattern mirrors how data teams already work in notebooks, but with a grid UI non-engineers can drive.",
        ],
      },
    ],
    faqs: [
      {
        question: "Will a browser handle more rows than Excel?",
        answer:
          "It depends on width, device memory, and how the app renders rows. Table applies import limits to keep sessions stable. If you are near the cap, split the extract upstream or aggregate before loading.",
      },
      {
        question: "Does uploading my CSV to Table send data to your servers?",
        answer:
          "Table is designed for local parsing in the browser. Check the Privacy page for the current policy wording. You should still follow your company rules for regulated data on shared machines.",
      },
      {
        question: "Can I edit cells and keep formulas like Excel?",
        answer:
          "Table focuses on tabular text editing, sorting, filtering, and export rather than a full spreadsheet calculation engine. Treat it as a fast review surface, then move modeled work to your spreadsheet or warehouse tool of choice.",
      },
    ],
    relatedSlugs: [
      "prepare-csv-for-google-sheets",
      "browser-csv-grid-local-review",
      "compare-two-csv-files-browser",
    ],
    publishedAt: "2025-03-18",
    readTimeMinutes: 8,
  },
  {
    id: "guide-prepare-csv-google-sheets",
    template: "guide",
    route: { type: "guide" },
    slug: "prepare-csv-for-google-sheets",
    primaryKeyword: "prepare csv for google sheets",
    secondaryKeywords: [
      "csv google sheets import",
      "normalize csv columns",
      "csv date format sheets",
    ],
    title: "Prepare CSV files for Google Sheets: clean structure before import",
    metaDescription:
      "Normalize headers, dates, and delimiters so Google Sheets imports your CSV without silent errors. Use a local grid to validate rows before you sync cloud spreadsheets.",
    heroHeading: "Prepare CSV data so Google Sheets imports stay reliable",
    intro: [
      "Google Sheets is forgiving until it is not: a single rogue quote can shift columns, locale-specific numbers become text, and timestamps import as strings that sort incorrectly. Most failures trace back to the CSV itself, not the Sheets UI.",
      "Reviewing the flat file in a dedicated grid first lets you spot structural problems early, reorder columns for human readers, and export a cleaned variant without round-tripping through multiple cloud uploads.",
    ],
    sections: [
      {
        heading: "Headers, delimiters, and quoting",
        paragraphs: [
          "Sheets expects a consistent delimiter and a single header row without blank lines above it. Embedded newlines inside quoted fields are valid CSV, yet many hand-edited files break quoting and create ragged rows that confuse importers.",
          "If your team mixes European decimal commas with comma delimiters, consider switching the export to TSV upstream or enforcing explicit quoting around affected columns. Document the choice so vendors stop sending ambiguous files.",
        ],
      },
      {
        heading: "Dates, currencies, and ID columns",
        paragraphs: [
          "Store ISO-8601 dates when possible so Sheets parses chronology without locale guessing. For currency, either keep a dedicated currency code column or store minor units as integers to avoid floating point surprises.",
          "Leading zeros in SKU or ZIP fields disappear when a column is interpreted as numeric. Mark those columns as text in the source system or prepend a safe prefix during export so the grid preserves fidelity.",
        ],
      },
      {
        heading: "Use Table before you upload",
        paragraphs: [
          "Load the CSV locally in Table, search for suspicious patterns like double commas or inconsistent row length, and hide columns that are not part of this review. When the subset looks stable, download a fresh CSV and import that into Sheets.",
          "That sequence keeps sensitive operational data off unnecessary services during the messiest cleanup phase, while still landing in Sheets for collaboration once structure is trustworthy.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why does Google Sheets split my CSV into the wrong columns?",
        answer:
          "Usually a missing quote, wrong delimiter, or inconsistent row width. Inspect the raw file around the first bad line. A grid viewer helps because you can scroll while keeping headers aligned.",
      },
      {
        question: "Should I use CSV or Excel format for Sheets?",
        answer:
          "CSV is lighter and pipeline friendly. XLSX preserves types and multiple sheets but can hide formatting complexity. Pick based on whether you need strict text fidelity or richer typing.",
      },
    ],
    relatedSlugs: [
      "open-large-csv-without-excel",
      "shopify-order-csv-qa-checklist",
      "compare-two-csv-files-browser",
    ],
    publishedAt: "2025-03-18",
    readTimeMinutes: 7,
  },
  {
    id: "guide-compare-two-csv-files-browser",
    template: "guide",
    route: { type: "guide" },
    slug: "compare-two-csv-files-browser",
    primaryKeyword: "compare two csv files in browser",
    secondaryKeywords: [
      "csv diff browser",
      "side by side csv compare",
      "local csv comparison tool",
    ],
    title: "Compare two CSV files in-browser: local diff, rows, and privacy",
    metaDescription:
      "Learn how to compare two CSV exports locally in the browser: when column layouts match, count differing cells, filter to changed rows, and keep files off the server with Table.",
    heroHeading: "Compare two CSV files locally before you merge or import",
    intro: [
      "Teams compare CSVs every week: yesterday versus today warehouse snapshots, staging versus production extracts, vendor resends after a disputed totals call, or finance copies before ERP ingestion. Spreadsheets work until width, row count, or policy blocks uploading the second file next to the first.",
      "A browser workflow can load both files on the same machine, summarize whether headers line up, and surface row-level differences without routing bytes through a shared SaaS account you do not control.",
      "Table exposes a dedicated compare mode at /compare: pick a left and right CSV, review read-only grids, and, when column keys match in the same order, see how many cells differ and optionally hide identical rows so reviewers focus on what changed.",
    ],
    sections: [
      {
        heading: "When side-by-side compare beats diff utilities",
        paragraphs: [
          "Classic text diff tools excel at line-by-byte comparisons, yet CSV semantics are columnar. A single shifted comma can make two logically identical business rows look unrelated in a plain diff, while a grid preserves columns, types, and human-readable headers.",
          "Visual grids also help stakeholders who do not read unified diff output daily. Sorting, filtering, and search still apply in read-only compare views so you can isolate one SKU, one store, or one date range while keeping the other file aligned row index by row index.",
        ],
      },
      {
        heading: "What “matching columns” means for automatic stats",
        paragraphs: [
          "Table compares cells row index to row index after both files parse. Automatic counts require the same derived column keys in the same order, typically true when both exports share an identical header row and delimiter discipline.",
          "If one vendor renamed a field, inserted a column, or reordered headers, the tool still renders both grids for manual review, but numeric diff summaries pause so you are not misled by misaligned fields. Normalize headers upstream or export from the same profile when you need strict comparability.",
        ],
      },
      {
        heading: "Privacy, performance, and practical habits",
        paragraphs: [
          "Parsing stays in the browser for compare mode just like the main viewer. Follow the same rules you would for regulated extracts: use trusted devices, clear sessions on shared laptops, and avoid comparing live PII on untrusted networks even when data never hits our servers.",
          "Large files hit the same import caps as the editor. Split extracts by date or region when you approach limits, then compare the smaller slices. When you only need to prove a handful of rows changed, filter each grid after loading to shrink cognitive load before you scan for differences.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does compare mode upload my CSVs?",
        answer:
          "No. Both files are parsed locally in your browser. Check the Privacy page for the latest policy language and your internal data-handling rules for sensitive extracts.",
      },
      {
        question: "Can Table align rows by a primary key instead of line number?",
        answer:
          "The shipped compare flow aligns by row index after import. For key-based joins, sort both files by the same stable key in another tool or script first, or export ordered extracts from your warehouse so row order reflects the join you care about.",
      },
      {
        question: "Where do I start in the product?",
        answer:
          "Open the Compare page from the site navigation, load left and right files, read the summary card, then toggle “only rows with differences” when columns match and you want a tighter review surface.",
      },
    ],
    relatedSlugs: [
      "browser-csv-compare-side-by-side",
      "open-large-csv-without-excel",
      "browser-csv-grid-local-review",
    ],
    publishedAt: "2025-03-22",
    readTimeMinutes: 8,
  },
  {
    id: "tool-browser-csv-grid-local-review",
    template: "tool",
    route: { type: "tool", category: "csv-viewers" },
    slug: "browser-csv-grid-local-review",
    primaryKeyword: "browser csv grid local review",
    secondaryKeywords: [
      "local csv editor",
      "privacy csv tool",
      "tanstack table csv",
    ],
    title: "Browser CSV grid for local review: sort, filter, and export safely",
    metaDescription:
      "Use Table as a privacy-minded browser grid to open CSV files locally, reorder columns, paginate huge extracts, and export cleaned results without sending your file to a server.",
    heroHeading: "A browser grid built for local CSV review and export",
    intro: [
      "Security teams increasingly push back on uploading vendor extracts to generic online converters. You still need a fast interface for triage: find the bad rows, confirm totals, and share a smaller CSV with finance or support.",
      "Table focuses on that middle step. It combines spreadsheet-like interactions with a local execution model so you keep control of where bytes live during cleanup.",
      "For regulated teams, keeping the file in-memory on your machine can satisfy internal security review faster than proving data residency for every cloud tool.",
    ],
    sections: [
      {
        heading: "What you can do in the grid",
        paragraphs: [
          "Sort and filter columns, run text search across the current view, reorder rows when you need a manual sequence, and step through pagination when the file is too tall to render at once.",
          "Undo and redo cover exploratory edits, while exports give you CSV, JSON, or Excel when the stakeholder wants a familiar format. Column visibility changes help you build a narrative without deleting underlying fields prematurely.",
        ],
      },
      {
        heading: "When this beats a cloud spreadsheet",
        paragraphs: [
          "Cloud spreadsheets are collaborative by default, which is ideal for planning and shared models. They are heavier than necessary when you only need a read-mostly QA pass on a sensitive extract or a one-off vendor dump.",
          "Starting in a lightweight local grid reduces accidental sharing, speeds first load for text-heavy files, and pairs well with later uploads once you have a curated slice.",
        ],
      },
      {
        heading: "Operational habits that scale",
        paragraphs: [
          "Pair local review with documented retention rules. Clear session data when you finish on shared laptops, and prefer split extracts from the warehouse when files approach technical limits.",
          "As your page library grows, hub pages and related links help teams discover the right checklist for each CSV source without searching a shared drive blindly.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Table a replacement for Excel or Google Sheets?",
        answer:
          "No. It is optimized for CSV review, light edits, and export. Use spreadsheets or BI tools for models, pivots, and team formulas once the file structure is trustworthy.",
      },
      {
        question: "Can I automate imports from my ERP into Table?",
        answer:
          "Automation belongs upstream: schedule extracts, land them in secure storage, then open the CSV manually in the browser when you need human judgment. API-based ingestion is a different product surface.",
      },
    ],
    relatedSlugs: [
      "open-large-csv-without-excel",
      "shopify-order-csv-qa-checklist",
      "compare-two-csv-files-browser",
      "browser-csv-compare-side-by-side",
    ],
    publishedAt: "2025-03-18",
    readTimeMinutes: 6,
  },
  {
    id: "tool-browser-csv-compare-side-by-side",
    template: "tool",
    route: { type: "tool", category: "csv-viewers" },
    slug: "browser-csv-compare-side-by-side",
    primaryKeyword: "browser csv compare side by side",
    secondaryKeywords: [
      "compare csv files online local",
      "csv diff two files",
      "privacy csv compare",
    ],
    title:
      "Browser CSV compare side by side: local two-file diff with row filters",
    metaDescription:
      "Use Table to load two CSV files side by side in the browser. When headers match, see differing cell counts, jump to changed rows only, and keep both extracts on your device.",
    heroHeading: "Side-by-side CSV compare built for privacy-conscious reviews",
    intro: [
      "Operations and data teams rarely need a heavyweight ETL job when the question is simply whether two flat files diverge. They need fast optics: row counts, column parity, and a tight list of rows that changed between exports.",
      "Table’s compare experience mirrors the main grid: familiar sorting, filtering, and search, but read-only so reviewers do not accidentally overwrite a golden extract while chasing deltas.",
      "Because both files parse entirely in the browser, you can run the workflow on VPN-protected laptops or air-gapped-adjacent setups where uploading a second CSV to a random “merge” website is off limits.",
    ],
    sections: [
      {
        heading: "How the two-panel layout helps reviewers",
        paragraphs: [
          "Left and right pickers keep responsibilities obvious: staging on one side, production on the other, or this week versus last week. After both files load, a summary explains whether column structures align and quantifies how many rows and cells diverge.",
          "When structures match, a checkbox trims the grids to rows with any difference so you are not scrolling thousands of identical lines. Each panel keeps its own pagination and filters, which helps when one side is wider but you only care about overlapping keys.",
        ],
      },
      {
        heading: "Limits, edge cases, and when to pre-process",
        paragraphs: [
          "Compare mode inherits the same import ceilings as the editor to protect browser memory. If you bump the cap, pre-aggregate or segment files before loading. Truncated imports still compare what loaded, but totals should be interpreted against the trim warning.",
          "Exports with different quoting, delimiters, or header labels may fail the automatic diff gate even when business meaning matches. Standardize exports at the source, or normalize headers in a trusted pipeline, then re-run compare for meaningful stats.",
        ],
      },
      {
        heading: "Pairing compare with export and QA workflows",
        paragraphs: [
          "After you validate deltas, download cleaned subsets from the main viewer if you need editable grids again. Compare mode is intentionally read-only so golden files stay immutable while you investigate.",
          "For recurring checks, nightly inventory, hourly order pulls, script ordering upstream so row indexes stay comparable, then spot-check visually in the browser before you promote automation.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is this the same engine as the main Table viewer?",
        answer:
          "Yes. Parsing, column typing, and grid rendering share the same stack. Compare mode disables edits and paste so you can focus on spotting differences safely.",
      },
      {
        question: "Can I compare Excel files directly?",
        answer:
          "Upload CSV exports. Save spreadsheets as CSV from Excel or Sheets first so headers and delimiters are consistent with what the parser expects.",
      },
      {
        question: "What if I only care about one column?",
        answer:
          "Load both files, confirm columns match, then use filters or search within each read-only grid to isolate the field you care about before toggling the differences-only view.",
      },
    ],
    relatedSlugs: [
      "compare-two-csv-files-browser",
      "browser-csv-grid-local-review",
      "prepare-csv-for-google-sheets",
    ],
    publishedAt: "2025-03-22",
    readTimeMinutes: 7,
  },
  {
    id: "tool-shopify-order-csv-qa",
    template: "tool",
    route: { type: "tool", category: "ecommerce-csv" },
    slug: "shopify-order-csv-qa-checklist",
    primaryKeyword: "shopify order csv qa checklist",
    secondaryKeywords: [
      "shopify export csv review",
      "line item csv shopify",
      "order csv erp handoff",
    ],
    title: "Shopify order CSV QA: line items, taxes, and ERP handoff checks",
    metaDescription:
      "Walk through a practical QA checklist for Shopify order CSV exports before ERP or accounting ingests them: grain, discounts, refunds, and duplicate line keys, using Table locally.",
    heroHeading:
      "QA Shopify order CSVs before finance and ERP systems ingest them",
    intro: [
      "Shopify order exports are naturally line-grain: one row per line item with order-level fields repeated. That shape is correct for warehouses and tax engines, yet easy to misread if someone expects one row per order.",
      "Before you transform the file in Python or load it into NetSuite, a quick human scan in a local grid catches structural mistakes that would otherwise become expensive reconciliation projects.",
      "Document which export profile you used, column names drift between apps, and QA is much faster when everyone references the same field map.",
    ],
    sections: [
      {
        heading: "Confirm grain and keys",
        paragraphs: [
          "Identify the stable identifiers Shopify includes in your export profile, usually order name and line-level SKU or variant id. Count distinct orders versus rows to verify you are not accidentally deduplicating line items away.",
          "Watch for partial refunds and exchanges that produce negative quantities or secondary rows tied to the same order name. Your ERP mapping needs explicit rules for those cases, not silent drops.",
        ],
      },
      {
        heading: "Taxes, discounts, and presentment currency",
        paragraphs: [
          "Compare tax columns against what you see in the admin for a sampled set of orders. Rounding differences between presentment currency and shop currency can look like errors when they are actually expected conversions.",
          "Discount rows may appear as separate lines or as embedded columns depending on the export app. Align with finance on which representation is authoritative before you automate.",
        ],
      },
      {
        heading: "Use Table for the first pass",
        paragraphs: [
          "Filter to a single day or payment gateway, sort by total, and search for edge-case tags like gift or draft. Export a smaller CSV once QA notes are captured for your integration partner.",
          "Keeping that pass local reduces how many copies of full order history float through email, while still giving operations a familiar spreadsheet-like interface.",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I use the default Shopify export or a reporting app?",
        answer:
          "Default exports are predictable. Reporting apps add columns but also introduce versioning. Pick one path per pipeline and document the profile so QA steps stay stable.",
      },
      {
        question: "How do I catch duplicate line keys?",
        answer:
          "Sort by SKU within order name and scan visually, or load into your database staging layer with uniqueness constraints. Table helps for the first human sanity check before SQL.",
      },
      {
        question:
          "Why might my CSV row count differ from the Shopify admin totals?",
        answer:
          "Timezone windows, cancelled or test orders, and archived sales often explain gaps before you assume the export is wrong. Confirm which order states your profile includes, then rerun the export with the same filters the business team expects.",
      },
    ],
    relatedSlugs: [
      "prepare-csv-for-google-sheets",
      "browser-csv-grid-local-review",
      "browser-csv-compare-side-by-side",
    ],
    publishedAt: "2025-03-18",
    readTimeMinutes: 7,
  },
];
