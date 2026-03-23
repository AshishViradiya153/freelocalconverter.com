import type { ToolCategoryDefinition } from "@/lib/pseo/types";

/**
 * Hub definitions for `/tools/[category]`. Each programmatic tool page must use
 * a `route.category` that exists here.
 */
export const toolCategories: ToolCategoryDefinition[] = [
  {
    slug: "csv-viewers",
    title: "CSV viewers and editors",
    description:
      "Browser-based ways to open, sort, filter, compare, and export CSV files without uploading sensitive rows to unknown servers.",
    hubIntro: [
      "These pages focus on workflows where teams need a fast grid on top of a flat file: finance extracts, CRM exports, and operations spreadsheets saved as CSV.",
      "Table is built for local-first review: parsing happens in your browser, with optional session restore on your device, a dedicated compare mode for two files side by side, and clear controls when you are done.",
    ],
  },
  {
    slug: "ecommerce-csv",
    title: "E-commerce and marketplace CSVs",
    description:
      "Guides for Shopify, Amazon, and multi-channel exports when you need to validate rows before ERP, accounting, or fulfillment systems ingest them.",
    hubIntro: [
      "Order and inventory CSVs are wide, repetitive, and easy to break with a single bad column. The hub pages here spell out grain, joins, and common QA checks.",
      "Use a local grid to search for SKUs, spot duplicate line keys, and compare subtotals to what you see in the admin UI before you commit to downstream automation.",
    ],
  },
];
