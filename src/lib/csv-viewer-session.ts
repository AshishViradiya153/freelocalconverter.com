import {
  buildColumnDefsForCsv,
  type CsvColumnKind,
  type CsvImportResult,
  type CsvViewerRow,
} from "@/lib/csv-import";
import {
  createEmptyCsvViewerRow,
  getAccessorKeysFromColumnDefs,
} from "@/lib/csv-viewer";
import { removeCsvCellMergesForDeletedRowsOrColumns } from "@/lib/csv-cell-merges";
import { generateId } from "@/lib/id";
import type { Direction } from "@/types/data-grid";
import type { FileCellData } from "@/types/data-grid";

export interface CsvViewerSession {
  version: 2;
  fileName: string;
  dir: Direction;
  columnKeys: string[];
  headerLabels: string[];
  columnKinds: CsvColumnKind[];
  rows: CsvViewerRow[];
  cellMerges?: CsvCellMerge[];
  truncated: boolean;
  rowCountBeforeCap: number;
  importedRowCount: number;
}

export interface CsvCellMerge {
  id: string;
  startRowId: string;
  endRowId: string;
  startColumnId: string;
  endColumnId: string;
}

export function cloneCsvViewerSession(s: CsvViewerSession): CsvViewerSession {
  return {
    ...s,
    columnKeys: [...s.columnKeys],
    headerLabels: [...s.headerLabels],
    columnKinds: [...s.columnKinds],
    rows: s.rows.map((row) => ({ ...row })),
    cellMerges: s.cellMerges ? s.cellMerges.map((m) => ({ ...m })) : undefined,
  };
}

function columnKindFromDef(meta: unknown): CsvColumnKind {
  const v = (meta as { cell?: { variant?: string } } | undefined)?.cell
    ?.variant;
  if (v === "number" || v === "date") return v;
  if (v === "file") return "image";
  return "short-text";
}

function isFileCellDataArray(value: unknown): value is FileCellData[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        v &&
        typeof v === "object" &&
        typeof (v as FileCellData).id === "string" &&
        typeof (v as FileCellData).name === "string" &&
        typeof (v as FileCellData).size === "number" &&
        typeof (v as FileCellData).type === "string",
    )
  );
}

function fileNameFromUrl(url: string): string {
  const leaf = url.split("?")[0]?.split("#")[0]?.split("/").pop();
  return leaf && leaf.trim() ? leaf.trim() : "image";
}

function imageCellFromString(value: string): FileCellData[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  return [
    {
      id: generateId(),
      name: fileNameFromUrl(trimmed),
      size: 0,
      type: "image/*",
      url: trimmed,
    },
  ];
}

function stringFromImageCell(value: FileCellData[]): string {
  const first = value[0];
  if (!first) return "";
  return first.url ?? first.name ?? "";
}

export function resultToSession(
  fileName: string,
  result: CsvImportResult,
  dir: Direction = "ltr",
): CsvViewerSession {
  const columnKeys = getAccessorKeysFromColumnDefs(result.columns);
  const columnKinds = result.columns.map((c) => columnKindFromDef(c.meta));
  return {
    version: 2,
    fileName,
    dir,
    columnKeys,
    headerLabels: [...result.headerLabels],
    columnKinds,
    rows: result.rows.map((r) => ({ ...r })),
    cellMerges: [],
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
    k === "number" || k === "date" || k === "short-text" || k === "image";

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

  const rowIdSet = new Set(rows.map((r) => r.id));
  const columnKeySet = new Set(columnKeys);

  const cellMerges = Array.isArray(raw.cellMerges)
    ? raw.cellMerges
      .filter((m) => {
        if (!m || typeof m !== "object") return false;
        const mm = m as Partial<CsvCellMerge>;
        if (typeof mm.id !== "string" || mm.id.trim() === "") return false;
        if (
          typeof mm.startRowId !== "string" ||
          typeof mm.endRowId !== "string" ||
          typeof mm.startColumnId !== "string" ||
          typeof mm.endColumnId !== "string"
        )
          return false;
        if (!rowIdSet.has(mm.startRowId) || !rowIdSet.has(mm.endRowId))
          return false;
        if (!columnKeySet.has(mm.startColumnId) || !columnKeySet.has(mm.endColumnId))
          return false;
        if (mm.startColumnId === "select" || mm.endColumnId === "select")
          return false;
        if (mm.startRowId !== mm.endRowId) return false;
        return true;
      })
      .map((m) => m as CsvCellMerge)
    : [];

  const importedRowCount =
    typeof raw.importedRowCount === "number"
      ? raw.importedRowCount
      : rows.length;

  const dir: Direction = raw.dir === "rtl" ? "rtl" : "ltr";

  return {
    version: 2,
    fileName:
      typeof raw.fileName === "string" && raw.fileName.trim() !== ""
        ? raw.fileName
        : "restored.csv",
    dir,
    columnKeys,
    headerLabels,
    columnKinds,
    rows,
    cellMerges,
    truncated: Boolean(raw.truncated),
    rowCountBeforeCap:
      typeof raw.rowCountBeforeCap === "number" && raw.rowCountBeforeCap >= 0
        ? raw.rowCountBeforeCap
        : rows.length,
    importedRowCount,
  };
}

export function setCsvSessionColumnKind(
  session: CsvViewerSession,
  columnKey: string,
  kind: CsvColumnKind,
): CsvViewerSession | null {
  const ix = session.columnKeys.indexOf(columnKey);
  if (ix === -1) return null;

  const prevKind = session.columnKinds[ix] ?? "short-text";
  if (prevKind === kind) return session;

  const columnKinds = [...session.columnKinds];
  columnKinds[ix] = kind;

  // Keep cell shape aligned with the renderer:
  // - image uses FileCellData[] (maxFiles=1) so FileCell can render it
  // - other kinds use string/number/date-ish values
  const rows = session.rows.map((row) => {
    const raw = row[columnKey];

    if (kind === "image") {
      if (isFileCellDataArray(raw)) return row;
      if (typeof raw === "string") {
        return { ...row, [columnKey]: imageCellFromString(raw) };
      }
      if (raw === null || raw === undefined) {
        return { ...row, [columnKey]: [] };
      }
      return { ...row, [columnKey]: imageCellFromString(String(raw)) };
    }

    // Switching away from image -> store a stable string (URL preferred)
    if (isFileCellDataArray(raw)) {
      return { ...row, [columnKey]: stringFromImageCell(raw) };
    }

    return row;
  });

  return { ...session, columnKinds, rows };
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
    const k = columnKeys[i];
    if (k === undefined) {
      throw new Error(
        "reorderCsvSessionColumnKeys: columnKeys/header mismatch",
      );
    }
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

  const next = { ...session, columnKeys, headerLabels, columnKinds, rows };
  const validRowIds = new Set(next.rows.map((r) => r.id));
  const validColumnIds = new Set(next.columnKeys);
  return removeCsvCellMergesForDeletedRowsOrColumns({
    session: next,
    validRowIds,
    validColumnIds,
  });
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
  const next = { ...session, rows };
  const validRowIds = new Set(next.rows.map((r) => r.id));
  const validColumnIds = new Set(next.columnKeys);
  return removeCsvCellMergesForDeletedRowsOrColumns({
    session: next,
    validRowIds,
    validColumnIds,
  });
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
