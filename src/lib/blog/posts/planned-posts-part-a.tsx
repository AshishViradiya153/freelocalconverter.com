import { BlogProse } from "../post-prose";
import type { PublishedBlogPost } from "../types";

export const plannedPostsPartA: PublishedBlogPost[] = [
  {
    meta: {
      slug: "utf-8-bom-and-excel-csv",
      title:
        "UTF-8, BOM, and Excel: making CSVs open correctly on every desktop",
      description:
        "When to use UTF-8 with or without a byte-order mark, how Excel on Windows interprets encodings, and how to validate handoffs to pipelines and Mac teammates.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["utf-8 csv", "bom excel", "csv encoding windows"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            <strong>UTF-8</strong> is the default interchange encoding for
            modern stacks, but <strong>Excel on Windows</strong> historically
            preferred legacy code pages unless it detects a <strong>BOM</strong>{" "}
            (byte order mark) at the start of the file. A BOM helps Excel guess
            UTF-8; some Unix tools and strict parsers treat the BOM as an extra
            character in the first column header, so the &quot;right&quot;
            choice depends on your downstream consumer.
          </p>
          <h2>Practical rules</h2>
          <ul>
            <li>
              For <strong>analytics and warehouses</strong>, prefer plain UTF-8
              without BOM unless your Windows stakeholders insist otherwise.
            </li>
            <li>
              After export, open in our viewer and spot-check headers and first
              rows for stray characters or mojibake.
            </li>
            <li>
              Document your team&apos;s standard in a short internal note so
              contractors do not flip encoding per project.
            </li>
          </ul>
          <p>
            When in doubt, validate the same file in two tools (browser viewer +
            target database loader) before promoting a file to production.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-import-errors-and-fixes",
      title:
        "Top CSV import errors, and how to fix them before they hit production",
      description:
        "Malformed quotes, delimiter mismatches, shifted columns, and header drift, patterns to catch in the grid before load jobs fail.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 7,
      keywords: ["csv import errors", "malformed csv", "csv qa"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Most CSV import failures are not mysterious: a field contains an
            unescaped quote, a row has an extra comma, or a row was split across
            lines without proper quoting. Browser viewers surface these issues
            as <strong>misaligned columns</strong> or obvious garbage in cells.
          </p>
          <h2>Quick fixes</h2>
          <ul>
            <li>
              Toggle filters on suspect columns to find odd lengths or empty
              headers.
            </li>
            <li>
              Sort by an ID column to see duplicated or out-of-order keys from
              partial loads.
            </li>
            <li>
              Re-export from the source system with RFC 4180-style quoting if
              manual repair is too risky.
            </li>
          </ul>
          <p>
            Fix upstream when possible; patch in-grid only for bounded, audited
            corrections.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "rtl-and-multilingual-csv-headers",
      title: "RTL and multilingual CSVs: direction, headers, and grid UX",
      description:
        "Mixed Arabic, Hebrew, and English columns: direction in the UI, stable header names for pipelines, and export consistency.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["rtl csv", "multilingual csv", "arabic spreadsheet"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Tabular data does not store text direction, only characters. A good
            grid respects <strong>document direction</strong> (LTR vs RTL) for
            chrome and navigation while still rendering cell contents according
            to Unicode bidirectional rules.
          </p>
          <h2>Pipeline tips</h2>
          <ul>
            <li>
              Keep <strong>header names</strong> stable ASCII slugs in machine
              contracts; use display labels in apps if needed.
            </li>
            <li>
              Avoid visually reordering columns in exports unless consumers
              expect that order.
            </li>
            <li>
              QA mixed numerals and dates in RTL locales, separators vary by
              region.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "column-reorder-and-schema-stability",
      title:
        "Column reorder in the grid vs. stable schemas for APIs and warehouses",
      description:
        "Reordering columns helps humans; APIs and COPY commands care about names or positions, know which contract you are under.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 5,
      keywords: ["csv schema", "column order", "api csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            In our viewer, column reorder is a <strong>presentation</strong>{" "}
            concern: downloads follow the visible order. Warehouse loaders that
            map by <strong>position</strong> break when order changes; loaders
            that map by <strong>header name</strong> are safer for exploratory
            reshuffles.
          </p>
          <h2>Team norm</h2>
          <ul>
            <li>
              Publish a canonical column list for production feeds; use free
              reorder only in draft review.
            </li>
            <li>
              After reordering for analysis, reset or document before export if
              position-sensitive.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "keyboard-shortcuts-for-data-grids",
      title:
        "Keyboard shortcuts that speed up CSV review (copy, paste, navigate)",
      description:
        "Arrow keys, selection, copy/paste, and search, patterns familiar from spreadsheets, adapted to virtualized browser grids.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 5,
      keywords: ["keyboard shortcuts grid", "csv navigation", "data grid"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Dense tables reward keyboard flow: move cell to cell, extend
            selection, paste from Excel as TSV, and invoke search without
            reaching for the mouse. Products vary, check your app&apos;s
            shortcut sheet.
          </p>
          <h2>Habits</h2>
          <ul>
            <li>
              Learn one new shortcut per week until navigation is muscle memory.
            </li>
            <li>
              Prefer <strong>undo</strong> after large pastes, bulk operations
              are where mistakes compound.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "find-and-replace-in-tabular-data",
      title:
        "Find and replace in CSV cells: safety, scope, and undo strategies",
      description:
        "Literal find/replace across cells: confirm scope, preview impact, and rely on undo stacks when cleaning exports.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["find replace csv", "bulk edit csv", "literal match"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Replace-all on free text is dangerous: you can hit substrings inside
            SKUs or domains. Prefer <strong>literal</strong> modes, work on{" "}
            <strong>filtered subsets</strong>, and keep multi-step undo
            available.
          </p>
          <h2>Checklist</h2>
          <ul>
            <li>Filter to the rows that should change, then replace.</li>
            <li>
              Spot-check three random matches before accepting global replace.
            </li>
            <li>Export a backup copy before aggressive cleanup.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "row-selection-bulk-operations",
      title:
        "Bulk row operations: copy, cut, delete, and clear in large selections",
      description:
        "How selection interacts with virtualized rows, clipboard limits, and clearing vs deleting in support workflows.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["bulk delete rows", "csv selection", "clipboard csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Virtualized grids render a window of rows; selection logic should
            still track <strong>row identities</strong> (IDs) so bulk actions
            apply to the right originals. Clipboard payloads may hit OS size
            limits on enormous selections, chunk if needed.
          </p>
          <h2>Semantics</h2>
          <ul>
            <li>
              <strong>Clear</strong> often zeroes cells but keeps row keys;
              <strong>delete</strong> removes lines entirely.
            </li>
            <li>
              Confirm whether your export includes only visible/filtered rows.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-ecommerce-exports",
      title: "CSV exports for e-commerce: orders, SKUs, and catalog QA",
      description:
        "Marketplace and DTC operators validating order dumps and catalog feeds before sync jobs and finance handoffs.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 7,
      keywords: ["ecommerce csv", "sku export", "order csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            E-commerce stacks emit CSVs for orders, refunds, inventory
            snapshots, and listing feeds. Before replaying into an OMS or ads
            catalog, teams scan for <strong>missing SKUs</strong>,{" "}
            <strong>currency mix-ups</strong>, and{" "}
            <strong>duplicate order keys</strong>.
          </p>
          <h2>Regional angles</h2>
          <ul>
            <li>
              Multi-country VAT and price columns need consistent tax logic.
            </li>
            <li>
              Time zones for <code className="text-foreground">created_at</code>{" "}
              fields affect SLA reporting, normalize to UTC in the warehouse.
            </li>
          </ul>
          <p>
            A local browser viewer keeps high-margin exports off shared drives
            during quick triage.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-marketing-attribution",
      title:
        "Marketing attribution CSVs: joining campaigns, spend, and conversions",
      description:
        "Ad platform exports: aligning IDs across spend, clicks, and CRM outcomes before BI models consume them.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 7,
      keywords: ["marketing csv", "attribution data", "campaign export"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Attribution troubleshooting starts in flat files: Facebook, Google,
            LinkedIn, and programmatic DSPs each export different grain
            (campaign, ad set, creative). Analysts eyeball joins on{" "}
            <strong>UTM parameters</strong> or <strong>platform IDs</strong>{" "}
            before building blended views.
          </p>
          <h2>Checks</h2>
          <ul>
            <li>
              Spend and clicks share the same ID namespace for the join window.
            </li>
            <li>
              Look for late-arriving conversions that shift last-touch reports.
            </li>
            <li>
              Filter to a single country or brand when debugging mismatches.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-finance-close",
      title:
        "Month-end CSV extracts: reconciliation patterns for finance teams",
      description:
        "GL and subledger dumps: sorting, tying out trial balances, and catching rounding drift without opening the ERP fat client.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 7,
      keywords: ["finance csv", "gl extract", "month end reconciliation"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Close processes still lean on CSV extracts for intercompany matches,
            bank rec exceptions, and subledger tie-outs. A fast grid beats
            launching a full ERP session for a five-minute variance hunt.
          </p>
          <h2>Controls</h2>
          <ul>
            <li>
              Hash or checksum large extracts when moving between systems.
            </li>
            <li>
              Restrict who can edit authoritative extracts, view-first
              workflows.
            </li>
            <li>
              Pair local review with formal workflow tools for SOX environments.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-hr-and-people-analytics",
      title: "People data CSVs: minimization, access, and local review",
      description:
        "HRIS exports with PII: why local-first viewers reduce unnecessary copies and how to pair with policy.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["hr csv", "people analytics privacy", "pii csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Compensation, performance, and headcount files are among the most
            sensitive CSVs in an enterprise. Processing them in the{" "}
            <strong>browser on an approved device</strong> avoids an extra cloud
            upload solely to preview structure.
          </p>
          <h2>Guardrails</h2>
          <ul>
            <li>Minimize columns before export when possible.</li>
            <li>Use device encryption and screen lock; avoid public Wi‑Fi.</li>
            <li>Clear saved sessions on shared PCs after review.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-support-tickets",
      title: "Support and success: ticket exports, CSAT CSVs, and quick triage",
      description:
        "Zendesk-style dumps: filtering by status, tagging spikes, and scanning CSAT comments before leadership readouts.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["zendesk csv", "support ticket export", "csat csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Support leaders export tickets weekly for VOC reviews. Filters on{" "}
            <strong>priority</strong>, <strong>product area</strong>, and{" "}
            <strong>sentiment</strong> fields narrow the set; search highlights
            recurring error strings.
          </p>
          <h2>Tips</h2>
          <ul>
            <li>Watch for PII in free-text fields when sharing excerpts.</li>
            <li>Sort by updated_at to focus on fresh backlog.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-research-surveys",
      title: "Survey and research CSVs: cleaning open-ended fields locally",
      description:
        "Qualtrics-style exports: previewing open text, checking skip logic, before R, Python, or SPSS workflows.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["survey csv", "qualtrics export", "research data cleaning"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Researchers sanity-check exports for <strong>wide format</strong> vs{" "}
            <strong>long format</strong>, missing waves, and delimiter issues in
            open-ended responses before statistical coding.
          </p>
          <h2>Preview goals</h2>
          <ul>
            <li>Confirm response codes align with the questionnaire PDF.</li>
            <li>Spot multiline answers that wrapped oddly in the export.</li>
            <li>Verify panel IDs are unique per respondent.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "parquet-vs-csv-for-analysts",
      title: "Parquet vs CSV: when analysts still reach for flat files",
      description:
        "Columnar storage wins in warehouses; CSV remains the handoff format to humans, Excel, and legacy tools.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["parquet vs csv", "analyst workflow", "data interchange"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            <strong>Parquet</strong> compresses and types data efficiently for
            Spark, DuckDB, and cloud warehouses. <strong>CSV</strong> stays the
            lowest-common-denominator for email attachments, regulatory
            submissions, and quick human review.
          </p>
          <h2>Split the workflow</h2>
          <ul>
            <li>Store canonical tables in Parquet/Iceberg inside the lake.</li>
            <li>
              Emit bounded CSV slices for stakeholders who will not query SQL.
            </li>
            <li>
              Use a viewer for those slices instead of re-importing to Sheets.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "json-vs-csv-for-apis",
      title: "JSON vs CSV: API dumps and the last mile to spreadsheet users",
      description:
        "APIs speak JSON; business teams ask for CSV, converters, flattening nested objects, and edge cases.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["json to csv", "api export", "flatten json"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            JSON handles nesting and arrays naturally; CSV is flat. Pipelines
            flatten nested API responses into tables, then humans open the CSV
            in a grid. Misparented flattening shows up as duplicate keys or JSON
            blobs inside cells.
          </p>
          <h2>Flattening discipline</h2>
          <ul>
            <li>
              Pick repeatable paths for arrays (explode to rows or aggregate).
            </li>
            <li>Keep stable column names across API versions.</li>
            <li>Validate row counts vs. API pagination totals.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "tsv-clipboard-and-csv-grids",
      title: "From Excel to the browser: how TSV paste maps into CSV grids",
      description:
        "Clipboard TSV from spreadsheets maps to cells; row/column expansion rules and alignment pitfalls.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 5,
      keywords: ["paste tsv", "excel to browser grid", "clipboard csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Excel and Sheets copy as <strong>TSV</strong> on many platforms.
            Pasting into a browser grid should align tab-separated columns to
            adjacent cells and optionally extend the table when the paste is
            larger than the selection.
          </p>
          <h2>Watch for</h2>
          <ul>
            <li>
              Embedded newlines inside quoted Excel cells becoming extra rows.
            </li>
            <li>Locale-formatted numbers pasting as text.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "handling-nulls-and-empty-cells",
      title:
        "Nulls, empty strings, and blanks: CSV semantics in real pipelines",
      description:
        "How empty fields round-trip: SQL NULL vs empty string vs whitespace-only values in exports and imports.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["csv null", "empty string csv", "sql null export"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            CSV cannot distinguish <strong>NULL</strong> from{" "}
            <strong>empty string</strong> without side metadata, both often
            appear as consecutive commas. Warehouses and ORMs apply different
            defaults on load.
          </p>
          <h2>Conventions</h2>
          <ul>
            <li>
              Document whether &quot;N/A&quot;, &quot;null&quot;, or blanks mean
              missing.
            </li>
            <li>Trim whitespace on ingest when policy allows.</li>
            <li>Avoid mixing sentinels across feeds for the same column.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "duplicate-detection-in-csv",
      title: "Finding duplicates in CSV files without a database",
      description:
        "Sort by candidate keys, scan runs, and use filters, lightweight dedup recon before SQL DISTINCT.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 5,
      keywords: ["duplicate rows csv", "dedup csv", "find duplicates"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Without SQL, sort by the natural key (email, order_id, device_id)
            and look for <strong>adjacent identical keys</strong>. For composite
            keys, concatenate in a scratch column or sort by multiple columns.
          </p>
          <h2>Limits</h2>
          <ul>
            <li>Case sensitivity can hide dupes, normalize case upstream.</li>
            <li>Trailing spaces break key equality.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "date-formats-in-csv-exports",
      title:
        "Date and time columns in CSV: ISO-8601, time zones, and locale traps",
      description:
        "Prefer ISO-8601 in UTC for machine exchange; document locale-specific displays separately.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["iso 8601 csv", "csv dates timezone", "date format export"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Ambiguous dates like{" "}
            <code className="text-foreground">01/02/2025</code> confuse US vs EU
            readers. Machine pipelines prefer{" "}
            <code className="text-foreground">2025-01-02T15:30:00Z</code> style
            timestamps with explicit offsets.
          </p>
          <h2>Policy</h2>
          <ul>
            <li>
              Store UTC in warehouses; convert to local only in presentation.
            </li>
            <li>Never mix fractional seconds inconsistently across files.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "numeric-locale-csv-parsing",
      title: "Numeric locales in CSV: commas, decimals, and currency symbols",
      description:
        "EU vs US number formats: thousand separators, decimal commas, and safe normalization before CAST.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["locale csv numbers", "decimal comma", "european csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            A file from a German subsidiary may use{" "}
            <code className="text-foreground">1.234,56 €</code> while US systems
            expect <code className="text-foreground">1234.56</code>. Blind
            casting fails or silently drops precision.
          </p>
          <h2>Mitigation</h2>
          <ul>
            <li>Tag source locale in the filename or manifest.</li>
            <li>
              Strip currency symbols in ETL, not in the legal source file.
            </li>
            <li>
              Keep raw strings until a single normalization step owns the rules.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "wide-tables-many-columns",
      title: "Ultra-wide CSVs: navigating hundreds of columns in a grid",
      description:
        "Horizontal scroll, pinned select columns, and hiding fields, UX patterns for feature matrices and survey grids.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 5,
      keywords: ["wide csv", "many columns", "horizontal scroll grid"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Feature-store exports and wide surveys exceed typical laptop widths.
            Pin row identifiers and key dimensions, hide low-value columns, and
            jump via search on header names when available.
          </p>
          <h2>Performance</h2>
          <ul>
            <li>Virtualize horizontally where the engine supports it.</li>
            <li>Prefer column subsets in the export when possible.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "sampling-vs-full-file-browser",
      title: "When to sample a CSV vs. load the entire file in the browser",
      description:
        "Preview caps reduce crash risk; understand when sampling biases QA conclusions.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["csv sample", "large file preview", "import limits"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Products cap rows to protect memory. Sampling is fine for{" "}
            <strong>schema checks</strong> but risky for{" "}
            <strong>tail anomalies</strong> or rare event rates, issues may live
            beyond the first N lines.
          </p>
          <h2>Balance</h2>
          <ul>
            <li>Use full load when hardware and limits allow.</li>
            <li>
              Stratified sample (head, middle, tail) when forced to sample.
            </li>
            <li>
              Push exhaustive checks to the warehouse when files are huge.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
];
