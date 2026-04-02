import {
  CSV_IMPORT_MAX_ROWS,
  type CsvImportResult,
  type CsvViewerRow,
} from "@/lib/csv-import";
import { getAccessorKeysFromColumnDefs } from "@/lib/csv-viewer";
import { generateId } from "@/lib/id";

function normalizeHeaderLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildLabelToKeyMap(result: CsvImportResult): Map<string, string> {
  const keys = getAccessorKeysFromColumnDefs(result.columns);
  const m = new Map<string, string>();
  for (let i = 0; i < result.headerLabels.length; i++) {
    const label = result.headerLabels[i] ?? "";
    const key = keys[i];
    if (key) m.set(normalizeHeaderLabel(label), key);
  }
  return m;
}

function cellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

/**
 * True when every non-empty cell in the source row matches the corresponding
 * base header label (trim, case-insensitive). Used to drop repeated header
 * lines pasted into files after the first.
 */
export function sourceRowMatchesBaseHeaders(
  row: CsvViewerRow,
  srcKeyForBaseCol: (string | null)[],
  baseLabels: string[],
): boolean {
  let checked = 0;
  for (let i = 0; i < srcKeyForBaseCol.length; i++) {
    const sk = srcKeyForBaseCol[i];
    if (sk == null) continue;
    const s = cellString(row[sk]);
    if (s === "") continue;
    checked++;
    const label = (baseLabels[i] ?? "").trim().toLowerCase();
    if (s.toLowerCase() !== label) return false;
  }
  return checked > 0;
}

function projectRowToBase(
  row: CsvViewerRow,
  baseKeys: string[],
  srcKeyForBaseCol: (string | null)[],
): CsvViewerRow {
  const out: CsvViewerRow = { id: generateId() };
  for (let i = 0; i < baseKeys.length; i++) {
    const bk = baseKeys[i];
    if (!bk) continue;
    const sk = srcKeyForBaseCol[i];
    out[bk] = sk != null ? (row[sk] ?? "") : "";
  }
  return out;
}

function rowSignature(row: CsvViewerRow, columnKeys: string[]): string {
  return columnKeys.map((k) => cellString(row[k])).join("\u0001");
}

export function dedupeMergedRows(
  rows: CsvViewerRow[],
  columnKeys: string[],
): CsvViewerRow[] {
  const seen = new Set<string>();
  const out: CsvViewerRow[] = [];
  for (const row of rows) {
    const sig = rowSignature(row, columnKeys);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(row);
  }
  return out;
}

/** Remove columns whose values equal an earlier column on every row. */
export function dedupeDuplicateValueColumns(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
): { rows: CsvViewerRow[]; columnKeys: string[]; headerLabels: string[] } {
  if (columnKeys.length <= 1) {
    return {
      rows,
      columnKeys: [...columnKeys],
      headerLabels: [...headerLabels],
    };
  }

  const keep = new Array(columnKeys.length).fill(true);

  for (let j = 1; j < columnKeys.length; j++) {
    if (!keep[j]) continue;
    const kj = columnKeys[j];
    if (!kj) continue;
    for (let i = 0; i < j; i++) {
      if (!keep[i]) continue;
      const ki = columnKeys[i];
      if (!ki) continue;
      let allEqual = true;
      for (const row of rows) {
        if (cellString(row[ki]) !== cellString(row[kj])) {
          allEqual = false;
          break;
        }
      }
      if (allEqual) {
        keep[j] = false;
        break;
      }
    }
  }

  const nextKeys: string[] = [];
  const nextLabels: string[] = [];
  for (let i = 0; i < columnKeys.length; i++) {
    if (keep[i]) {
      const k = columnKeys[i];
      if (k) nextKeys.push(k);
      nextLabels.push(headerLabels[i] ?? k ?? "");
    }
  }

  const nextRows = rows.map((row) => {
    const out: CsvViewerRow = { id: row.id };
    for (const k of nextKeys) out[k] = row[k];
    return out;
  });

  return {
    rows: nextRows,
    columnKeys: nextKeys,
    headerLabels: nextLabels,
  };
}

function prependIndexColumn(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
): {
  rows: CsvViewerRow[];
  columnKeys: string[];
  headerLabels: string[];
} {
  let key = "Index";
  let n = 2;
  while (columnKeys.includes(key)) {
    key = `Index_${n}`;
    n++;
  }
  const nextRows = rows.map((row, i) => ({
    ...row,
    [key]: String(i + 1),
  }));
  return {
    rows: nextRows,
    columnKeys: [key, ...columnKeys],
    headerLabels: ["Index", ...headerLabels],
  };
}

export interface MergeCsvImportInput {
  result: CsvImportResult;
}

export interface MergeCsvOptions {
  /**
   * For each file after the first, drop the first data row when every
   * non-empty cell matches the first file’s header labels (repeated header).
   * Default true.
   */
  skipRepeatedHeaderRowsInSubsequentFiles?: boolean;
  /** Drop rows that are identical across all columns (after merge). */
  dedupeRows?: boolean;
  /** Drop columns whose values duplicate an earlier column on every row. */
  dedupeDuplicateColumns?: boolean;
  /** Prepend a 1-based Index column. */
  addIndexColumn?: boolean;
}

export interface MergeCsvOutput {
  rows: CsvViewerRow[];
  columnKeys: string[];
  headerLabels: string[];
  truncated: boolean;
  rowCountBeforeCap: number;
}

const defaultMergeOptions: Required<
  Pick<
    MergeCsvOptions,
    | "skipRepeatedHeaderRowsInSubsequentFiles"
    | "dedupeRows"
    | "dedupeDuplicateColumns"
    | "addIndexColumn"
  >
> = {
  skipRepeatedHeaderRowsInSubsequentFiles: true,
  dedupeRows: false,
  dedupeDuplicateColumns: false,
  addIndexColumn: false,
};

/**
 * Vertically stack rows from multiple parsed CSVs. The first file defines
 * column order and header labels; later files are aligned by header name
 * (trimmed, case-insensitive). Missing columns become empty cells.
 */
export function mergeCsvImports(
  inputs: MergeCsvImportInput[],
  options?: MergeCsvOptions,
): MergeCsvOutput {
  if (inputs.length === 0) {
    throw new Error("Add at least one CSV file.");
  }

  const opt = { ...defaultMergeOptions, ...options };

  const first = inputs[0];
  if (!first) throw new Error("Add at least one CSV file.");

  const baseKeys = getAccessorKeysFromColumnDefs(first.result.columns);
  const baseLabels = first.result.headerLabels;

  const merged: CsvViewerRow[] = [];
  let totalBeforeCap = 0;

  for (let fileIdx = 0; fileIdx < inputs.length; fileIdx++) {
    const input = inputs[fileIdx];
    if (!input) continue;

    const labelMap = buildLabelToKeyMap(input.result);
    const srcKeyForBaseCol = baseLabels.map((bl) => {
      return labelMap.get(normalizeHeaderLabel(bl)) ?? null;
    });

    let rows = input.result.rows;
    if (fileIdx > 0 && opt.skipRepeatedHeaderRowsInSubsequentFiles) {
      const head = rows[0];
      if (
        head &&
        sourceRowMatchesBaseHeaders(head, srcKeyForBaseCol, baseLabels)
      ) {
        rows = rows.slice(1);
      }
    }

    for (const row of rows) {
      totalBeforeCap += 1;
      if (merged.length >= CSV_IMPORT_MAX_ROWS) continue;
      merged.push(projectRowToBase(row, baseKeys, srcKeyForBaseCol));
    }
  }

  let columnKeys = [...baseKeys];
  let headerLabels = [...baseLabels];
  let outRows = merged;

  if (opt.dedupeRows) {
    outRows = dedupeMergedRows(outRows, columnKeys);
  }

  if (opt.dedupeDuplicateColumns) {
    const dc = dedupeDuplicateValueColumns(outRows, columnKeys, headerLabels);
    outRows = dc.rows;
    columnKeys = dc.columnKeys;
    headerLabels = dc.headerLabels;
  }

  if (opt.addIndexColumn) {
    const withIdx = prependIndexColumn(outRows, columnKeys, headerLabels);
    outRows = withIdx.rows;
    columnKeys = withIdx.columnKeys;
    headerLabels = withIdx.headerLabels;
  }

  return {
    rows: outRows,
    columnKeys,
    headerLabels,
    truncated: totalBeforeCap > CSV_IMPORT_MAX_ROWS,
    rowCountBeforeCap: totalBeforeCap,
  };
}
