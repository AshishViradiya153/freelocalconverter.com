import { cellValueToPlainString } from "@/lib/csv-column-ops";
import type { CsvViewerRow } from "@/lib/csv-import";
import { parseTsv } from "@/lib/data-grid";
import { createEmptyCsvViewerRow } from "@/lib/csv-viewer";
import { generateId } from "@/lib/id";

export function buildCsvRowClipboardTsv(
  row: CsvViewerRow,
  columnKeys: string[],
): string {
  return columnKeys.map((k) => cellValueToPlainString(row[k])).join("\t");
}

/** One {@link CsvViewerRow} per non-empty TSV line; pads/truncates to `columnKeys.length`. */
export function csvViewerRowsFromClipboardTsv(
  text: string,
  columnKeys: string[],
): CsvViewerRow[] {
  const trimmed = text.trim();
  if (trimmed === "") return [];
  const grid = parseTsv(trimmed, columnKeys.length);
  return grid.map((cells) => {
    const r = createEmptyCsvViewerRow(columnKeys);
    r.id = generateId();
    for (let i = 0; i < columnKeys.length; i++) {
      const key = columnKeys[i];
      if (key) r[key] = cells[i] ?? "";
    }
    return r;
  });
}
