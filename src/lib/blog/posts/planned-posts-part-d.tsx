import { BlogProse } from "../post-prose";
import type { PublishedBlogPost } from "../types";

export const plannedPostsPartD: PublishedBlogPost[] = [
  {
    meta: {
      slug: "stripe-payout-and-balance-csv-exports",
      title: "Stripe payout CSVs: reconciling balance transactions locally",
      description:
        "How finance ops use Stripe balance and payout exports, which columns usually matter for close, and why a browser grid beats re-uploading extracts to another cloud.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 7,
      keywords: [
        "stripe csv export",
        "balance transactions csv",
        "payout reconciliation",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Stripe exposes rich reporting APIs, but many teams still download{" "}
            <strong>balance transaction</strong> or <strong>payout</strong> CSV
            extracts for month-end. Those files mix card charges, refunds, fees,
            and transfers. The goal is to confirm that ledger movement matches
            your bank and accounting system before you post journals.
          </p>
          <h2>Columns teams actually scan</h2>
          <ul>
            <li>
              <strong>Created</strong> and <strong>available on</strong> dates
              for accrual versus cash timing.
            </li>
            <li>
              <strong>Reporting category</strong> and fee lines so net revenue
              ties to expectations.
            </li>
            <li>
              <strong>Currency</strong> and <strong>amount</strong> pairs when
              you settle in more than one currency.
            </li>
            <li>
              <strong>Balance transaction ID</strong> as the join key back to
              internal order or invoice systems.
            </li>
          </ul>
          <h2>Why review in Table</h2>
          <p>
            Payout files can include sensitive customer and card metadata.{" "}
            <strong>Table</strong> parses CSV in your browser, so you can sort
            by date, filter to a single payout ID, and spot outliers without
            sending the extract through another SaaS inbox. When the slice looks
            right, export or copy only what finance needs for the next system.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "hubspot-crm-export-csv-review",
      title:
        "HubSpot CRM exports: contacts, deals, and ticket CSV sanity checks",
      description:
        "Validate HubSpot portal CSVs before warehouse loads or re-imports: owner fields, pipeline stages, association columns, and duplicate detection.",
      publishedAt: "2025-03-19",
      category: "guide",
      readTimeMinutes: 6,
      keywords: [
        "hubspot export csv",
        "crm csv validation",
        "hubspot contacts export",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            HubSpot makes CSV exports easy from lists, views, and reports.
            Before you load a file into a warehouse or re-import cleaned rows, a
            quick <strong>structural pass</strong> prevents silent data loss:
            truncated emails, wrong pipeline stage labels, or association IDs
            that no longer exist.
          </p>
          <h2>Sanity checks before the heavy lift</h2>
          <ul>
            <li>
              Confirm <strong>header row</strong> uniqueness. Duplicate column
              names confuse strict loaders.
            </li>
            <li>
              Spot blank <strong>owner</strong> or <strong>lifecycle</strong>{" "}
              fields that will break routing rules downstream.
            </li>
            <li>
              For deals, align <strong>stage</strong> values with the current
              pipeline definition in the portal.
            </li>
            <li>
              For tickets, verify <strong>closed date</strong> and status pairs
              so SLA reports stay honest.
            </li>
          </ul>
          <h2>Use Table on your machine</h2>
          <p>
            Open the export in <strong>Table</strong>, use column visibility and
            filters to isolate one pipeline or owner, then scroll without
            loading the sheet into a shared drive parser. Local parsing fits
            lists that still contain personal data under GDPR-style policies.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "salesforce-report-export-csv",
      title:
        "Salesforce report exports to CSV: grain, formulas, and row limits",
      description:
        "What changes when you export a Salesforce report to CSV versus the API, how row caps bite, and how to eyeball formula columns before RevOps signs off.",
      publishedAt: "2025-03-19",
      category: "guide",
      readTimeMinutes: 7,
      keywords: [
        "salesforce report csv",
        "salesforce export limit",
        "revops csv",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Report exports are the fastest path when API access is slow,
            blocked, or overkill. The CSV you get is a{" "}
            <strong>flattened</strong> picture of the report at export time.
            Groupings, bucketing, and summary formulas can look like normal
            columns even though they are derived, not stored fields.
          </p>
          <h2>Grain and limits</h2>
          <ul>
            <li>
              <strong>Row limits</strong> on reports mean truncated exports. If
              totals look off, export in slices by date or segment.
            </li>
            <li>
              <strong>Detail rows</strong> versus summary rows: know whether
              each line is an opportunity, a split, or an aggregate.
            </li>
            <li>
              <strong>Formula columns</strong> evaluate in Salesforce context.
              They may not match a later spreadsheet recalc if references
              change.
            </li>
            <li>
              <strong>Multi-currency</strong> orgs: watch which column is
              corporate currency versus record currency.
            </li>
          </ul>
          <h2>Local review with Table</h2>
          <p>
            Pull the CSV into <strong>Table</strong> to sort by amount or close
            date, search for a specific account name, and confirm you are not
            carrying partial exports into a board deck. Pagination keeps wide
            opportunity reports responsive in the browser.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "quickbooks-csv-exports",
      title:
        "QuickBooks CSV and IIF-adjacent flows: what accountants open in a grid",
      description:
        "Common QuickBooks Online and Desktop CSV patterns for lists and transactions, and how bookkeepers validate columns before tax tools or auditors see them.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["quickbooks csv export", "accounting csv import", "qbo csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            QuickBooks ecosystems still move a lot of data through{" "}
            <strong>CSV templates</strong> for lists, journal-style lines, and
            third-party bridges. Accountants often receive exports from clients
            that were hand-edited in Excel, which introduces stray commas, wrong
            date formats, and duplicated rows.
          </p>
          <h2>What practitioners verify first</h2>
          <ul>
            <li>
              <strong>Date columns</strong> in a single format, usually{" "}
              <code className="text-foreground">MM/DD/YYYY</code> or ISO, never
              mixed in one file.
            </li>
            <li>
              <strong>Account numbers</strong> and names aligned with the
              current chart of accounts.
            </li>
            <li>
              <strong>Debits and credits</strong> or amount sign conventions
              consistent end to end.
            </li>
            <li>
              No <strong>subtotal</strong> or header rows in the middle of the
              data set unless the downstream tool expects them.
            </li>
          </ul>
          <h2>Table for SMB handoffs</h2>
          <p>
            <strong>Table</strong> gives you a neutral grid to scan thousands of
            lines, filter to one account, and undo mistakes while you clean. It
            runs locally in the browser, which suits files you do not want in
            another cloud inbox.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "netsuite-saved-csv-searches",
      title:
        "NetSuite saved search CSV: columns, joins, and subsidiary filters",
      description:
        "Exporting NetSuite saved searches to CSV: understanding joined fields, summary lines, and why subsidiary scoping matters for consolidated reporting.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 7,
      keywords: [
        "netsuite saved search csv",
        "netsuite export csv",
        "erp csv extract",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Saved searches are the workhorse of NetSuite reporting. CSV export
            is often the bridge to Excel, planning tools, or ad hoc audits. The
            tricky part is that searches can <strong>join</strong> multiple
            record types, so one row is not always one transaction line.
          </p>
          <h2>What to watch</h2>
          <ul>
            <li>
              <strong>Subsidiary</strong> filters: exports without them can
              duplicate or mix legal entities.
            </li>
            <li>
              <strong>Formula columns</strong> and text merges that look like
              dimensions but are computed at export time.
            </li>
            <li>
              <strong>Main line versus line-level</strong> transaction exports.
              Revenue recognition teams care about the difference.
            </li>
            <li>
              Very wide searches: column order in CSV follows the UI, not always
              your mental model.
            </li>
          </ul>
          <h2>Preview heavy extracts</h2>
          <p>
            Large saved search CSVs are painful in email previewers.{" "}
            <strong>Table</strong> loads the file locally, supports pagination,
            and lets you reorder columns so subsidiary and amount sit where you
            need them before deeper modeling.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "sap-alv-export-csv",
      title:
        "SAP ALV and GUI exports: when business users still get flat CSV files",
      description:
        "Why enterprise teams still export ALV and GUI lists to CSV, typical delimiter and encoding quirks, and how to review those extracts outside the SAP client.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["sap csv export", "alv export", "enterprise csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            SAP landscapes push a lot of operational truth through interactive
            lists. When IT has not wired a dedicated integration, users export{" "}
            <strong>ALV</strong> or classic GUI results to CSV for supply chain,
            finance, or compliance follow-ups. Those files often use regional
            list separators and encodings tied to the front-end PC.
          </p>
          <h2>Common friction</h2>
          <ul>
            <li>
              <strong>Semicolon</strong> delimiters in European locales while US
              tools expect commas.
            </li>
            <li>
              Leading zeros stripped when the file was opened in Excel before it
              reached you.
            </li>
            <li>
              <strong>Numeric formatting</strong> with thousand separators
              inside cells.
            </li>
            <li>
              Truncated exports when the list exceeded the GUI limit; compare
              row counts to the selection banner.
            </li>
          </ul>
          <h2>Last-mile review in Table</h2>
          <p>
            After the CSV lands on your laptop, <strong>Table</strong> parses it
            as text-first data so you can validate row counts, search for a
            material number, and share conclusions without round-tripping
            through another enterprise upload.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-seo-and-content-teams",
      title:
        "SEO and content CSVs: rankings, crawls, and redirect maps in a grid",
      description:
        "Agency and in-house SEO workflows built on CSV exports from crawlers, rank trackers, and CMS bulk tools, plus how to sort and filter before Google Sheets.",
      publishedAt: "2025-03-19",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["seo csv export", "crawl csv", "redirect map csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Organic search teams live in exports: crawl paths, keyword rankings,
            hreflang matrices, and redirect maps. CSV is the neutral format that
            survives tool churn. The files are often <strong>wide</strong>{" "}
            (dozens of metrics per URL) and large enough that browser
            spreadsheets stutter.
          </p>
          <h2>Typical files</h2>
          <ul>
            <li>
              <strong>Crawl exports</strong> with status codes, indexability,
              and canonical targets per URL.
            </li>
            <li>
              <strong>Rank tracker</strong> CSVs with date columns for each
              snapshot.
            </li>
            <li>
              <strong>Redirect maps</strong> pairing source and destination with
              match type and priority notes.
            </li>
          </ul>
          <h2>Table before Sheets</h2>
          <p>
            Open the CSV in <strong>Table</strong> to filter to 404s only, sort
            by organic traffic estimates, or hide columns your stakeholder does
            not need. Search across the whole grid for a path fragment. When the
            slice is final, export a smaller CSV for collaboration.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-recruiters-ats-exports",
      title:
        "ATS exports for recruiters: candidate pipelines and compliance notes",
      description:
        "How talent teams use ATS CSV extracts for audits, diversity reporting, and handoffs, and why local review matters for PII.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["ats csv export", "recruiting csv", "candidate data csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Applicant tracking systems export candidate, job, and offer data as
            CSV for analytics, migrations, and regulatory responses. Those files
            routinely contain <strong>PII</strong>, compensation hints, and
            free-text notes that should not bounce through extra cloud parsers
            without policy coverage.
          </p>
          <h2>What TA ops validates</h2>
          <ul>
            <li>
              <strong>Stage</strong> and <strong>disposition</strong> codes
              consistent with the live workflow configuration.
            </li>
            <li>
              <strong>Source</strong> and <strong>campaign</strong> fields for
              attribution reports.
            </li>
            <li>
              Redaction of internal comments before the file leaves HR systems.
            </li>
            <li>
              Row counts that match the reporting period filter, not the full
              historical database.
            </li>
          </ul>
          <h2>Local-first review</h2>
          <p>
            <strong>Table</strong> keeps parsing on your device. Use it to scan
            a narrow export, verify column coverage, and spot obvious leaks like
            personal email in unexpected columns before wider distribution.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-subscription-saas-metrics",
      title: "SaaS MRR and churn CSVs: cohort files and plan change exports",
      description:
        "How subscription businesses move MRR, churn, and expansion metrics through CSV from billing systems and warehouses, and how to eyeball anomalies.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["mrr csv", "saas metrics export", "subscription churn csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Even modeled teams export <strong>CSV slices</strong> from the data
            warehouse for board prep, investor questions, and finance bridges.
            Cohort files list accounts by signup month with trailing revenue.
            Plan change logs capture upgrades, downgrades, and churn events with
            effective dates.
          </p>
          <h2>Signals worth scanning</h2>
          <ul>
            <li>
              <strong>Negative MRR</strong> rows that might be refunds or data
              bugs.
            </li>
            <li>
              Duplicate <strong>account IDs</strong> in the same period grain.
            </li>
            <li>
              <strong>Currency</strong> mixing when multi-geo ARR is rolled up.
            </li>
            <li>
              Sudden spikes in <strong>logo churn</strong> tied to one segment
              or product line.
            </li>
          </ul>
          <h2>Quick passes in Table</h2>
          <p>
            Load the extract into <strong>Table</strong>, sort by delta MRR,
            filter to one customer success pod, and confirm the story matches
            what leaders will ask about. No need to upload proprietary metrics
            to a generic online converter.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "fixing-ragged-csv-rows",
      title: "Fixing ragged CSV rows when column counts drift mid-file",
      description:
        "Why some rows have too many or too few fields, how quoting mistakes cause it, and practical triage before import or grid viewing.",
      publishedAt: "2025-03-19",
      category: "guide",
      readTimeMinutes: 7,
      keywords: ["ragged csv", "csv column mismatch", "malformed csv fix"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            A <strong>ragged</strong> CSV has rows where the number of fields
            does not match the header. Parsers either drop data, shift columns,
            or fail entirely. The usual causes are unescaped commas inside
            cells, missing closing quotes, or manual edits that inserted extra
            separators in one line only.
          </p>
          <h2>Triage steps</h2>
          <ul>
            <li>
              Compare <strong>field count</strong> per row to the header count
              in a script or strict validator; note the first offending line
              number.
            </li>
            <li>
              Open the raw file in a text editor and inspect that line for a
              broken quote pair or a stray tab.
            </li>
            <li>
              If the source is Excel, re-export using <strong>UTF-8 CSV</strong>{" "}
              and avoid merged cells in the data region.
            </li>
            <li>
              For recurring feeds, fix upstream <strong>ETL</strong> rather than
              patching each file by hand.
            </li>
          </ul>
          <h2>After repair, verify in Table</h2>
          <p>
            Once the file parses cleanly, load it into <strong>Table</strong>.
            Scan the first and last pages, toggle column visibility, and confirm
            numeric columns did not ingest as mangled text. Undo and export help
            when you are cleaning rows interactively.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-quoting-and-embedded-newlines",
      title:
        "Quoted fields and embedded newlines: how multiline cells look in grids",
      description:
        "RFC-style CSV quoting rules, why addresses and JSON snippets break naive splitters, and how proper parsers and grids display multiline fields.",
      publishedAt: "2025-03-19",
      category: "guide",
      readTimeMinutes: 7,
      keywords: ["csv quoted fields", "multiline csv", "csv newline in cell"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            In real CSV, a single <strong>logical row</strong> can span multiple
            physical lines when a field is wrapped in double quotes and contains
            newline characters. Addresses, ticket comments, and JSON blobs are
            common culprits. Naive tools that split on line breaks alone will
            shred those records.
          </p>
          <h2>Rules of thumb</h2>
          <ul>
            <li>
              Fields with commas, quotes, or newlines should be wrapped in{" "}
              <strong>double quotes</strong>.
            </li>
            <li>
              Internal double quotes are escaped by doubling them (
              <code className="text-foreground">&quot;&quot;</code>).
            </li>
            <li>
              Parsers must be <strong>stateful</strong>: inside quotes, newline
              does not end the row.
            </li>
            <li>
              Grids may show multiline cells with wrapped text or a single line
              with visible break characters depending on settings.
            </li>
          </ul>
          <h2>Table and modern parsing</h2>
          <p>
            <strong>Table</strong> relies on a proper CSV parser so quoted
            newlines stay inside one row. Use search and filters to find records
            that still look wrong, which usually points back to a malformed
            quote in the source export.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "tab-separated-values-vs-comma",
      title: "When to use TSV instead of CSV for handoffs between teams",
      description:
        "Choosing tab-separated values when prose columns or European decimals collide with comma delimiters, and interoperability tradeoffs with Excel and Unix tools.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["tsv vs csv", "tab separated values", "delimiter choice"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            <strong>TSV</strong> uses tab characters between fields. It is a
            pragmatic choice when your data contains lots of commas (prose,
            addresses, JSON fragments) and you want to avoid heavy quoting. Unix
            pipelines and bioinformatics stacks often default to TSV for that
            reason.
          </p>
          <h2>When TSV wins</h2>
          <ul>
            <li>
              Free-text columns where comma escaping would bloat the file.
            </li>
            <li>
              European numeric exports that use comma as the decimal separator
              alongside comma delimiters (confusing without strict locales).
            </li>
            <li>
              Quick handoffs between engineering tools that treat tabs as rare
              inside values.
            </li>
          </ul>
          <h2>Tradeoffs</h2>
          <ul>
            <li>
              Tabs can hide inside pasted spreadsheet cells; always validate
              field counts.
            </li>
            <li>
              Some Windows workflows assume{" "}
              <code className="text-foreground">.csv</code> even when content is
              tabbed; document the delimiter for partners.
            </li>
          </ul>
          <p>
            <strong>Table</strong> focuses on CSV interchange for the broadest
            business audience. If your pipeline emits TSV, convert to CSV at the
            boundary or use a one-line tool to swap delimiters before loading
            here.
          </p>
        </BlogProse>
      );
    },
  },
];
