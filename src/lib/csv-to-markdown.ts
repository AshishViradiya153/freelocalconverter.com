import type { CsvViewerSession } from "@/lib/csv-viewer-session";

function escapeMarkdownCell(value: string): string {
  // Escape pipe separators so markdown table parsing stays aligned.
  const escapedPipes = value.replace(/\|/g, "\\|");
  // Keep line breaks visible in markdown tables.
  return escapedPipes.replace(/\r?\n/g, "<br/>");
}

/**
 * Convert a CSV-like grid session into a GitHub-flavored markdown table.
 *
 * Notes:
 * - Cell values are treated as strings.
 * - `|` is escaped as `\|` and newlines are rendered as `<br/>`.
 * - Header row uses the current session's header labels.
 */
export function csvSessionToMarkdownTable(session: CsvViewerSession): string {
  const headers = session.headerLabels;
  const columnKeys = session.columnKeys;

  const headerCells = headers.map((h) => escapeMarkdownCell(String(h ?? "")));
  const sepCells = headers.map(() => "---");

  const lines: string[] = [];
  lines.push(`| ${headerCells.join(" | ")} |`);
  lines.push(`| ${sepCells.join(" | ")} |`);

  for (const row of session.rows) {
    const cells = columnKeys.map((k) => {
      const v = row[k];
      if (v === null || v === undefined) return "";
      return escapeMarkdownCell(v instanceof Date ? v.toISOString() : String(v));
    });
    lines.push(`| ${cells.join(" | ")} |`);
  }

  return `${lines.join("\n")}\n`;
}

