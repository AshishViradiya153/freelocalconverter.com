import { generateId } from "@/lib/id";
import type { CsvCellMerge, CsvViewerSession } from "@/lib/csv-viewer-session";

export interface CsvCellMergeBounds {
  rowMin: number;
  rowMax: number;
  colMin: number;
  colMax: number;
}

function boundsFromMerge(params: {
  merge: CsvCellMerge;
  rowIndexById: Map<string, number>;
  colIndexById: Map<string, number>;
}): CsvCellMergeBounds | null {
  const { merge, rowIndexById, colIndexById } = params;
  const aRow = rowIndexById.get(merge.startRowId);
  const bRow = rowIndexById.get(merge.endRowId);
  const aCol = colIndexById.get(merge.startColumnId);
  const bCol = colIndexById.get(merge.endColumnId);
  if (
    aRow === undefined ||
    bRow === undefined ||
    aCol === undefined ||
    bCol === undefined
  ) {
    return null;
  }
  const rowMin = Math.min(aRow, bRow);
  const rowMax = Math.max(aRow, bRow);
  const colMin = Math.min(aCol, bCol);
  const colMax = Math.max(aCol, bCol);
  return { rowMin, rowMax, colMin, colMax };
}

export function getRowIndexByIdFromRowIds(rowIds: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < rowIds.length; i++) {
    const id = rowIds[i];
    if (id) m.set(id, i);
  }
  return m;
}

export function getColIndexByIdFromColumnKeys(
  columnKeys: string[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < columnKeys.length; i++) {
    const id = columnKeys[i];
    if (id) m.set(id, i);
  }
  return m;
}

export function mergesOverlap(a: CsvCellMergeBounds, b: CsvCellMergeBounds) {
  const rowOverlap = a.rowMin <= b.rowMax && b.rowMin <= a.rowMax;
  const colOverlap = a.colMin <= b.colMax && b.colMin <= a.colMax;
  return rowOverlap && colOverlap;
}

export function mergeContainsCell(
  bounds: CsvCellMergeBounds,
  cell: { rowIndex: number; colIndex: number },
): boolean {
  return (
    cell.rowIndex >= bounds.rowMin &&
    cell.rowIndex <= bounds.rowMax &&
    cell.colIndex >= bounds.colMin &&
    cell.colIndex <= bounds.colMax
  );
}

export function mergeIntersectsRect(
  bounds: CsvCellMergeBounds,
  rect: CsvCellMergeBounds,
): boolean {
  return mergesOverlap(bounds, rect);
}

export function makeCsvCellMerge(params: Omit<CsvCellMerge, "id">): CsvCellMerge {
  return { id: `merge_${generateId()}`, ...params };
}

export function tryAddCsvCellMerge(params: {
  session: CsvViewerSession;
  merge: CsvCellMerge;
  /** Pre-pagination order (after sort/filter), so merge behavior matches what the user sees. */
  orderedRowIds: string[];
}): { ok: true; session: CsvViewerSession } | { ok: false; reason: string } {
  const { session, merge, orderedRowIds } = params;
  const merges = session.cellMerges ?? [];

  if (merge.startRowId !== merge.endRowId) {
    return { ok: false, reason: "Only single-row (horizontal) merges are supported." };
  }

  if (merge.startColumnId === "select" || merge.endColumnId === "select") {
    return { ok: false, reason: "Cannot merge the selection column." };
  }
  if (!session.columnKeys.includes(merge.startColumnId)) {
    return { ok: false, reason: "Invalid start column." };
  }
  if (!session.columnKeys.includes(merge.endColumnId)) {
    return { ok: false, reason: "Invalid end column." };
  }

  const rowIndexById = getRowIndexByIdFromRowIds(orderedRowIds);
  const colIndexById = getColIndexByIdFromColumnKeys(session.columnKeys);

  const nextBounds = boundsFromMerge({ merge, rowIndexById, colIndexById });
  if (!nextBounds) return { ok: false, reason: "Invalid merge range." };

  const rowSpan = nextBounds.rowMax - nextBounds.rowMin + 1;
  const colSpan = nextBounds.colMax - nextBounds.colMin + 1;
  if (rowSpan !== 1) {
    return { ok: false, reason: "Only single-row (horizontal) merges are supported." };
  }
  if (rowSpan * colSpan <= 1) {
    return { ok: false, reason: "Select at least 2 cells to merge." };
  }

  for (const existing of merges) {
    const existingBounds = boundsFromMerge({
      merge: existing,
      rowIndexById,
      colIndexById,
    });
    if (!existingBounds) continue;
    if (mergesOverlap(existingBounds, nextBounds)) {
      return { ok: false, reason: "Selection overlaps an existing merge." };
    }
  }

  return {
    ok: true,
    session: {
      ...session,
      cellMerges: [...merges, merge],
    },
  };
}

export function mergeCsvCellsAnyway(params: {
  session: CsvViewerSession;
  merge: CsvCellMerge;
  orderedRowIds: string[];
}): { ok: true; session: CsvViewerSession } | { ok: false; reason: string } {
  const { session, merge, orderedRowIds } = params;
  const withoutIntersecting = removeCsvCellMergesIntersectingRect({
    session,
    rect: {
      startRowId: merge.startRowId,
      endRowId: merge.endRowId,
      startColumnId: merge.startColumnId,
      endColumnId: merge.endColumnId,
    },
    orderedRowIds,
  });
  return tryAddCsvCellMerge({ session: withoutIntersecting, merge, orderedRowIds });
}

export function removeCsvCellMergesIntersectingRect(params: {
  session: CsvViewerSession;
  rect: Omit<CsvCellMerge, "id">;
  orderedRowIds: string[];
}): CsvViewerSession {
  const { session, rect, orderedRowIds } = params;
  const merges = session.cellMerges ?? [];
  if (merges.length === 0) return session;

  const rowIndexById = getRowIndexByIdFromRowIds(orderedRowIds);
  const colIndexById = getColIndexByIdFromColumnKeys(session.columnKeys);

  const rectBounds = boundsFromMerge({
    merge: { id: "rect", ...rect },
    rowIndexById,
    colIndexById,
  });
  if (!rectBounds) return session;

  const next = merges.filter((m) => {
    const b = boundsFromMerge({ merge: m, rowIndexById, colIndexById });
    if (!b) return false;
    return !mergeIntersectsRect(b, rectBounds);
  });

  return { ...session, cellMerges: next };
}

export function removeCsvCellMergesForDeletedRowsOrColumns(params: {
  session: CsvViewerSession;
  validRowIds: Set<string>;
  validColumnIds: Set<string>;
}): CsvViewerSession {
  const { session, validRowIds, validColumnIds } = params;
  const merges = session.cellMerges ?? [];
  if (merges.length === 0) return session;

  const next = merges.filter((m) => {
    return (
      validRowIds.has(m.startRowId) &&
      validRowIds.has(m.endRowId) &&
      validColumnIds.has(m.startColumnId) &&
      validColumnIds.has(m.endColumnId)
    );
  });

  return next.length === merges.length ? session : { ...session, cellMerges: next };
}

