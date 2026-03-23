/**
 * Maps commercial intents to templates and primary page ids. Extend this when
 * adding pages so editors can see coverage and avoid overlapping primary keywords.
 */
export const pseoKeywordMatrix = [
  {
    intent: "open large csv without excel",
    template: "guide" as const,
    primaryPageId: "guide-open-large-csv-without-excel",
  },
  {
    intent: "prepare csv for google sheets",
    template: "guide" as const,
    primaryPageId: "guide-prepare-csv-google-sheets",
  },
  {
    intent: "browser csv viewer privacy",
    template: "tool" as const,
    category: "csv-viewers",
    primaryPageId: "tool-browser-csv-grid-local-review",
  },
  {
    intent: "shopify order export csv review",
    template: "tool" as const,
    category: "ecommerce-csv",
    primaryPageId: "tool-shopify-order-csv-qa",
  },
  {
    intent: "compare two csv files in browser",
    template: "guide" as const,
    primaryPageId: "guide-compare-two-csv-files-browser",
  },
  {
    intent: "browser csv compare side by side",
    template: "tool" as const,
    category: "csv-viewers",
    primaryPageId: "tool-browser-csv-compare-side-by-side",
  },
] as const;
