import { BlogProse } from "../post-prose";
import type { PublishedBlogPost } from "../types";

export const plannedPostsPartB: PublishedBlogPost[] = [
  {
    meta: {
      slug: "csv-security-malicious-formulas",
      title:
        "CSV injection and formula hijacking: what viewers should avoid executing",
      description:
        "Cells beginning with =, +, -, @ can trigger spreadsheet formulas, awareness for security teams and CSV tooling.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["csv injection", "formula injection", "spreadsheet security"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            When CSV opens in Excel or Sheets, a cell like{" "}
            <code className="text-foreground">=cmd|...</code> can be interpreted
            as a formula. Pure{" "}
            <strong>viewers that do not execute formulas</strong> reduce that
            class of risk compared to full spreadsheet apps.
          </p>
          <h2>Defenses</h2>
          <ul>
            <li>
              Strip or prefix risky leading characters in untrusted feeds.
            </li>
            <li>Open unknown files in a sandboxed viewer first.</li>
            <li>Train finance users on &quot;enable content&quot; prompts.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "air-gapped-and-offline-csv-workflows",
      title:
        "Offline and air-gapped CSV review: browser tools without cloud sync",
      description:
        "Regulated labs and defense-adjacent sites: local parsing without telemetry when policy demands it.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["air gapped", "offline csv", "no cloud analytics"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Air-gapped workstations still receive CSV attachments on USB. A{" "}
            <strong>static build</strong> of a browser tool, delivered through
            approved channels, can run without calling home, verify against your
            security team that no third-party scripts remain.
          </p>
          <h2>Checklist</h2>
          <ul>
            <li>Disable or audit analytics and ads in hardened builds.</li>
            <li>Document data flow in the system security plan.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "vendor-due-diligence-for-browser-tools",
      title:
        "Vendor questionnaires: how to describe client-side CSV processing",
      description:
        "Language for security reviews: subprocessors, data residency, and what never leaves the device.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["vendor security questionnaire", "dpa csv", "subprocessors"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Answer questionnaires with precision: parsing occurs in the{" "}
            <strong>end-user browser</strong>; your company may still operate
            analytics on page loads separately from file contents. Map each
            processing activity.
          </p>
          <h2>Artifacts</h2>
          <ul>
            <li>Architecture diagram: browser vs API vs CDN.</li>
            <li>
              List of cookies and third-party scripts distinct from CSV engine.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "soc2-and-browser-data-tools",
      title: "SOC 2 minded teams: scoping browser analytics and CSV products",
      description:
        "High-level mapping of trust criteria to lightweight client-side tools, not legal advice.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 5,
      keywords: ["soc 2", "trust services criteria", "saas security"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            SOC 2 buyers ask about access control, logging, and change
            management. A static site with client-side CSV parsing may have a{" "}
            <strong>smaller blast radius</strong> than a multi-tenant
            spreadsheet backend, scope the system boundary your auditor reviews.
          </p>
          <h2>Partner with experts</h2>
          <ul>
            <li>Involve GRC and counsel for formal attestations.</li>
            <li>Keep deployment and dependency manifests versioned.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "chrome-edge-firefox-csv-performance",
      title:
        "Browser differences: Chrome, Edge, and Firefox for large CSV grids",
      description:
        "Engine and memory profiles differ slightly; same dataset may feel smoother in one browser on marginal hardware.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 5,
      keywords: ["chrome performance", "firefox memory", "browser csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Chromium and Gecko optimize JS and layout differently. For very
            large grids, test your real file in <strong>two browsers</strong> on
            the same machine before blaming the dataset.
          </p>
          <h2>Hardware</h2>
          <ul>
            <li>RAM headroom matters more than CPU for wide string tables.</li>
            <li>
              Close heavy tabs; disable extensions that inject content scripts.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "mobile-tablets-csv-review",
      title: "Can you review CSV on a tablet? Mobile UX limits for data grids",
      description:
        "Touch targets, horizontal panning, and when a phone is too small for serious QA.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 5,
      keywords: ["mobile csv", "tablet spreadsheet", "touch grid"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Tablets work for quick scans; phones struggle with wide tables.
            Precision selection and keyboard shortcuts favor{" "}
            <strong>desktop</strong> for bulk edits.
          </p>
          <h2>When mobile is OK</h2>
          <ul>
            <li>Verifying row counts and a handful of columns.</li>
            <li>Approving a download link, not editing 10k cells.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "accessibility-csv-grids",
      title: "Accessibility in dense tables: screen readers and keyboard paths",
      description:
        "ARIA grid roles, focus order, and pragmatic limits when virtualizing tens of thousands of rows.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["aria grid", "accessible table", "keyboard navigation"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Data grids expose rows and cells to assistive tech via{" "}
            <code className="text-foreground">role=&quot;grid&quot;</code>{" "}
            patterns. Virtualization complicates linear navigation, products
            should preserve logical tab order and announce sort/filter state
            changes.
          </p>
          <h2>Goals</h2>
          <ul>
            <li>Every interactive cell reachable by keyboard.</li>
            <li>Visible focus rings on custom cell editors.</li>
            <li>Document known limitations for mega-grids in VPATs.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "version-control-for-csv-files",
      title:
        "Should CSV live in Git? Versioning data dumps for engineering teams",
      description:
        "Git diffs on shifting data are noisy; LFS and external object stores often fit better than raw commits.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["git csv", "git lfs", "version data files"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Small reference CSVs (test fixtures) belong in Git. Large, churning
            exports <strong>pollute history</strong> and inflate clones, prefer
            artifact storage with metadata pointers in the repo.
          </p>
          <h2>Rule of thumb</h2>
          <ul>
            <li>If it changes daily, do not commit it.</li>
            <li>If it defines schema, commit a stable sample only.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "snowflake-bigquery-csv-unload",
      title:
        "From warehouse unload to browser: CSV round-trips in modern stacks",
      description:
        "Snowflake COPY INTO / BigQuery EXPORT patterns feeding human review before operational email.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["snowflake unload csv", "bigquery export", "warehouse csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Analysts UNLOAD slices for stakeholders who will not run SQL. The
            CSV lands in object storage, downloads to laptop, opens in a
            viewer, then annotated files rarely should flow backward into
            production without ETL.
          </p>
          <h2>Hygiene</h2>
          <ul>
            <li>Time-bound signed URLs; avoid eternal public buckets.</li>
            <li>Redact columns at export time when possible.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "google-sheets-export-to-csv",
      title: "Google Sheets to CSV: what breaks and how to validate downloads",
      description:
        "Formulas export as values; merged cells and locale matter, validate in a second tool.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["google sheets csv", "export sheets", "csv from sheets"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Downloading CSV from Sheets drops formatting and often flattens
            formulas to <strong>computed values</strong>. Merged header cells
            can produce empty header names, fix in Sheets before export.
          </p>
          <h2>Validate</h2>
          <ul>
            <li>Open the CSV in a strict viewer to see ragged rows early.</li>
            <li>Check date columns for locale-specific serial surprises.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "excel-export-to-csv-windows",
      title: "Excel “Save As CSV” on Windows: locale and encoding gotchas",
      description:
        "Regional list separators and ANSI vs UTF-8 saves, why a second opinion in a browser viewer helps.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["excel csv windows", "save as csv", "list separator"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Excel may use semicolon separators when Windows locale expects it,
            breaking comma-first pipelines. Explicitly choose{" "}
            <strong>CSV UTF-8</strong> when available and confirm delimiter in a
            neutral viewer.
          </p>
          <h2>Tip</h2>
          <ul>
            <li>Document OS locale in handoff notes for offshore partners.</li>
            <li>Prefer Power Query or controlled exports for repeat jobs.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "open-data-csv-and-journalism",
      title:
        "Open data CSVs for journalists: quick exploration before stories ship",
      description:
        "Government portals and election data: sanity checks, joins on FIPS codes, and reproducible excerpts.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 7,
      keywords: ["open data", "journalism csv", "election data"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Newsrooms download CSVs from city open-data sites daily. Fast
            sorting and filtering catch <strong>null districts</strong>,
            duplicate precinct IDs, and impossible totals before publication.
          </p>
          <h2>Practice</h2>
          <ul>
            <li>Keep immutable raw downloads; work on copies.</li>
            <li>
              Log the portal URL and retrieval timestamp in your methodology.
            </li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-in-machine-learning-prep",
      title:
        "ML feature CSVs: eyeballing training exports before notebooks run",
      description:
        "Spot constant columns, label leakage, and impossible ranges in flat files before sklearn or PyTorch.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["ml csv", "feature csv", "data leakage"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Human scan complements automated profiling: sort numeric features,
            search for sentinel strings like{" "}
            <code className="text-foreground">unknown</code>, and verify label
            cardinality before training.
          </p>
          <h2>Red flags</h2>
          <ul>
            <li>Future-dated columns co-present with targets (leakage).</li>
            <li>IDs that sort perfectly with labels (merge bugs).</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-logistics-and-shipping",
      title:
        "Logistics CSVs: shipment manifests, ASN files, and exception handling",
      description:
        "3PL and carrier exports: tracking numbers, customs references, and exception queues across regions.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["logistics csv", "asn file", "shipping manifest"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Operations teams reconcile ASN CSVs against WMS receipts. Filters on{" "}
            <strong>exception codes</strong> and missing tracking fields prevent
            chargebacks and customer complaints.
          </p>
          <h2>Global ops</h2>
          <ul>
            <li>
              Harmonize carrier status vocabularies before cross-carrier joins.
            </li>
            <li>Watch time zones on promised delivery timestamps.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-healthcare-adjacent-ops",
      title:
        "Healthcare-adjacent operations CSVs: minimizing exposure at review time",
      description:
        "Billing operations, device inventory, non-clinical rosters, stay separate from PHI systems and BAAs.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: [
        "healthcare operations csv",
        "phi disclaimer",
        "hipaa adjacent",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Not every hospital CSV is clinical. Supply chain and scheduling ops
            still demand rigor, confirm whether files fall under{" "}
            <strong>PHI</strong> and appropriate agreements. This article is not
            legal or clinical advice.
          </p>
          <h2>Minimize</h2>
          <ul>
            <li>Strip identifiers when summaries suffice.</li>
            <li>Use approved devices and VPNs per policy.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-education-rosters",
      title: "Education roster CSVs: FERPA-minded local review workflows",
      description:
        "SIS exports: course codes, guardians, and IDs, keep review on institutional hardware.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["ferpa csv", "sis export", "student roster"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Registrars fix roster errors in CSV before state reporting
            deadlines. Local browser review avoids an extra cloud copy if policy
            allows the tool.
          </p>
          <h2>Hygiene</h2>
          <ul>
            <li>Never use personal email to shuttle rosters.</li>
            <li>Version files with date stamps in the filename.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-real-estate-listings",
      title: "Property listing CSVs: MLS-style fields and bulk cleanup",
      description:
        "Brokerage feeds: inconsistent enums, photo URLs, and cross-market schema drift.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["mls csv", "real estate feed", "listing import"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            IDX and MLS exports vary by board. Analysts normalize{" "}
            <strong>property type</strong> enums and validate lat/long ranges
            before syndication.
          </p>
          <h2>Tip</h2>
          <ul>
            <li>Search for duplicate listing keys before go-live.</li>
            <li>Confirm currency and square-foot units across markets.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-crypto-and-fintech-exports",
      title: "Fintech transaction CSVs: high row counts and audit trails",
      description:
        "Exchange ledgers, staking rewards, and tax prep: sort by asset, reconcile fees, paginate wisely.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["crypto csv", "exchange export", "fintech ledger"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Crypto exchanges emit verbose CSVs with fills, transfers, and
            rewards. Tax tools ingest them, human review catches{" "}
            <strong>missing cost basis</strong> rows and duplicate hashes.
          </p>
          <h2>Scale</h2>
          <ul>
            <li>Use filters on asset and year before scanning visually.</li>
            <li>Keep immutable archives per exchange per tax year.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "building-internal-csv-playbooks",
      title: "Playbooks: how enterprises document approved CSV tools and steps",
      description:
        "Security-approved viewer vs spreadsheet vs BI, decision trees and onboarding snippets for new hires.",
      publishedAt: "2025-03-21",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["data playbook", "enterprise csv policy", "approved tools"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Central IT wins when teams share one page: which tool for PII, which
            for public data, how to request exceptions. Link to this product
            where it fits the <strong>local-first preview</strong> slot.
          </p>
          <h2>Template sections</h2>
          <ul>
            <li>Classification tiers (public, internal, confidential).</li>
            <li>Export naming and retention windows.</li>
            <li>Incident contacts for suspected leaks.</li>
          </ul>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-viewer-glossary",
      title:
        "Glossary: delimiter, RFC 4180, record, field, and escape characters",
      description:
        "Short definitions for CSV vocabulary, helpful for SEO and onboarding engineers and analysts.",
      publishedAt: "2025-03-21",
      category: "guide",
      readTimeMinutes: 5,
      keywords: ["rfc 4180", "csv delimiter", "csv glossary"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Shared vocabulary reduces bugs between producers and consumers of
            flat files.
          </p>
          <h2>Terms</h2>
          <ul>
            <li>
              <strong>Delimiter</strong>: character separating fields (often comma
              or semicolon).
            </li>
            <li>
              <strong>Record</strong>: one row representing an entity instance.
            </li>
            <li>
              <strong>Field</strong>: single cell value within a record.
            </li>
            <li>
              <strong>Escape</strong>: doubling quotes inside quoted fields per RFC
              4180.
            </li>
            <li>
              <strong>RFC 4180</strong>: common textual CSV profile for
              interoperability.
            </li>
          </ul>
          <p>
            Explore linked guides on encoding, dates, and imports for deeper
            patterns.
          </p>
        </BlogProse>
      );
    },
  },
];
