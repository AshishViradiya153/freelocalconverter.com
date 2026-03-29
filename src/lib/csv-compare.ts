import type { CsvColumnKind, CsvViewerRow } from "@/lib/csv-import";
import { createEmptyCsvViewerRow } from "@/lib/csv-viewer";
import type { CsvViewerSession } from "@/lib/csv-viewer-session";

export interface CompareEqualityOptions {
  trimWhitespace: boolean;
  ignoreCase: boolean;
}

export const defaultCompareEqualityOptions: CompareEqualityOptions = {
  trimWhitespace: false,
  ignoreCase: false,
};

export function normalizeCellForCompare(
  value: unknown,
  opts: CompareEqualityOptions,
): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (opts.trimWhitespace) s = s.trim();
  if (opts.ignoreCase) s = s.toLowerCase();
  return s;
}

/** How left/right column keys relate (before optional reorder). */
export type ColumnStructureKind =
  | "mismatch"
  | "strict_order"
  | "same_keys_diff_order";

export function analyzeColumnStructure(
  left: CsvViewerSession,
  right: CsvViewerSession,
): ColumnStructureKind {
  if (left.columnKeys.length !== right.columnKeys.length) {
    return "mismatch";
  }
  const setL = new Set(left.columnKeys);
  const setR = new Set(right.columnKeys);
  if (
    setL.size !== left.columnKeys.length ||
    setR.size !== right.columnKeys.length
  ) {
    return "mismatch";
  }
  if (setL.size !== setR.size) return "mismatch";
  for (const k of setL) {
    if (!setR.has(k)) return "mismatch";
  }
  if (left.columnKeys.every((k, i) => k === right.columnKeys[i])) {
    return "strict_order";
  }
  return "same_keys_diff_order";
}

/**
 * Reorder right session columns to match left keys (same multiset of keys required).
 */
export function reorderRightSessionToMatchLeft(
  left: CsvViewerSession,
  right: CsvViewerSession,
): CsvViewerSession {
  const keyToLabel = new Map<string, string>();
  const keyToKind = new Map<string, CsvColumnKind>();
  right.columnKeys.forEach((k, i) => {
    keyToLabel.set(k, right.headerLabels[i] ?? k);
    keyToKind.set(k, right.columnKinds[i] ?? "short-text");
  });
  const orderedKeys = left.columnKeys;
  const headerLabels = orderedKeys.map((k) => keyToLabel.get(k) ?? k);
  const columnKinds = orderedKeys.map(
    (k) => keyToKind.get(k) ?? ("short-text" as CsvColumnKind),
  );
  const rows = right.rows.map((r) => {
    const out: CsvViewerRow = { id: r.id };
    for (const k of orderedKeys) {
      out[k] = k in r ? r[k] : "";
    }
    return out;
  });
  return {
    ...right,
    columnKeys: [...orderedKeys],
    headerLabels,
    columnKinds,
    rows,
  };
}

function cloneSessionWithRows(
  session: CsvViewerSession,
  rows: CsvViewerRow[],
): CsvViewerSession {
  return {
    ...session,
    rows,
    importedRowCount: rows.length,
    rowCountBeforeCap: rows.length,
    truncated: false,
  };
}

/**
 * Align right rows to left by matching values in `keyColumn`. Unmatched left rows get an empty right row; extra right rows append at the bottom with empty left rows.
 */
export function alignSessionsByKeyColumn(
  left: CsvViewerSession,
  right: CsvViewerSession,
  keyColumn: string,
  opts: CompareEqualityOptions,
): { alignedLeft: CsvViewerSession; alignedRight: CsvViewerSession } {
  function normKey(row: CsvViewerRow | undefined): string {
    if (!row) return "\0__MISSING__";
    const v = normalizeCellForCompare(row[keyColumn], opts);
    return v === "" ? "\0__EMPTY_KEY__" : v;
  }

  const queues = new Map<string, CsvViewerRow[]>();
  for (const r of right.rows) {
    const k = normKey(r);
    const q = queues.get(k) ?? [];
    q.push({ ...r });
    queues.set(k, q);
  }

  const newLeftRows: CsvViewerRow[] = [];
  const newRightRows: CsvViewerRow[] = [];

  for (const lr of left.rows) {
    const k = normKey(lr);
    const q = queues.get(k);
    let rr: CsvViewerRow | undefined;
    if (q && q.length > 0) {
      rr = q.shift();
      if (q.length === 0) queues.delete(k);
    }
    newLeftRows.push({ ...lr });
    if (rr) {
      newRightRows.push(rr);
    } else {
      newRightRows.push(createEmptyCsvViewerRow(left.columnKeys));
    }
  }

  const remaining: CsvViewerRow[] = [];
  for (const q of queues.values()) {
    remaining.push(...q);
  }
  for (const rr of remaining) {
    newLeftRows.push(createEmptyCsvViewerRow(left.columnKeys));
    newRightRows.push(rr);
  }

  return {
    alignedLeft: cloneSessionWithRows(left, newLeftRows),
    alignedRight: cloneSessionWithRows(right, newRightRows),
  };
}

export interface CsvCompareStats {
  canCompareCells: boolean;
  /** True when keys match in the same order (no reorder step). */
  identicalColumnStructure: boolean;
  /** When keys match but order differed; reorder-to-left was applied for compare. */
  columnsReorderedToMatchLeft: boolean;
  columnStructureKind: ColumnStructureKind;
  leftRowCount: number;
  rightRowCount: number;
  leftColumnCount: number;
  rightColumnCount: number;
  maxRows: number;
  rowsWithDifferences: number;
  differingCells: number;
  comparableCells: number;
  differingRowIndices: number[];
}

export function computeCsvCompareStats(
  left: CsvViewerSession,
  right: CsvViewerSession,
  opts: CompareEqualityOptions = defaultCompareEqualityOptions,
): CsvCompareStats {
  const structure = analyzeColumnStructure(left, right);
  const leftRowCount = left.rows.length;
  const rightRowCount = right.rows.length;
  const maxRows = Math.max(leftRowCount, rightRowCount);

  if (structure === "mismatch") {
    return {
      canCompareCells: false,
      identicalColumnStructure: false,
      columnsReorderedToMatchLeft: false,
      columnStructureKind: structure,
      leftRowCount,
      rightRowCount,
      leftColumnCount: left.columnKeys.length,
      rightColumnCount: right.columnKeys.length,
      maxRows,
      rowsWithDifferences: 0,
      differingCells: 0,
      comparableCells: 0,
      differingRowIndices: [],
    };
  }

  const keys = left.columnKeys;
  const comparableCells = maxRows * keys.length;
  let differingCells = 0;
  let rowsWithDifferences = 0;
  const differingRowIndices: number[] = [];

  for (let i = 0; i < maxRows; i++) {
    const lr = left.rows[i];
    const rr = right.rows[i];
    let rowDiffers = false;
    for (const key of keys) {
      const a = normalizeCellForCompare(lr?.[key], opts);
      const b = normalizeCellForCompare(rr?.[key], opts);
      if (a !== b) {
        differingCells++;
        rowDiffers = true;
      }
    }
    if (rowDiffers) {
      rowsWithDifferences++;
      differingRowIndices.push(i);
    }
  }

  return {
    canCompareCells: true,
    identicalColumnStructure: structure === "strict_order",
    columnsReorderedToMatchLeft: structure === "same_keys_diff_order",
    columnStructureKind: structure,
    leftRowCount,
    rightRowCount,
    leftColumnCount: keys.length,
    rightColumnCount: keys.length,
    maxRows,
    rowsWithDifferences,
    differingCells,
    comparableCells,
    differingRowIndices,
  };
}

export function filterSessionToRowIndices(
  session: CsvViewerSession,
  indices: readonly number[],
): CsvViewerSession {
  const rows = indices.map((i) => {
    const existing = session.rows[i];
    if (existing) return { ...existing };
    return createEmptyCsvViewerRow(session.columnKeys);
  });
  return {
    ...session,
    rows,
    importedRowCount: rows.length,
    truncated: false,
    rowCountBeforeCap: rows.length,
  };
}

const DIFF_KEY_SEP = "\t";

export function buildDiffHighlightSets(
  left: CsvViewerSession,
  right: CsvViewerSession,
  opts: CompareEqualityOptions = defaultCompareEqualityOptions,
): { left: Set<string>; right: Set<string> } {
  const keys = left.columnKeys;
  const leftSet = new Set<string>();
  const rightSet = new Set<string>();
  const n = Math.max(left.rows.length, right.rows.length);
  for (let i = 0; i < n; i++) {
    const lr = left.rows[i];
    const rr = right.rows[i];
    for (const key of keys) {
      const a = normalizeCellForCompare(lr?.[key], opts);
      const b = normalizeCellForCompare(rr?.[key], opts);
      if (a !== b) {
        if (lr) leftSet.add(`${lr.id}${DIFF_KEY_SEP}${key}`);
        if (rr) rightSet.add(`${rr.id}${DIFF_KEY_SEP}${key}`);
      }
    }
  }
  return { left: leftSet, right: rightSet };
}

export function buildCompareDiffReportCsv(
  left: CsvViewerSession,
  right: CsvViewerSession,
  opts: CompareEqualityOptions = defaultCompareEqualityOptions,
): string {
  const lines: string[][] = [
    ["row_index", "column", "left_value", "right_value"],
  ];
  const keys = left.columnKeys;
  const labelByKey = new Map(
    keys.map((k, i) => [k, left.headerLabels[i] ?? k] as const),
  );
  const n = Math.max(left.rows.length, right.rows.length);
  for (let i = 0; i < n; i++) {
    const lr = left.rows[i];
    const rr = right.rows[i];
    for (const key of keys) {
      const a = normalizeCellForCompare(lr?.[key], opts);
      const b = normalizeCellForCompare(rr?.[key], opts);
      if (a !== b) {
        lines.push([
          String(i + 1),
          labelByKey.get(key) ?? key,
          lr ? String(lr[key] ?? "") : "",
          rr ? String(rr[key] ?? "") : "",
        ]);
      }
    }
  }
  return lines
    .map((row) =>
      row
        .map((cell) => {
          const s = cell.replaceAll('"', '""');
          if (/[",\n\r]/.test(s)) return `"${s}"`;
          return s;
        })
        .join(","),
    )
    .join("\n");
}

export function downloadCompareDiffReport(
  csvBody: string,
  baseName: string,
): void {
  const safe = baseName.replace(/[^\w-]+/g, "_").slice(0, 80) || "compare";
  const blob = new Blob([csvBody], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}_diff_report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface PrepareCompareOptions {
  matchColumnsByName: boolean;
  alignRows: "index" | "key";
  alignKeyColumn: string;
  equality: CompareEqualityOptions;
}

/**
 * Build left/right sessions used for diff stats, highlighting, and export.
 * `comparable` is false when column keys differ, or the same keys appear in a
 * different order and the user disabled “match columns by name”.
 */
export function prepareCompareWorkSessions(
  left: CsvViewerSession,
  right: CsvViewerSession,
  options: PrepareCompareOptions,
): {
  workLeft: CsvViewerSession;
  workRight: CsvViewerSession;
  comparable: boolean;
} {
  const st = analyzeColumnStructure(left, right);
  if (st === "mismatch") {
    return { workLeft: left, workRight: right, comparable: false };
  }
  if (st === "same_keys_diff_order" && !options.matchColumnsByName) {
    return { workLeft: left, workRight: right, comparable: false };
  }

  let L = left;
  let R =
    st === "same_keys_diff_order"
      ? reorderRightSessionToMatchLeft(left, right)
      : right;

  if (
    options.alignRows === "key" &&
    options.alignKeyColumn &&
    L.columnKeys.includes(options.alignKeyColumn)
  ) {
    const { alignedLeft, alignedRight } = alignSessionsByKeyColumn(
      L,
      R,
      options.alignKeyColumn,
      options.equality,
    );
    L = alignedLeft;
    R = alignedRight;
  }

  return { workLeft: L, workRight: R, comparable: true };
}

/** Summary when automatic cell comparison is disabled (structure mismatch or column order not reconciled). */
export function incomparableSummaryStats(
  left: CsvViewerSession,
  right: CsvViewerSession,
): CsvCompareStats {
  const st = analyzeColumnStructure(left, right);
  return {
    canCompareCells: false,
    identicalColumnStructure: st === "strict_order",
    columnsReorderedToMatchLeft: false,
    columnStructureKind: st,
    leftRowCount: left.rows.length,
    rightRowCount: right.rows.length,
    leftColumnCount: left.columnKeys.length,
    rightColumnCount: right.columnKeys.length,
    maxRows: Math.max(left.rows.length, right.rows.length),
    rowsWithDifferences: 0,
    differingCells: 0,
    comparableCells: 0,
    differingRowIndices: [],
  };
}
