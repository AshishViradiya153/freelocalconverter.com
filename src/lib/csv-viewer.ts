import type { ColumnDef } from "@tanstack/react-table";
import type { CsvViewerRow } from "@/lib/csv-import";
import { generateId } from "@/lib/id";

/**
 * Ordered accessor keys from TanStack column defs (skips e.g. select-only columns).
 */
export function getAccessorKeysFromColumnDefs<T>(
  columns: ColumnDef<T>[],
): string[] {
  return columns
    .map((c) => {
      if ("accessorKey" in c && typeof c.accessorKey === "string") {
        return c.accessorKey;
      }
      return null;
    })
    .filter((k): k is string => Boolean(k));
}

/** New grid row for CSV viewer: stable id plus empty string for each data column. */
export function createEmptyCsvViewerRow(columnKeys: string[]): CsvViewerRow {
  const row: CsvViewerRow = { id: generateId() };
  for (const key of columnKeys) {
    row[key] = "";
  }
  return row;
}
