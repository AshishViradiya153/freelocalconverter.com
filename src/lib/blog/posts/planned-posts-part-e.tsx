import { BlogProse } from "../post-prose";
import type { PublishedBlogPost } from "../types";

export const plannedPostsPartE: PublishedBlogPost[] = [
  {
    meta: {
      slug: "csv-for-iot-and-telemetry-samples",
      title: "IoT and telemetry sample CSVs: device IDs, timestamps, and gaps",
      description:
        "Engineers often snapshot device telemetry as CSV before Parquet or time-series stores. Here is how to read bursts, missing readings, and clock skew in flat files.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["iot csv export", "telemetry csv", "device data csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Firmware and gateway teams dump <strong>sample windows</strong> to
            CSV for support tickets and algorithm tuning. Rows usually include
            device ID, sensor channel, timestamp, and reading. Real-world files
            mix UTC and local time, duplicate samples, and null placeholders
            that are not true numeric gaps.
          </p>
          <h2>What to inspect</h2>
          <ul>
            <li>
              <strong>Timestamp</strong> format and timezone: ISO-8601 with
              offset is safest.
            </li>
            <li>
              <strong>Device ID</strong> cardinality versus row count to spot
              accidental cartesian explosions from joins.
            </li>
            <li>
              Sentinel values like <code className="text-foreground">-999</code>{" "}
              that mean offline instead of measurement.
            </li>
            <li>
              <strong>Gap detection</strong> by sorting on time per device and
              eyeballing jumps larger than the expected sampling interval.
            </li>
          </ul>
          <h2>Table for ad hoc slices</h2>
          <p>
            Paste or load a CSV slice into <strong>Table</strong>, sort by
            timestamp, filter to one device ID, and scroll without standing up a
            notebook. Export a cleaned subset once outliers are removed.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-media-adops-forecasts",
      title: "Media planning CSVs: line items, flights, and trafficking QA",
      description:
        "Ad ops and planning teams validate trafficking exports and forecast spreadsheets saved as CSV: flight dates, creative IDs, and pacing fields.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["ad ops csv", "media planning csv", "trafficking export"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Digital campaigns generate dense tables: line items, placements,
            creative rotations, and geo splits. Whether the source is an ad
            server export or a planner workbook saved as CSV, the goal is the
            same: confirm that <strong>dates, budgets, and IDs</strong> line up
            before spend hits the exchange.
          </p>
          <h2>QA checklist</h2>
          <ul>
            <li>
              <strong>Flight dates</strong> inclusive versus exclusive end
              dates, especially across time zones.
            </li>
            <li>
              <strong>Creative IDs</strong> that resolve in the asset library,
              not just in the planning doc.
            </li>
            <li>
              <strong>Rate</strong> and <strong>unit</strong> pairs (CPM, CPC,
              CPA) spelled consistently.
            </li>
            <li>
              Duplicate line keys that would double-count impressions in a
              merge.
            </li>
          </ul>
          <h2>Review in Table</h2>
          <p>
            <strong>Table</strong> lets you reorder columns so flight window and
            line ID stay visible, filter to one advertiser, and search for a
            trafficking typo without uploading media plans to a third-party
            converter.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-insurance-policy-admin",
      title: "Policy admin CSV extracts: riders, premiums, and state codes",
      description:
        "Insurance operations teams work from policy admin CSV extracts for renewals, audits, and state reporting. Here is how to validate codes and amounts.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: [
        "insurance csv export",
        "policy admin csv",
        "premium extract csv",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Policy administration platforms export{" "}
            <strong>book-of-business</strong> snapshots as CSV for actuarial
            partners, state filings, and internal controls. Files bundle policy
            numbers, effective dates, premium components, riders, and
            jurisdiction codes. Small encoding mistakes propagate into
            compliance risk.
          </p>
          <h2>Fields that deserve attention</h2>
          <ul>
            <li>
              <strong>State or province codes</strong> aligned with the latest
              NAIC or regional reference, not free text.
            </li>
            <li>
              <strong>Premium breakdown</strong> between base, fees, taxes, and
              riders.
            </li>
            <li>
              <strong>Status</strong> values (active, pending, cancelled)
              consistent with the as-of date of the extract.
            </li>
            <li>
              Personally identifiable fields handled under your retention
              policy.
            </li>
          </ul>
          <h2>Controlled review</h2>
          <p>
            Use <strong>Table</strong> on a secured workstation to sort by
            renewal month, filter to one state, and verify totals without
            routing regulated extracts through extra cloud services.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-nonprofit-donations",
      title: "Donation and CRM CSVs for nonprofits: campaigns and soft credits",
      description:
        "Fundraising operations reconcile gift exports, soft credits, and campaign codes in CSV before audits and board reporting.",
      publishedAt: "2025-03-19",
      category: "guide",
      readTimeMinutes: 6,
      keywords: [
        "nonprofit donation csv",
        "fundraising export csv",
        "crm gifts csv",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Donor CRMs export gifts, pledges, and soft credits as CSV for
            finance, grants, and annual reports. The hard part is{" "}
            <strong>attribution</strong>: matching each row to the right
            campaign, fiscal year, and recognition name without double counting
            when soft credits mirror hard gifts.
          </p>
          <h2>Reconciliation habits</h2>
          <ul>
            <li>
              Align <strong>gift date</strong> with your fiscal calendar rules,
              not only the bank deposit date.
            </li>
            <li>
              Separate <strong>in-kind</strong> rows from cash when totals feed
              restricted fund reporting.
            </li>
            <li>
              Validate <strong>campaign codes</strong> against the active
              taxonomy in the CRM.
            </li>
            <li>
              Watch duplicate <strong>transaction IDs</strong> from retried
              imports.
            </li>
          </ul>
          <h2>Table before the audit binder</h2>
          <p>
            Load the export into <strong>Table</strong>, filter by campaign,
            aggregate mentally with sorted subtotals, and fix obvious issues
            with inline edits and undo. Keep donor PII on devices your policy
            allows.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-manufacturing-bom",
      title: "Bill of materials CSVs: part numbers, revisions, and substitutes",
      description:
        "Engineering and supply chain teams exchange BOM extracts as CSV. Here is how to check revision levels, quantities, and substitute chains.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: [
        "bom csv export",
        "manufacturing csv",
        "bill of materials csv",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            PLM and ERP systems flatten <strong>bill of materials</strong> trees
            into CSV for contract manufacturers, costing, and procurement. Rows
            list parent assembly, child part, quantity per, unit of measure, and
            effectivity dates. One wrong revision flag can scrap a build.
          </p>
          <h2>Structural checks</h2>
          <ul>
            <li>
              <strong>Revision</strong> or <strong>version</strong> columns
              matching the released drawing set.
            </li>
            <li>
              <strong>Quantity</strong> and UOM pairs that parse as numbers, not
              text with hidden spaces.
            </li>
            <li>
              <strong>Substitute</strong> groups clearly keyed so buyers do not
              double-order alternates.
            </li>
            <li>
              Circular references caught by parent-child integrity rules before
              the CSV leaves engineering.
            </li>
          </ul>
          <h2>Collaborate via Table</h2>
          <p>
            Open the BOM CSV in <strong>Table</strong>, search for a part number
            across all assemblies, and sort children under one parent SKU.
            Export the reviewed slice for a vendor who only needs a subtree.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-weather-and-climate-datasets",
      title:
        "Weather station CSV samples: units, missing readings, and metadata",
      description:
        "Public and proprietary weather CSVs bundle station metadata with readings. Understand units, nulls, and elevation before analysis.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: ["weather csv data", "climate dataset csv", "station csv"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Weather agencies and research groups publish{" "}
            <strong>CSV slices</strong> for temperature, precipitation, and wind
            alongside station IDs and coordinates. Formats vary: some use
            explicit unit columns, others rely on documentation. Missing values
            may appear as empty cells, NaN strings, or sentinel numbers.
          </p>
          <h2>Before you model</h2>
          <ul>
            <li>
              Read the <strong>readme</strong> for unit conventions (Celsius
              versus Fahrenheit, mm versus inches).
            </li>
            <li>
              Parse <strong>timestamp</strong> columns with explicit timezone or
              assume UTC only when the provider says so.
            </li>
            <li>
              Join <strong>station metadata</strong> on stable IDs, not display
              names that change.
            </li>
            <li>
              Flag long runs of identical readings that may indicate sensor
              freeze rather than calm weather.
            </li>
          </ul>
          <h2>Preview in Table</h2>
          <p>
            <strong>Table</strong> helps you preview thousands of rows, sort by
            station, and spot unit mix-ups in a side column before you commit
            the file to a heavier analytics stack.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-line-endings-crlf-vs-lf",
      title: "Line endings CRLF vs LF: Git, Windows editors, and CSV parsers",
      description:
        "Why Windows CRLF and Unix LF endings confuse diffs and parsers, how Git attributes interact, and how to normalize exports.",
      publishedAt: "2025-03-19",
      category: "guide",
      readTimeMinutes: 6,
      keywords: ["crlf vs lf csv", "csv line endings", "git csv eol"],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Text files end each line with invisible characters. Windows
            traditionally uses <strong>CRLF</strong> (
            <code className="text-foreground">\r\n</code>); Unix and macOS
            prefer <strong>LF</strong> (
            <code className="text-foreground">\n</code>). CSV is not special:
            mixed endings create duplicate-looking rows in some tools and noisy
            Git diffs even when the data is identical.
          </p>
          <h2>When it matters</h2>
          <ul>
            <li>
              <strong>Strict parsers</strong> that treat CR as part of the last
              column value.
            </li>
            <li>
              <strong>Hashing</strong> or checksum pipelines where whitespace
              changes the fingerprint.
            </li>
            <li>
              <strong>Cross-platform</strong> teams where one side re-saves CSV
              in Notepad and the other in vim.
            </li>
          </ul>
          <h2>Normalize deliberately</h2>
          <ul>
            <li>
              Configure <code className="text-foreground">.gitattributes</code>{" "}
              for text exports if the repo should enforce LF.
            </li>
            <li>
              Use editor or CLI tools to convert endings before handoff, not
              halfway through a review chain.
            </li>
          </ul>
          <p>
            After normalization, open the file in <strong>Table</strong> and
            confirm row counts match expectations. Search for stray{" "}
            <code className="text-foreground">\r</code> characters if a column
            still looks padded on one platform only.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-app-store-connect-sales",
      title:
        "App Store Connect sales CSV: territories, SKUs, and proceeds columns",
      description:
        "Apple App Store Connect financial reports as CSV: understanding SKU columns, currency, proceeds versus customer price, and fiscal weeks.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: [
        "app store connect csv",
        "apple sales csv",
        "ios proceeds export",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Mobile publishers download <strong>sales and trends</strong> reports
            from App Store Connect as tab-delimited or CSV-style text depending
            on the report type and era of the template. Columns cover territory,
            SKU, product type, units, customer price, proceeds, and exchange
            rates. Apple fiscal calendars do not always match calendar months.
          </p>
          <h2>Read the file carefully</h2>
          <ul>
            <li>
              <strong>Proceeds</strong> versus <strong>customer price</strong>{" "}
              after Apple commission and tax treatment.
            </li>
            <li>
              <strong>Currency</strong> per row versus your reporting currency
              after FX columns.
            </li>
            <li>
              <strong>Subscription</strong> events versus one-time purchases in
              the same export for some report types.
            </li>
            <li>
              Refund rows with negative units that should net against originals
              by transaction identifier when available.
            </li>
          </ul>
          <h2>Local review</h2>
          <p>
            Import into <strong>Table</strong>, filter to one territory or SKU,
            and reconcile subtotals to the Connect UI before you merge into your
            finance model. Parsing stays in the browser on your machine.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-play-console-reports",
      title:
        "Google Play Console CSV reports: installs, revenue, and countries",
      description:
        "Android developers validate Play Console CSV exports for installs, buyer geography, and revenue splits before FP&A consolidation.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: [
        "google play csv",
        "play console export",
        "android revenue csv",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Google Play offers multiple downloadable reports: statistics,
            earnings, and subscription metrics. Layouts change over time, but
            CSV remains the common interchange into spreadsheets and warehouses.
            Rows are often <strong>daily grain</strong> per country and product
            identifier.
          </p>
          <h2>Consistency checks</h2>
          <ul>
            <li>
              Match <strong>package name</strong> and SKU columns to your
              internal product catalog.
            </li>
            <li>
              Separate <strong>gross</strong> revenue, taxes, and Google fees
              according to the report definition for that file.
            </li>
            <li>
              Watch <strong>timezone</strong> on transaction timestamps versus
              user-facing dashboards.
            </li>
            <li>
              Compare new file row counts to prior periods to catch partial
              downloads.
            </li>
          </ul>
          <h2>Use Table</h2>
          <p>
            <strong>Table</strong> helps you sort by country, search for a
            specific SKU, and export a reconciled subset for your cross-platform
            revenue sheet alongside iOS data.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-amazon-seller-reports",
      title:
        "Amazon Seller Central flat files: inventory and settlement previews",
      description:
        "Marketplace sellers scan Amazon settlement and inventory CSVs for stranded listings, fee columns, and order ID joins.",
      publishedAt: "2025-03-19",
      category: "insights",
      readTimeMinutes: 6,
      keywords: [
        "amazon seller csv",
        "seller central report csv",
        "fba settlement csv",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Amazon Seller Central exposes <strong>flat file downloads</strong>{" "}
            for settlements, inventory, returns, and catalog health. Files are
            wide, region-specific, and loaded with fee breakdown columns.
            Sellers use them to true up cash received against expected unit
            economics.
          </p>
          <h2>Practical scanning</h2>
          <ul>
            <li>
              Join <strong>order ID</strong> and <strong>SKU</strong> columns
              across settlement and order reports.
            </li>
            <li>
              Reconcile <strong>quantity</strong> fields with FBA inbound
              shipments when investigating shrink.
            </li>
            <li>
              Track <strong>advertising</strong> and <strong>promotion</strong>{" "}
              fee lines separately from referral fees.
            </li>
            <li>
              Note marketplace: US, EU, and JP templates differ in tax columns.
            </li>
          </ul>
          <h2>Table on your laptop</h2>
          <p>
            Load the CSV into <strong>Table</strong>, hide columns you do not
            need for this question, filter to one SKU or settlement period, and
            scroll with pagination instead of freezing Excel repeatedly.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-woocommerce-exports",
      title:
        "WooCommerce product and order CSV exports: attributes and variations",
      description:
        "WordPress merchants clean WooCommerce CSV exports for attributes, variation SKUs, and order line items before ERP or migration tools ingest them.",
      publishedAt: "2025-03-19",
      category: "guide",
      readTimeMinutes: 7,
      keywords: [
        "woocommerce csv export",
        "wordpress product csv",
        "woo order csv",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            WooCommerce and popular export plugins emit CSV for products,
            variations, customers, and orders. Attribute columns are often
            repeated with plugin-specific names. Orders explode into multiple
            rows per line item, which surprises people expecting one row per
            order.
          </p>
          <h2>Product exports</h2>
          <ul>
            <li>
              Map <strong>parent SKU</strong> to <strong>variation</strong> rows
              with attribute values like size and color.
            </li>
            <li>
              Normalize <strong>category</strong> paths and tag lists that use
              different separators.
            </li>
            <li>
              Confirm <strong>stock</strong> quantities after partial imports.
            </li>
          </ul>
          <h2>Order exports</h2>
          <ul>
            <li>
              Decide whether grain is <strong>order</strong>,{" "}
              <strong>line</strong>, or <strong>shipment</strong> before merging
              to finance.
            </li>
            <li>
              Carry <strong>tax</strong> and <strong>discount</strong> columns
              at the same grain as revenue.
            </li>
          </ul>
          <p>
            <strong>Table</strong> supports reordering columns, filtering to one
            product type, and exporting a cleaned CSV for your ERP or migration
            consultant without uploading catalog data to random online tools.
          </p>
        </BlogProse>
      );
    },
  },
  {
    meta: {
      slug: "csv-for-shopify-exports",
      title:
        "Shopify order and product CSV: metafields, tags, and inventory rows",
      description:
        "DTC brands review Shopify exports before ERP sync: line-level orders, multi-location inventory, and metafield columns.",
      publishedAt: "2025-03-19",
      category: "guide",
      readTimeMinutes: 7,
      keywords: [
        "shopify csv export",
        "shopify order csv",
        "shopify inventory csv",
      ],
    },
    Content: function Post() {
      return (
        <BlogProse>
          <p>
            Shopify admin exports are the lingua franca between merchants,
            agencies, and back-office systems. <strong>Product</strong> CSVs
            list variants, options, pricing, and inventory by location.{" "}
            <strong>Order</strong> CSVs are line-level: one row per line item
            with duplicated order-level fields. <strong>Metafields</strong>{" "}
            appear as extra columns when exposed in the export profile.
          </p>
          <h2>Gotchas</h2>
          <ul>
            <li>
              <strong>Financial status</strong> and <strong>fulfillment</strong>{" "}
              status on each line should align with how your ERP books revenue.
            </li>
            <li>
              <strong>Discounts</strong> and <strong>taxes</strong> may need
              allocation logic when rolled to order grain.
            </li>
            <li>
              <strong>Inventory</strong> quantities are per location; summing
              without checking location columns double counts.
            </li>
            <li>
              <strong>Tags</strong> and comma-heavy titles require proper CSV
              quoting from Shopify; broken quotes point to manual edits.
            </li>
          </ul>
          <h2>Table in the Shopify stack</h2>
          <p>
            Download the CSV, open it in <strong>Table</strong>, sort by SKU or
            order name, use search for a customer segment, and trim columns
            before you sync to NetSuite, Cin7, or a custom warehouse loader.
            Your data stays in the browser session on your device.
          </p>
        </BlogProse>
      );
    },
  },
];
