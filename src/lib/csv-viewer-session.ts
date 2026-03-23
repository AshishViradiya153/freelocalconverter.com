import {
  buildColumnDefsForCsv,
  type CsvColumnKind,
  type CsvImportResult,
  type CsvViewerRow,
} from "@/lib/csv-import";
import { createEmptyCsvViewerRow, getAccessorKeysFromColumnDefs } from "@/lib/csv-viewer";
import { generateId } from "@/lib/id";
import type { Direction } from "@/types/data-grid";

export interface CsvViewerSession {
  version: 1;
  fileName: string;
  dir: Direction;
  columnKeys: string[];
  headerLabels: string[];
  columnKinds: CsvColumnKind[];
  rows: CsvViewerRow[];
  truncated: boolean;
  rowCountBeforeCap: number;
  importedRowCount: number;
}

export function cloneCsvViewerSession(s: CsvViewerSession): CsvViewerSession {
  return {
    ...s,
    columnKeys: [...s.columnKeys],
    headerLabels: [...s.headerLabels],
    columnKinds: [...s.columnKinds],
    rows: s.rows.map((row) => ({ ...row })),
  };
}

function columnKindFromDef(meta: unknown): CsvColumnKind {
  const v = (meta as { cell?: { variant?: string } } | undefined)?.cell
    ?.variant;
  if (v === "number" || v === "date") return v;
  return "short-text";
}

export function resultToSession(
  fileName: string,
  result: CsvImportResult,
  dir: Direction = "ltr",
): CsvViewerSession {
  const columnKeys = getAccessorKeysFromColumnDefs(result.columns);
  const columnKinds = result.columns.map((c) => columnKindFromDef(c.meta));
  return {
    version: 1,
    fileName,
    dir,
    columnKeys,
    headerLabels: [...result.headerLabels],
    columnKinds,
    rows: result.rows.map((r) => ({ ...r })),
    truncated: result.truncated,
    rowCountBeforeCap: result.rowCountBeforeCap,
    importedRowCount: result.rows.length,
  };
}

export function sessionToResult(session: CsvViewerSession): CsvImportResult {
  const kinds =
    session.columnKinds.length === session.columnKeys.length
      ? session.columnKinds
      : session.columnKeys.map(
        (_, i) => session.columnKinds[i] ?? "short-text",
      );
  const columns = buildColumnDefsForCsv(
    session.columnKeys,
    session.headerLabels,
    kinds,
  );
  return {
    rows: session.rows,
    columns,
    headerLabels: [...session.headerLabels],
    truncated: session.truncated,
    rowCountBeforeCap: session.rowCountBeforeCap,
  };
}

function collectMissingKeys(
  columnKeys: string[],
  rows: CsvViewerRow[],
): string[] {
  const existing = new Set(columnKeys);
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (k === "id" || existing.has(k) || seen.has(k)) continue;
      seen.add(k);
      ordered.push(k);
    }
  }
  return ordered;
}

/** Apply latest row data; append schema for any new keys (e.g. pasted columns). */
/**
 * Fix arrays corrupted or from older saves so column metadata aligns with keys.
 */
export function normalizeCsvViewerSessionForLoad(
  raw: CsvViewerSession,
): CsvViewerSession | null {
  if (!Array.isArray(raw.columnKeys) || raw.columnKeys.length === 0) {
    return null;
  }
  if (!Array.isArray(raw.rows)) {
    return null;
  }

  if (raw.columnKeys.some((k) => typeof k !== "string" || k.trim() === "")) {
    return null;
  }
  const columnKeys = [...raw.columnKeys];

  const headerLabels = [...raw.headerLabels];
  const columnKinds = [...raw.columnKinds] as CsvColumnKind[];

  for (let i = 0; i < columnKeys.length; i++) {
    const key = columnKeys[i];
    const label = headerLabels[i];
    if (typeof label !== "string" || label.trim() === "") {
      headerLabels[i] = key ?? `column_${i + 1}`;
    }
  }
  while (headerLabels.length < columnKeys.length) {
    const i = headerLabels.length;
    headerLabels.push(columnKeys[i] ?? `column_${i + 1}`);
  }
  headerLabels.length = columnKeys.length;

  const isKind = (k: unknown): k is CsvColumnKind =>
    k === "number" || k === "date" || k === "short-text";

  for (let i = 0; i < columnKeys.length; i++) {
    if (!isKind(columnKinds[i])) {
      columnKinds[i] = "short-text";
    }
  }
  while (columnKinds.length < columnKeys.length) {
    columnKinds.push("short-text");
  }
  columnKinds.length = columnKeys.length;

  const rows = raw.rows.map((row) => {
    const copy = { ...row } as CsvViewerRow;
    if (typeof copy.id !== "string" || copy.id.length === 0) {
      copy.id = generateId();
    }
    return copy;
  });

  const importedRowCount =
    typeof raw.importedRowCount === "number"
      ? raw.importedRowCount
      : rows.length;

  const dir: Direction = raw.dir === "rtl" ? "rtl" : "ltr";

  return {
    version: 1,
    fileName:
      typeof raw.fileName === "string" && raw.fileName.trim() !== ""
        ? raw.fileName
        : "restored.csv",
    dir,
    columnKeys,
    headerLabels,
    columnKinds,
    rows,
    truncated: Boolean(raw.truncated),
    rowCountBeforeCap:
      typeof raw.rowCountBeforeCap === "number" && raw.rowCountBeforeCap >= 0
        ? raw.rowCountBeforeCap
        : rows.length,
    importedRowCount,
  };
}

/** Reorder data columns (not the grid select column) while keeping labels/kinds aligned. */
export function reorderCsvSessionColumnKeys(
  session: CsvViewerSession,
  newKeys: string[],
): CsvViewerSession {
  const { columnKeys, headerLabels, columnKinds } = session;
  if (newKeys.length !== columnKeys.length) return session;

  const keySet = new Set(columnKeys);
  if (!newKeys.every((k) => keySet.has(k))) return session;

  const labelByKey = new Map<string, string>();
  const kindByKey = new Map<string, CsvColumnKind>();
  for (let i = 0; i < columnKeys.length; i++) {
    const k = columnKeys[i]!;
    labelByKey.set(k, headerLabels[i] ?? k);
    kindByKey.set(k, columnKinds[i] ?? "short-text");
  }

  return {
    ...session,
    columnKeys: [...newKeys],
    headerLabels: newKeys.map((k) => labelByKey.get(k) ?? k),
    columnKinds: newKeys.map((k) => kindByKey.get(k) ?? "short-text"),
  };
}

export function mergeRowsIntoSession(
  session: CsvViewerSession,
  rows: CsvViewerRow[],
): CsvViewerSession {
  const missing = collectMissingKeys(session.columnKeys, rows);
  if (missing.length === 0) {
    return { ...session, rows };
  }
  return {
    ...session,
    columnKeys: [...session.columnKeys, ...missing],
    headerLabels: [...session.headerLabels, ...missing],
    columnKinds: [
      ...session.columnKinds,
      ...missing.map((): CsvColumnKind => "short-text"),
    ],
    rows,
    importedRowCount: session.importedRowCount,
  };
}

export function newCsvViewerColumnKey(): string {
  return `col_${generateId().replace(/-/g, "").slice(0, 12)}`;
}

/** Insert a new empty column at `index` (0-based among data columns). */
export function insertEmptyCsvSessionColumnAt(
  session: CsvViewerSession,
  index: number,
): CsvViewerSession {
  const safeIndex = Math.max(0, Math.min(index, session.columnKeys.length));
  const newKey = newCsvViewerColumnKey();

  const columnKeys = [...session.columnKeys];
  const headerLabels = [...session.headerLabels];
  const columnKinds = [...session.columnKinds];

  columnKeys.splice(safeIndex, 0, newKey);
  headerLabels.splice(safeIndex, 0, "");
  columnKinds.splice(safeIndex, 0, "short-text" satisfies CsvColumnKind);

  const rows = session.rows.map((row) => {
    const copy = { ...row, [newKey]: "" } as CsvViewerRow;
    return copy;
  });

  return { ...session, columnKeys, headerLabels, columnKinds, rows };
}

export interface InsertCsvSessionColumnDataParams {
  key: string;
  headerLabel: string;
  kind: CsvColumnKind;
  /** One string per row; shorter arrays are padded with "", longer arrays are trimmed. */
  cellValues: string[];
}

/** Insert a column with explicit key/label/kind and cell values at `index`. */
export function insertCsvSessionColumnWithDataAt(
  session: CsvViewerSession,
  index: number,
  params: InsertCsvSessionColumnDataParams,
): CsvViewerSession {
  const safeIndex = Math.max(0, Math.min(index, session.columnKeys.length));
  const { key, headerLabel, kind, cellValues } = params;

  const columnKeys = [...session.columnKeys];
  const headerLabels = [...session.headerLabels];
  const columnKinds = [...session.columnKinds];

  columnKeys.splice(safeIndex, 0, key);
  headerLabels.splice(safeIndex, 0, headerLabel);
  columnKinds.splice(safeIndex, 0, kind);

  const rows = session.rows.map((row, rowIndex) => {
    const copy = { ...row } as CsvViewerRow;
    copy[key] = cellValues[rowIndex] ?? "";
    return copy;
  });

  return { ...session, columnKeys, headerLabels, columnKinds, rows };
}

/** Remove a data column and its values from every row. Returns null if invalid or last column. */
export function removeCsvSessionColumn(
  session: CsvViewerSession,
  columnKey: string,
): CsvViewerSession | null {
  const ix = session.columnKeys.indexOf(columnKey);
  if (ix === -1) return null;
  if (session.columnKeys.length <= 1) return null;

  const columnKeys = session.columnKeys.filter((_, i) => i !== ix);
  const headerLabels = session.headerLabels.filter((_, i) => i !== ix);
  const columnKinds = session.columnKinds.filter((_, i) => i !== ix);

  const rows = session.rows.map((row) => {
    const copy = { ...row } as Record<string, unknown>;
    delete copy[columnKey];
    return copy as CsvViewerRow;
  });

  return { ...session, columnKeys, headerLabels, columnKinds, rows };
}

/** Set every cell in `columnKey` to an empty string. */
export function clearCsvSessionColumnValues(
  session: CsvViewerSession,
  columnKey: string,
): CsvViewerSession {
  if (!session.columnKeys.includes(columnKey)) return session;

  const rows = session.rows.map((row) => ({
    ...row,
    [columnKey]: "",
  }));

  return { ...session, rows };
}

/** Set `headerLabels[i]` for the given data column key. Returns null if the key is missing. */
export function renameCsvSessionColumnHeader(
  session: CsvViewerSession,
  columnKey: string,
  newHeaderLabel: string,
): CsvViewerSession | null {
  const ix = session.columnKeys.indexOf(columnKey);
  if (ix === -1) return null;
  const headerLabels = [...session.headerLabels];
  headerLabels[ix] = newHeaderLabel;
  return { ...session, headerLabels };
}

export function insertEmptyCsvSessionRowAt(
  session: CsvViewerSession,
  index: number,
): CsvViewerSession {
  const safeIndex = Math.max(0, Math.min(index, session.rows.length));
  const newRow = createEmptyCsvViewerRow(session.columnKeys);
  const rows = [...session.rows];
  rows.splice(safeIndex, 0, newRow);
  return { ...session, rows };
}

export function removeCsvSessionRowById(
  session: CsvViewerSession,
  rowId: string,
): CsvViewerSession | null {
  const ix = session.rows.findIndex((r) => r.id === rowId);
  if (ix === -1) return null;
  const rows = session.rows.filter((_, i) => i !== ix);
  return { ...session, rows };
}

/** Clear all data cells; keeps the same row `id`. */
export function clearCsvSessionRowCells(
  session: CsvViewerSession,
  rowId: string,
): CsvViewerSession | null {
  const ix = session.rows.findIndex((r) => r.id === rowId);
  if (ix === -1) return null;
  const cleared = createEmptyCsvViewerRow(session.columnKeys);
  const existing = session.rows[ix];
  if (existing) cleared.id = existing.id;
  const rows = [...session.rows];
  rows[ix] = cleared;
  return { ...session, rows };
}

export function insertCsvSessionRowsAfter(
  session: CsvViewerSession,
  afterRowId: string,
  newRows: CsvViewerRow[],
): CsvViewerSession | null {
  if (newRows.length === 0) return session;
  const ix = session.rows.findIndex((r) => r.id === afterRowId);
  if (ix === -1) return null;
  const rows = [...session.rows];
  rows.splice(ix + 1, 0, ...newRows);
  return { ...session, rows };
}
