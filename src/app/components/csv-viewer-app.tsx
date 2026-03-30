"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import type {
  ColumnDef,
  ColumnOrderState,
  PaginationState,
  Table,
  Updater,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Download,
  Languages,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import {
  DataGridPagination,
  DEFAULT_DATA_GRID_PAGE_SIZE,
} from "@/components/data-grid/data-grid-pagination";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
import { DataGridRowSelectionActionBar } from "@/components/data-grid/data-grid-row-selection-action-bar";
import { DataGridSearchButton } from "@/components/data-grid/data-grid-search";
import { getDataGridSelectColumn } from "@/components/data-grid/data-grid-select-column";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridUndoRedoButtons } from "@/components/data-grid/data-grid-undo-redo-buttons";
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { FileSpreadsheetGlyph } from "@/components/file-glyphs";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { useAsRef } from "@/hooks/use-as-ref";
import { type UseDataGridProps, useDataGrid } from "@/hooks/use-data-grid";
import {
  type UndoRedoCellUpdate,
  useDataGridUndoRedo,
} from "@/hooks/use-data-grid-undo-redo";
import { useWindowSize } from "@/hooks/use-window-size";
import {
  makeCsvCellMerge,
  mergeCsvCellsAnyway,
  removeCsvCellMergesIntersectingRect,
} from "@/lib/csv-cell-merges";
import {
  applyColumnPasteToSession,
  buildColumnClipboardPayload,
  type ColumnClipboardPayload,
  columnClipboardToTsv,
} from "@/lib/csv-column-ops";
import {
  downloadCsvExport,
  downloadJsonExport,
  downloadPdfExport,
  downloadXlsxExport,
  downloadXmlExport,
} from "@/lib/csv-export";
import {
  buildColumnDefsForCsv,
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  type CsvImportResult,
  type CsvParseDialect,
  type CsvViewerRow,
  parseCsvFile,
  parseCsvText,
} from "@/lib/csv-import";
import {
  buildCsvRowClipboardTsv,
  csvViewerRowsFromClipboardTsv,
} from "@/lib/csv-row-ops";
import { createEmptyCsvViewerRow } from "@/lib/csv-viewer";
import {
  clearCsvViewerSession,
  csvViewerPersistDebounceMs,
  CSV_VIEWER_WINDOWED_INITIAL_PAGE_SIZE,
  loadCsvViewerSession,
  mergeAllCsvViewerIdbRowsWithDirty,
  readCsvViewerIdbRowWindow,
  saveCsvViewerSession,
} from "@/lib/csv-viewer-idb";
import {
  type CsvViewerSession,
  cloneCsvViewerSession,
  insertCsvSessionRowsAfter,
  insertEmptyCsvSessionColumnAt,
  insertEmptyCsvSessionRowAt,
  mergeRowsIntoSession,
  newCsvViewerColumnKey,
  removeCsvSessionColumn,
  removeCsvSessionRowById,
  renameCsvSessionColumnHeader,
  reorderCsvSessionColumnKeys,
  resultToSession,
  setCsvSessionColumnKind,
} from "@/lib/csv-viewer-session";
import {
  getInMemoryCsvViewerSession,
  setInMemoryCsvViewerSession,
} from "@/lib/csv-viewer-session-memory";
import { getRowHeightValue } from "@/lib/data-grid";
import type { Direction } from "@/types/data-grid";
import { SAMPLE_CSV_FILENAME, SAMPLE_CSV_PATH } from "../lib/sample-csv";

const CSV_VIEWER_DIALECT_STORAGE_KEY = "csv-viewer-import-dialect-v1";

type CsvImportDelimiterChoice = "auto" | "comma" | "semicolon" | "tab" | "pipe";

type CsvImportHeaderMode = "header" | "noHeader";

interface CsvImportDialectStorage {
  delimiterChoice: CsvImportDelimiterChoice;
  headerMode: CsvImportHeaderMode;
}

function csvParseDialectFromUi(
  delimiterChoice: CsvImportDelimiterChoice,
  headerMode: CsvImportHeaderMode,
): CsvParseDialect {
  const delimiter: CsvParseDialect["delimiter"] =
    delimiterChoice === "auto"
      ? ""
      : delimiterChoice === "comma"
        ? ","
        : delimiterChoice === "semicolon"
          ? ";"
          : delimiterChoice === "tab"
            ? "\t"
            : "|";
  return {
    delimiter,
    hasHeaderRow: headerMode === "header",
  };
}

interface CsvGridPanelProps {
  session: CsvViewerSession;
  patchSession: (fn: (s: CsvViewerSession) => CsvViewerSession) => void;
  onClear: () => void | Promise<void>;
  windowedDirtyRef: React.MutableRefObject<Map<number, CsvViewerRow>>;
}

export function CsvGridPanel({
  session,
  patchSession,
  onClear,
  windowedDirtyRef,
}: CsvGridPanelProps) {
  const tc = useTranslations("csv");
  const tCommon = useTranslations("common");
  const csvGridTableRef = React.useRef<Table<CsvViewerRow> | null>(null);
  const sessionRef = useAsRef(session);
  const windowSize = useWindowSize({ defaultHeight: 760 });
  const height = Math.max(400, windowSize.height - 220);
  const dir: Direction = session.dir === "rtl" ? "rtl" : "ltr";

  /** Resolvers for toast.promise: fired after layout once new column keys are committed (headers + body). */
  const columnReorderLayoutResolversRef = React.useRef<(() => void)[]>([]);

  React.useLayoutEffect(() => {
    const pending = columnReorderLayoutResolversRef.current;
    if (pending.length === 0) return;
    columnReorderLayoutResolversRef.current = [];
    for (const resolve of pending) {
      resolve();
    }
  }, []);

  const dataColumns = React.useMemo(
    () =>
      buildColumnDefsForCsv(
        session.columnKeys,
        session.headerLabels,
        session.columnKinds.length === session.columnKeys.length
          ? session.columnKinds
          : session.columnKeys.map(
              (_, i) => session.columnKinds[i] ?? "short-text",
            ),
      ),
    [session.columnKeys, session.headerLabels, session.columnKinds],
  );

  const columnsWithSelect = React.useMemo<ColumnDef<CsvViewerRow>[]>(
    () => [
      getDataGridSelectColumn<CsvViewerRow>({
        enableRowMarkers: true,
      }),
      ...dataColumns,
    ],
    [dataColumns],
  );

  const columnKeys = session.columnKeys;
  const firstDataColumnId = columnKeys[0] ?? "id";
  const data = session.rows;
  const isWindowed =
    typeof session.windowedTotalRows === "number" &&
    session.windowedTotalRows > 0;

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: isWindowed
      ? CSV_VIEWER_WINDOWED_INITIAL_PAGE_SIZE
      : DEFAULT_DATA_GRID_PAGE_SIZE,
  });

  const windowedMountRef = React.useRef(false);
  const windowedLastPageKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    windowedMountRef.current = false;
    windowedLastPageKeyRef.current = null;
  }, [session.fileName, session.importedRowCount, session.windowedTotalRows]);

  const onPaginationChange = React.useCallback(
    (updater: Updater<PaginationState>) => {
      setPagination((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const toastWindowedStructureBlocked = React.useCallback(() => {
    toast.message(
      "Large restored sheet: add/remove rows or columns isn’t available in page view. Edit cells or export the full file.",
    );
  }, []);

  const replaceRows = React.useCallback(
    (newRows: CsvViewerRow[]) => {
      if (isWindowed) {
        const base = pagination.pageIndex * pagination.pageSize;
        newRows.forEach((row, i) => {
          windowedDirtyRef.current.set(base + i, { ...row });
        });
      }
      patchSession((s) => mergeRowsIntoSession(s, newRows));
    },
    [
      isWindowed,
      pagination.pageIndex,
      pagination.pageSize,
      patchSession,
      windowedDirtyRef,
    ],
  );

  React.useEffect(() => {
    if (!isWindowed) return;
    const key = `${pagination.pageIndex}-${pagination.pageSize}`;
    if (!windowedMountRef.current) {
      windowedMountRef.current = true;
      windowedLastPageKeyRef.current = key;
      return;
    }
    if (windowedLastPageKeyRef.current === key) return;

    const prevKey = windowedLastPageKeyRef.current;
    windowedLastPageKeyRef.current = key;

    let cancelled = false;
    void (async () => {
      if (prevKey) {
        const [prevPi, prevPs] = prevKey.split("-").map(Number);
        const prevStart = (prevPi ?? 0) * (prevPs ?? 1);
        const prevRows = sessionRef.current.rows;
        for (let i = 0; i < prevRows.length; i++) {
          const row = prevRows[i];
          if (row) windowedDirtyRef.current.set(prevStart + i, { ...row });
        }
      }

      const { pageIndex, pageSize } = pagination;
      const start = pageIndex * pageSize;
      const total = sessionRef.current.windowedTotalRows ?? 0;
      const end = Math.min(start + pageSize, total);
      const slice = await readCsvViewerIdbRowWindow(
        sessionRef.current,
        start,
        end,
        windowedDirtyRef.current,
      );
      if (cancelled || slice == null) return;
      patchSession((s) => ({ ...s, rows: slice }));
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isWindowed,
    pagination.pageIndex,
    pagination.pageSize,
    patchSession,
    windowedDirtyRef,
  ]);

  const {
    trackCellsUpdate,
    trackRowsAdd,
    trackRowsDelete,
    trackRowReorder,
    trackColumnReorder,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
  } = useDataGridUndoRedo({
    data,
    onDataChange: replaceRows,
    getRowId: (row) => row.id,
  });

  const onRowAdd: NonNullable<UseDataGridProps<CsvViewerRow>["onRowAdd"]> =
    React.useCallback(() => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return null;
      }
      const newRow = createEmptyCsvViewerRow(columnKeys);
      const newRowIndex = data.length;
      replaceRows([...data, newRow]);
      trackRowsAdd([newRow]);
      return {
        rowIndex: newRowIndex,
        columnId: firstDataColumnId,
      };
    }, [
      columnKeys,
      data,
      firstDataColumnId,
      isWindowed,
      replaceRows,
      toastWindowedStructureBlocked,
      trackRowsAdd,
    ]);

  const onRowsAdd: NonNullable<UseDataGridProps<CsvViewerRow>["onRowsAdd"]> =
    React.useCallback(
      (count: number) => {
        if (isWindowed) {
          toastWindowedStructureBlocked();
          return;
        }
        const newRows = Array.from({ length: count }, () =>
          createEmptyCsvViewerRow(columnKeys),
        );
        replaceRows([...data, ...newRows]);
        trackRowsAdd(newRows);
      },
      [
        columnKeys,
        data,
        isWindowed,
        replaceRows,
        toastWindowedStructureBlocked,
        trackRowsAdd,
      ],
    );

  const onRowsDelete: NonNullable<
    UseDataGridProps<CsvViewerRow>["onRowsDelete"]
  > = React.useCallback(
    (rows) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      trackRowsDelete(rows);
      replaceRows(data.filter((row) => !rows.includes(row)));
    },
    [
      data,
      isWindowed,
      replaceRows,
      toastWindowedStructureBlocked,
      trackRowsDelete,
    ],
  );

  const onDataChange = React.useCallback(
    (newData: CsvViewerRow[]) => {
      const cellUpdates: Array<UndoRedoCellUpdate> = [];
      const maxLength = Math.max(data.length, newData.length);
      for (let rowIndex = 0; rowIndex < maxLength; rowIndex++) {
        const oldRow = data[rowIndex];
        const newRow = newData[rowIndex];
        if (oldRow && newRow) {
          const allKeys = new Set([
            ...Object.keys(oldRow),
            ...Object.keys(newRow),
          ]);
          for (const key of allKeys) {
            const oldValue = (oldRow as Record<string, unknown>)[key];
            const newValue = (newRow as Record<string, unknown>)[key];
            if (!Object.is(oldValue, newValue)) {
              cellUpdates.push({
                rowId: oldRow.id,
                columnId: key,
                previousValue: oldValue,
                newValue,
              });
            }
          }
        }
      }
      if (cellUpdates.length > 0) {
        trackCellsUpdate(cellUpdates);
      }
      replaceRows(newData);
    },
    [data, replaceRows, trackCellsUpdate],
  );

  const columnClipRef = React.useRef<ColumnClipboardPayload | null>(null);
  const rowClipRef = React.useRef<string | null>(null);

  const onColumnInsertBefore = React.useCallback(
    (columnId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      const ix = session.columnKeys.indexOf(columnId);
      if (ix < 0) return;
      const prev = cloneCsvViewerSession(session);
      const next = insertEmptyCsvSessionColumnAt(session, ix);
      const nextSnap = cloneCsvViewerSession(next);
      patchSession(() => next);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastColumnAdded"));
    },
    [isWindowed, session, patchSession, toastWindowedStructureBlocked, trackColumnReorder, tc],
  );

  const onColumnInsertAfter = React.useCallback(
    (columnId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      const ix = session.columnKeys.indexOf(columnId);
      if (ix < 0) return;
      const prev = cloneCsvViewerSession(session);
      const next = insertEmptyCsvSessionColumnAt(session, ix + 1);
      const nextSnap = cloneCsvViewerSession(next);
      patchSession(() => next);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastColumnAdded"));
    },
    [isWindowed, session, patchSession, toastWindowedStructureBlocked, trackColumnReorder, tc],
  );

  const onColumnCopy = React.useCallback(
    async (columnId: string) => {
      const payload = buildColumnClipboardPayload(session, columnId);
      if (!payload) return;
      columnClipRef.current = payload;
      const text = columnClipboardToTsv(payload);
      try {
        await navigator.clipboard.writeText(text);
        toast.success(tc("toastColumnCopied"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tc("toastColumnCopyFailed"),
        );
      }
    },
    [session, tc],
  );

  const onColumnCut = React.useCallback(
    async (columnId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      if (session.columnKeys.length <= 1) {
        toast.error(tc("needOneColumn"));
        return;
      }
      const payload = buildColumnClipboardPayload(session, columnId);
      if (!payload) return;
      columnClipRef.current = payload;
      try {
        await navigator.clipboard.writeText(columnClipboardToTsv(payload));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tc("toastColumnCutFailed"),
        );
        return;
      }
      const prev = cloneCsvViewerSession(session);
      const removed = removeCsvSessionColumn(session, columnId);
      if (!removed) {
        toast.error(tc("toastCouldNotRemoveColumn"));
        return;
      }
      const nextSnap = cloneCsvViewerSession(removed);
      patchSession(() => removed);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastColumnCut"));
    },
    [isWindowed, session, patchSession, toastWindowedStructureBlocked, trackColumnReorder, tc],
  );

  const onColumnPaste = React.useCallback(
    async (columnId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      let text: string;
      try {
        text = await navigator.clipboard.readText();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : tc("toastClipboardReadFailed"),
        );
        return;
      }

      const newKey = newCsvViewerColumnKey();
      const next = applyColumnPasteToSession(session, {
        afterColumnId: columnId,
        newColumnKey: newKey,
        clipboardText: text,
        internal: columnClipRef.current,
      });
      if (!next) {
        toast.error(tc("toastNothingToPaste"));
        return;
      }

      const prev = cloneCsvViewerSession(session);
      const nextSnap = cloneCsvViewerSession(next);
      patchSession(() => next);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastColumnPasted"));
    },
    [isWindowed, session, patchSession, toastWindowedStructureBlocked, trackColumnReorder, tc],
  );

  const onColumnClearAll = React.useCallback(
    (columnId: string) => {
      if (!session.columnKeys.includes(columnId)) return;
      onDataChange(data.map((row) => ({ ...row, [columnId]: "" })));
      toast.success(tc("toastColumnCleared"));
    },
    [session.columnKeys, data, onDataChange, tc],
  );

  const onColumnDelete = React.useCallback(
    (columnId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      if (session.columnKeys.length <= 1) {
        toast.error(tc("needOneColumn"));
        return;
      }
      const prev = cloneCsvViewerSession(session);
      const removed = removeCsvSessionColumn(session, columnId);
      if (!removed) return;
      const nextSnap = cloneCsvViewerSession(removed);
      patchSession(() => removed);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastColumnDeleted"));
    },
    [isWindowed, session, patchSession, toastWindowedStructureBlocked, trackColumnReorder, tc],
  );

  const onColumnRename = React.useCallback(
    (columnId: string, newHeaderLabel: string) => {
      const ix = session.columnKeys.indexOf(columnId);
      if (ix < 0) return;
      if (session.headerLabels[ix] === newHeaderLabel) return;

      const prev = cloneCsvViewerSession(session);
      const next = renameCsvSessionColumnHeader(
        session,
        columnId,
        newHeaderLabel,
      );
      if (!next) return;
      const nextSnap = cloneCsvViewerSession(next);
      patchSession(() => next);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastColumnRenamed"));
    },
    [session, patchSession, trackColumnReorder, tc],
  );

  const onColumnKindChange = React.useCallback(
    (columnId: string, kind: string) => {
      const prev = cloneCsvViewerSession(session);
      const next = setCsvSessionColumnKind(session, columnId, kind as never);
      if (!next) return;
      const nextSnap = cloneCsvViewerSession(next);
      patchSession(() => next);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success("Column updated");
    },
    [session, patchSession, trackColumnReorder, tc],
  );

  const onRowInsertBefore = React.useCallback(
    (rowId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      const ix = data.findIndex((r) => r.id === rowId);
      if (ix < 0) return;
      const prev = cloneCsvViewerSession(session);
      const next = insertEmptyCsvSessionRowAt(session, ix);
      const nextSnap = cloneCsvViewerSession(next);
      patchSession(() => next);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastRowAdded"));
    },
    [data, isWindowed, session, patchSession, toastWindowedStructureBlocked, trackColumnReorder, tc],
  );

  const onRowInsertAfter = React.useCallback(
    (rowId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      const ix = data.findIndex((r) => r.id === rowId);
      if (ix < 0) return;
      const prev = cloneCsvViewerSession(session);
      const next = insertEmptyCsvSessionRowAt(session, ix + 1);
      const nextSnap = cloneCsvViewerSession(next);
      patchSession(() => next);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastRowAdded"));
    },
    [data, isWindowed, session, patchSession, toastWindowedStructureBlocked, trackColumnReorder, tc],
  );

  const onRowCopy = React.useCallback(
    async (rowId: string) => {
      const row = data.find((r) => r.id === rowId);
      if (!row) return;
      const tsv = buildCsvRowClipboardTsv(row, columnKeys);
      rowClipRef.current = tsv;
      try {
        await navigator.clipboard.writeText(tsv);
        toast.success(tc("toastRowCopied"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tc("toastRowCopyFailed"),
        );
      }
    },
    [data, columnKeys, tc],
  );

  const onRowCut = React.useCallback(
    async (rowId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      const row = data.find((r) => r.id === rowId);
      if (!row) return;
      const tsv = buildCsvRowClipboardTsv(row, columnKeys);
      rowClipRef.current = tsv;
      try {
        await navigator.clipboard.writeText(tsv);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tc("toastRowCutFailed"),
        );
        return;
      }
      const prev = cloneCsvViewerSession(session);
      const removed = removeCsvSessionRowById(session, rowId);
      if (!removed) {
        toast.error(tc("toastCouldNotRemoveRow"));
        return;
      }
      const nextSnap = cloneCsvViewerSession(removed);
      patchSession(() => removed);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastRowCut"));
    },
    [
      data,
      isWindowed,
      session,
      columnKeys,
      patchSession,
      toastWindowedStructureBlocked,
      trackColumnReorder,
      tc,
    ],
  );

  const onRowPaste = React.useCallback(
    async (rowId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      let text: string;
      try {
        text = await navigator.clipboard.readText();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : tc("toastClipboardReadFailed"),
        );
        return;
      }

      const newRows = csvViewerRowsFromClipboardTsv(text, columnKeys);
      if (newRows.length === 0) {
        toast.error(tc("toastNothingToPaste"));
        return;
      }

      const prev = cloneCsvViewerSession(session);
      const next = insertCsvSessionRowsAfter(session, rowId, newRows);
      if (!next) {
        toast.error(tc("toastPasteRowsFailed"));
        return;
      }
      const nextSnap = cloneCsvViewerSession(next);
      patchSession(() => next);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(
        newRows.length === 1
          ? tc("toastRowPasted")
          : tc("toastRowsPasted", { count: newRows.length }),
      );
    },
    [
      isWindowed,
      session,
      columnKeys,
      patchSession,
      toastWindowedStructureBlocked,
      trackColumnReorder,
      tc,
    ],
  );

  const onRowClearAll = React.useCallback(
    (rowId: string) => {
      const row = data.find((r) => r.id === rowId);
      if (!row) return;
      const cleared = createEmptyCsvViewerRow(columnKeys);
      cleared.id = row.id;
      onDataChange(data.map((r) => (r.id === rowId ? cleared : r)));
      toast.success(tc("toastRowCleared"));
    },
    [data, columnKeys, onDataChange, tc],
  );

  const onRowDelete = React.useCallback(
    (rowId: string) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      const prev = cloneCsvViewerSession(session);
      const removed = removeCsvSessionRowById(session, rowId);
      if (!removed) return;
      const nextSnap = cloneCsvViewerSession(removed);
      patchSession(() => removed);
      trackColumnReorder({
        undo: () => patchSession(() => cloneCsvViewerSession(prev)),
        redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
      });
      toast.success(tc("toastRowDeleted"));
    },
    [isWindowed, session, patchSession, toastWindowedStructureBlocked, trackColumnReorder, tc],
  );

  const csvGridTableMeta = React.useMemo(
    () => ({
      onColumnInsertBefore,
      onColumnInsertAfter,
      onColumnCopy,
      onColumnCut,
      onColumnPaste,
      onColumnClearAll,
      onColumnDelete,
      onColumnRename,
      getColumnKind: (columnId: string) => {
        const ix = session.columnKeys.indexOf(columnId);
        if (ix < 0) return null;
        return session.columnKinds[ix] ?? "short-text";
      },
      getColumnKindOptions: () => [
        { value: "short-text", label: "Text" },
        { value: "number", label: "Number" },
        { value: "date", label: "Date" },
        { value: "image", label: "Image" },
      ],
      onColumnKindChange,
      onRowInsertBefore,
      onRowInsertAfter,
      onRowCopy,
      onRowCut,
      onRowPaste,
      onRowClearAll,
      onRowDelete,
      onSelectedRowsCopy: async () => {
        const t = csvGridTableRef.current;
        if (!t) return;
        const originals = t
          .getSelectedRowModel()
          .flatRows.map((r) => r.original);
        if (originals.length === 0) return;
        const body = originals
          .map((r) => buildCsvRowClipboardTsv(r, columnKeys))
          .join("\n");
        rowClipRef.current = body;
        try {
          await navigator.clipboard.writeText(body);
          toast.success(
            originals.length === 1
              ? tc("toastRowCopied")
              : tc("toastRowsCopied", { count: originals.length }),
          );
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : tc("toastRowsCopyFailed"),
          );
        }
      },
      onSelectedRowsCut: async () => {
        if (isWindowed) {
          toastWindowedStructureBlocked();
          return;
        }
        const t = csvGridTableRef.current;
        if (!t) return;
        const originals = t
          .getSelectedRowModel()
          .flatRows.map((r) => r.original);
        if (originals.length === 0) return;
        const body = originals
          .map((r) => buildCsvRowClipboardTsv(r, columnKeys))
          .join("\n");
        rowClipRef.current = body;
        try {
          await navigator.clipboard.writeText(body);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : tc("toastRowsCutFailed"),
          );
          return;
        }
        const idSet = new Set(originals.map((r) => r.id));
        const prev = cloneCsvViewerSession(session);
        const nextRows = session.rows.filter((r) => !idSet.has(r.id));
        const nextSession = { ...session, rows: nextRows };
        const nextSnap = cloneCsvViewerSession(nextSession);
        patchSession(() => nextSession);
        trackColumnReorder({
          undo: () => patchSession(() => cloneCsvViewerSession(prev)),
          redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
        });
        toast.success(
          originals.length === 1
            ? tc("toastRowCut")
            : tc("toastRowsCut", { count: originals.length }),
        );
        t.toggleAllRowsSelected(false);
        t.options.meta?.onSelectionClear?.();
      },
      onSelectedRowsClearAll: () => {
        const t = csvGridTableRef.current;
        if (!t) return;
        const idSet = new Set(
          t.getSelectedRowModel().flatRows.map((r) => r.id),
        );
        if (idSet.size === 0) return;
        const next = data.map((r) => {
          if (!idSet.has(r.id)) return r;
          const cleared = createEmptyCsvViewerRow(columnKeys);
          cleared.id = r.id;
          return cleared;
        });
        onDataChange(next);
        toast.success(
          idSet.size === 1
            ? tc("toastRowCleared")
            : tc("toastRowsCleared", { count: idSet.size }),
        );
        t.toggleAllRowsSelected(false);
        t.options.meta?.onSelectionClear?.();
      },
      onSelectedRowsDelete: () => {
        if (isWindowed) {
          toastWindowedStructureBlocked();
          return;
        }
        const t = csvGridTableRef.current;
        if (!t) return;
        const idSet = new Set(
          t.getSelectedRowModel().flatRows.map((r) => r.id),
        );
        if (idSet.size === 0) return;
        const prev = cloneCsvViewerSession(session);
        const nextRows = session.rows.filter((r) => !idSet.has(r.id));
        const nextSession = { ...session, rows: nextRows };
        const nextSnap = cloneCsvViewerSession(nextSession);
        patchSession(() => nextSession);
        trackColumnReorder({
          undo: () => patchSession(() => cloneCsvViewerSession(prev)),
          redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
        });
        toast.success(
          idSet.size === 1
            ? tc("toastRowDeleted")
            : tc("toastRowsDeleted", { count: idSet.size }),
        );
        t.toggleAllRowsSelected(false);
        t.options.meta?.onSelectionClear?.();
      },
      onCellsMerge: () => {
        if (isWindowed) {
          toastWindowedStructureBlocked();
          return;
        }
        const t = csvGridTableRef.current;
        if (!t) return;
        const s = sessionRef.current;
        const range = t.options.meta?.selectionState?.selectionRange ?? null;
        if (!range) return;
        const startRow = Math.min(range.start.rowIndex, range.end.rowIndex);
        const endRow = Math.max(range.start.rowIndex, range.end.rowIndex);
        if (startRow !== endRow) {
          toast.error("Only single-row (horizontal) merges are supported.");
          return;
        }
        const startColId = range.start.columnId;
        const endColId = range.end.columnId;
        if (startColId === "select" || endColId === "select") {
          toast.error("Cannot merge the selection column.");
          return;
        }
        const startCol = session.columnKeys.indexOf(startColId);
        const endCol = session.columnKeys.indexOf(endColId);
        if (startCol < 0 || endCol < 0) {
          toast.error("Cannot merge these cells.");
          return;
        }
        const pageRows = t.getRowModel().rows;
        const startRowObj = pageRows[startRow];
        const endRowObj = pageRows[endRow];
        if (!startRowObj || !endRowObj) return;

        const orderedRowIds = t
          .getPrePaginationRowModel()
          .rows.map((r) => String(r.id));

        const merge = makeCsvCellMerge({
          startRowId: String(startRowObj.id),
          endRowId: String(endRowObj.id),
          startColumnId: s.columnKeys[Math.min(startCol, endCol)] ?? "",
          endColumnId: s.columnKeys[Math.max(startCol, endCol)] ?? "",
        });

        const prev = cloneCsvViewerSession(s);
        const attempt = mergeCsvCellsAnyway({
          session: s,
          merge,
          orderedRowIds,
        });
        if (!attempt.ok) {
          toast.error(attempt.reason);
          return;
        }
        const nextSnap = cloneCsvViewerSession(attempt.session);
        patchSession(() => attempt.session);
        trackColumnReorder({
          undo: () => patchSession(() => cloneCsvViewerSession(prev)),
          redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
        });
        toast.success("Cells merged");
      },
      onCellsUnmerge: () => {
        if (isWindowed) {
          toastWindowedStructureBlocked();
          return;
        }
        const t = csvGridTableRef.current;
        if (!t) return;
        const s = sessionRef.current;
        const range = t.options.meta?.selectionState?.selectionRange ?? null;
        if (!range) return;
        const startRow = Math.min(range.start.rowIndex, range.end.rowIndex);
        const endRow = Math.max(range.start.rowIndex, range.end.rowIndex);
        if (startRow !== endRow) {
          toast.error("Only single-row (horizontal) unmerge is supported.");
          return;
        }
        const startColId = range.start.columnId;
        const endColId = range.end.columnId;
        if (startColId === "select" || endColId === "select") return;
        const startCol = session.columnKeys.indexOf(startColId);
        const endCol = session.columnKeys.indexOf(endColId);
        if (startCol < 0 || endCol < 0) return;

        const pageRows = t.getRowModel().rows;
        const startRowObj = pageRows[startRow];
        const endRowObj = pageRows[endRow];
        if (!startRowObj || !endRowObj) return;

        const orderedRowIds = t
          .getPrePaginationRowModel()
          .rows.map((r) => String(r.id));

        const rect = {
          startRowId: String(startRowObj.id),
          endRowId: String(endRowObj.id),
          startColumnId: s.columnKeys[Math.min(startCol, endCol)] ?? "",
          endColumnId: s.columnKeys[Math.max(startCol, endCol)] ?? "",
        };

        const prev = cloneCsvViewerSession(s);
        const next = removeCsvCellMergesIntersectingRect({
          session: s,
          rect,
          orderedRowIds,
        });
        if ((next.cellMerges?.length ?? 0) === (s.cellMerges?.length ?? 0))
          return;
        const nextSnap = cloneCsvViewerSession(next);
        patchSession(() => next);
        trackColumnReorder({
          undo: () => patchSession(() => cloneCsvViewerSession(prev)),
          redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
        });
        toast.success("Cells unmerged");
      },
      getCellMergeState: (
        rowIndex: number,
        columnId: string,
      ): import("@/types/data-grid").DataGridCellMergeState | null => {
        if (columnId === "select") return null;
        const t = csvGridTableRef.current;
        if (!t) return null;
        const s = sessionRef.current;
        const merges = s.cellMerges ?? [];
        if (merges.length === 0) return null;

        const pageRows = t.getRowModel().rows;
        const row = pageRows[rowIndex];
        if (!row) return null;

        const preRows = t.getPrePaginationRowModel().rows;
        const preIndexById = new Map<string, number>();
        for (let i = 0; i < preRows.length; i++) {
          preIndexById.set(String(preRows[i]?.id), i);
        }

        const rowId = String(row.id);
        const cellPreRowIndex = preIndexById.get(rowId);
        if (cellPreRowIndex === undefined) return null;
        const colIndex = s.columnKeys.indexOf(columnId);
        if (colIndex < 0) return null;

        for (const m of merges) {
          const aRow = preIndexById.get(m.startRowId);
          const bRow = preIndexById.get(m.endRowId);
          const aCol = s.columnKeys.indexOf(m.startColumnId);
          const bCol = s.columnKeys.indexOf(m.endColumnId);
          if (aRow === undefined || bRow === undefined || aCol < 0 || bCol < 0)
            continue;
          const rowMin = Math.min(aRow, bRow);
          const rowMax = Math.max(aRow, bRow);
          const colMin = Math.min(aCol, bCol);
          const colMax = Math.max(aCol, bCol);

          const inRows = cellPreRowIndex >= rowMin && cellPreRowIndex <= rowMax;
          const inCols = colIndex >= colMin && colIndex <= colMax;
          if (!inRows || !inCols) continue;

          const anchorRowId = String(preRows[rowMin]?.id);
          const anchorColumnId = s.columnKeys[colMin] ?? "";
          if (!anchorRowId || !anchorColumnId) continue;

          const anchorRowIndexInPage = pageRows.findIndex(
            (r) => String(r.id) === anchorRowId,
          );
          if (anchorRowIndexInPage === -1) {
            // Avoid hiding cells on pages where the anchor isn't visible.
            return null;
          }

          const rowSpan = rowMax - rowMin + 1;
          const colSpan = colMax - colMin + 1;
          if (rowSpan !== 1) continue;

          const isAnchor = rowId === anchorRowId && columnId === anchorColumnId;

          if (!isAnchor) {
            return {
              kind: "covered" as const,
              anchorRowIndex: anchorRowIndexInPage,
              anchorColumnId,
              rowSpan,
              colSpan,
              coverMode: "collapse",
            };
          }

          const ids = s.columnKeys.slice(colMin, colMax + 1);
          const widthCss =
            ids.length === 1
              ? `calc(var(--col-${ids[0]}-size) * 1px)`
              : `calc(${ids
                .map((id) => `var(--col-${id}-size) * 1px`)
                .join(" + ")})`;

          return {
            kind: "anchor" as const,
            anchorRowIndex: anchorRowIndexInPage,
            anchorColumnId,
            rowSpan,
            colSpan,
            widthCss,
          };
        }

        return null;
      },
    }),
    [
      columnKeys,
      data,
      isWindowed,
      session,
      patchSession,
      toastWindowedStructureBlocked,
      trackColumnReorder,
      onDataChange,
      onColumnInsertBefore,
      onColumnInsertAfter,
      onColumnCopy,
      onColumnCut,
      onColumnPaste,
      onColumnClearAll,
      onColumnDelete,
      onColumnRename,
      onColumnKindChange,
      onRowInsertBefore,
      onRowInsertAfter,
      onRowCopy,
      onRowCut,
      onRowPaste,
      onRowClearAll,
      onRowDelete,
      tc,
    ],
  );

  const columnOrder = React.useMemo<ColumnOrderState>(
    () => ["select", ...session.columnKeys],
    [session.columnKeys],
  );

  const tableControlledState = React.useMemo(
    () => ({ columnOrder, pagination }),
    [columnOrder, pagination],
  );

  const onColumnOrderChange = React.useCallback(
    (updater: Updater<ColumnOrderState>) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      const prev: ColumnOrderState = ["select", ...session.columnKeys];
      const next = typeof updater === "function" ? updater(prev) : updater;
      const nextData = next.filter((id) => id !== "select");
      if (nextData.length !== session.columnKeys.length) return;
      const keySet = new Set(session.columnKeys);
      if (!nextData.every((id) => keySet.has(id))) return;

      const prevSnapshot = {
        columnKeys: [...session.columnKeys],
        headerLabels: [...session.headerLabels],
        columnKinds: [...session.columnKinds],
      };
      const reorderedPreview = reorderCsvSessionColumnKeys(session, nextData);
      const nextSnapshot = {
        columnKeys: [...reorderedPreview.columnKeys],
        headerLabels: [...reorderedPreview.headerLabels],
        columnKinds: [...reorderedPreview.columnKinds],
      };

      const promise = new Promise<void>((resolve, reject) => {
        const stack = columnReorderLayoutResolversRef.current;
        stack.push(resolve);
        try {
          patchSession((s) => reorderCsvSessionColumnKeys(s, nextData));
          trackColumnReorder({
            undo: () =>
              patchSession((s) => ({
                ...s,
                columnKeys: [...prevSnapshot.columnKeys],
                headerLabels: [...prevSnapshot.headerLabels],
                columnKinds: [...prevSnapshot.columnKinds],
              })),
            redo: () =>
              patchSession((s) => ({
                ...s,
                columnKeys: [...nextSnapshot.columnKeys],
                headerLabels: [...nextSnapshot.headerLabels],
                columnKinds: [...nextSnapshot.columnKinds],
              })),
          });
        } catch (e) {
          const i = stack.lastIndexOf(resolve);
          if (i !== -1) stack.splice(i, 1);
          reject(e instanceof Error ? e : new Error(tc("columnReorderError")));
        }
      });

      void toast.promise(promise, {
        id: "csv-column-reorder",
        loading: tc("columnReorderLoading"),
        success: tc("columnReorderSuccess"),
        error: tc("columnReorderError"),
      });
    },
    [isWindowed, session, patchSession, toastWindowedStructureBlocked, trackColumnReorder, tc],
  );

  const onRowOrderChange = React.useCallback(
    (orderedPageIds: string[]) => {
      if (isWindowed) {
        toastWindowedStructureBlocked();
        return;
      }
      const t = csvGridTableRef.current;
      if (!t) return;

      // Sortable only knows the current page; merge into full filtered+sorted order.
      const visibleSortedIds = t.getSortedRowModel().rows.map((r) => r.id);
      const { pageIndex, pageSize } = t.getState().pagination;
      const start = pageIndex * pageSize;
      const end = Math.min(start + pageSize, visibleSortedIds.length);
      const pageSlice = visibleSortedIds.slice(start, end);

      if (orderedPageIds.length !== pageSlice.length) return;
      const pageIdSet = new Set(pageSlice);
      if (!orderedPageIds.every((id) => pageIdSet.has(id))) return;
      if (new Set(orderedPageIds).size !== orderedPageIds.length) return;

      const mergedVisibleIds = [
        ...visibleSortedIds.slice(0, start),
        ...orderedPageIds,
        ...visibleSortedIds.slice(end),
      ];

      const prevIds = data.map((r) => r.id);
      const rowById = new Map(data.map((r) => [r.id, r]));
      const visibleSet = new Set(visibleSortedIds);

      let visibleWrite = 0;
      const next: CsvViewerRow[] = [];
      for (const row of data) {
        if (!visibleSet.has(row.id)) {
          next.push(row);
          continue;
        }
        const id = mergedVisibleIds[visibleWrite++];
        if (id === undefined) return;
        const r = rowById.get(id);
        if (!r) return;
        next.push(r);
      }
      if (visibleWrite !== mergedVisibleIds.length) return;

      const nextIds = next.map((r) => r.id);
      if (prevIds.every((id, i) => id === nextIds[i])) return;

      patchSession((s) => mergeRowsIntoSession(s, next));
      trackRowReorder(prevIds, nextIds);
    },
    [data, isWindowed, patchSession, toastWindowedStructureBlocked, trackRowReorder],
  );

  const exportBaseName = session.fileName || "export";

  const resolveExportRows = React.useCallback(async (): Promise<CsvViewerRow[]> => {
    if (!isWindowed) return session.rows;
    const merged = await mergeAllCsvViewerIdbRowsWithDirty(
      session,
      windowedDirtyRef.current,
    );
    return merged ?? session.rows;
  }, [isWindowed, session, windowedDirtyRef]);

  const [addColumnOpen, setAddColumnOpen] = React.useState(false);
  const [addColumnHeader, setAddColumnHeader] = React.useState("");
  const [addColumnKind, setAddColumnKind] = React.useState<
    "short-text" | "number" | "date" | "image"
  >("short-text");

  React.useEffect(() => {
    if (!addColumnOpen) return;
    setAddColumnHeader("");
    setAddColumnKind("short-text");
  }, [addColumnOpen]);

  const onExportCsv = React.useCallback(async () => {
    const rows = await resolveExportRows();
    downloadCsvExport(
      rows,
      columnKeys,
      session.headerLabels,
      exportBaseName,
      session.cellMerges ?? [],
    );
    toast.success(tc("downloadStarted"));
  }, [
    columnKeys,
    exportBaseName,
    resolveExportRows,
    session.cellMerges,
    session.headerLabels,
    tc,
  ]);

  const onExportJson = React.useCallback(async () => {
    const rows = await resolveExportRows();
    downloadJsonExport(
      rows,
      columnKeys,
      session.headerLabels,
      exportBaseName,
      session.cellMerges ?? [],
    );
    toast.success(tc("downloadStarted"));
  }, [
    columnKeys,
    exportBaseName,
    resolveExportRows,
    session.cellMerges,
    session.headerLabels,
    tc,
  ]);

  const onExportXml = React.useCallback(async () => {
    const rows = await resolveExportRows();
    downloadXmlExport(
      rows,
      columnKeys,
      session.headerLabels,
      exportBaseName,
      session.cellMerges ?? [],
    );
    toast.success(tc("downloadStarted"));
  }, [
    columnKeys,
    exportBaseName,
    resolveExportRows,
    session.cellMerges,
    session.headerLabels,
    tc,
  ]);

  const onExportXlsx = React.useCallback(() => {
    void toast.promise(
      (async () => {
        const rows = await resolveExportRows();
        return downloadXlsxExport(
          rows,
          columnKeys,
          session.headerLabels,
          exportBaseName,
          session.cellMerges ?? [],
        );
      })(),
      {
        loading: tc("prepExcel"),
        success: tc("downloadStarted"),
        error: tc("excelError"),
      },
    );
  }, [
    columnKeys,
    exportBaseName,
    resolveExportRows,
    session.cellMerges,
    session.headerLabels,
    tc,
  ]);

  const onExportPdf = React.useCallback(() => {
    void toast.promise(
      (async () => {
        const rows = await resolveExportRows();
        return downloadPdfExport(
          rows,
          columnKeys,
          session.headerLabels,
          exportBaseName,
          session.cellMerges ?? [],
        );
      })(),
      {
        loading: "Preparing PDF…",
        success: tc("downloadStarted"),
        error: "Could not create PDF file",
      },
    );
  }, [
    columnKeys,
    exportBaseName,
    resolveExportRows,
    session.cellMerges,
    session.headerLabels,
    tc,
  ]);

  const onAddColumnDialogSubmit = React.useCallback(() => {
    if (isWindowed) {
      toastWindowedStructureBlocked();
      return;
    }
    const insertIndex = session.columnKeys.length;
    const prev = cloneCsvViewerSession(session);
    const inserted = insertEmptyCsvSessionColumnAt(session, insertIndex);
    const newKey = inserted.columnKeys[insertIndex];
    if (!newKey) return;

    let next = inserted;
    next =
      addColumnHeader.trim() === ""
        ? next
        : (renameCsvSessionColumnHeader(next, newKey, addColumnHeader) ?? next);
    next = setCsvSessionColumnKind(next, newKey, addColumnKind) ?? next;

    const nextSnap = cloneCsvViewerSession(next);
    patchSession(() => next);
    trackColumnReorder({
      undo: () => patchSession(() => cloneCsvViewerSession(prev)),
      redo: () => patchSession(() => cloneCsvViewerSession(nextSnap)),
    });
    setAddColumnOpen(false);
    toast.success(tc("toastColumnAdded"));
  }, [
    addColumnHeader,
    addColumnKind,
    isWindowed,
    patchSession,
    session,
    toastWindowedStructureBlocked,
    trackColumnReorder,
    tc,
  ]);

  const windowedTotal = session.windowedTotalRows ?? 0;
  const windowedTableOptions =
    isWindowed && windowedTotal > 0
      ? {
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        rowCount: windowedTotal,
        pageCount: Math.max(
          1,
          Math.ceil(windowedTotal / Math.max(1, pagination.pageSize)),
        ),
        enableSorting: false,
        enableFilters: false,
        enableGlobalFilter: false,
      }
      : {};

  const { table, searchState, tableMeta, ...dataGridProps } = useDataGrid({
    data,
    columns: columnsWithSelect,
    getRowId: (row) => row.id,
    onDataChange,
    onRowAdd,
    onRowsAdd,
    onRowsDelete,
    meta: csvGridTableMeta,
    initialState: {
      columnPinning: {
        left: ["select"],
      },
    },
    state: tableControlledState,
    onColumnOrderChange,
    onPaginationChange,
    dir,
    ...windowedTableOptions,
    enableSearch: !isWindowed,
    enablePaste: true,
    enableRowReorder: !isWindowed,
  });

  csvGridTableRef.current = table;

  const pageCount = table.getPageCount();
  React.useEffect(() => {
    if (pageCount > 0 && pagination.pageIndex >= pageCount) {
      setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }));
    }
  }, [pageCount, pagination.pageIndex]);

  return (
    <DirectionProvider dir={dir}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{session.fileName}</p>
            <p className="text-muted-foreground text-xs">
              {tc("rowsColumns", {
                rowCount: (
                  session.windowedTotalRows ?? session.rows.length
                ).toLocaleString(),
                columnCount: session.columnKeys.length.toLocaleString(),
              })}
              {session.truncated
                ? tc("importCapped", {
                    imported: session.importedRowCount.toLocaleString(),
                    total: session.rowCountBeforeCap.toLocaleString(),
                  })
                : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isWindowed}
              title={
                isWindowed
                  ? "Not available while browsing a large restored sheet by page"
                  : undefined
              }
              onClick={() => setAddColumnOpen(true)}
            >
              <Plus className="size-4" />
              Add column
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Trash2 className="size-4" />
                  {tc("clear")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tc("clearDialogTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tc("clearDialogDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">
                    {tCommon("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={() => {
                      void onClear();
                    }}
                  >
                    {tc("clearConfirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm">
                  <Download className="size-4" />
                  {tc("download")}
                  <ChevronDown className="size-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onSelect={onExportCsv}>
                  {tc("exportCsv")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExportPdf}>
                  PDF (.pdf)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExportXml}>
                  XML (.xml)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExportJson}>
                  {tc("exportJson")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExportXlsx}>
                  {tc("exportXlsx")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Dialog open={addColumnOpen} onOpenChange={setAddColumnOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add column</DialogTitle>
              <DialogDescription>
                Choose a header label and column type. You can leave the header
                empty.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">Header</p>
                <Input
                  value={addColumnHeader}
                  onChange={(e) => setAddColumnHeader(e.target.value)}
                  placeholder="e.g. Image"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">Type</p>
                <Select
                  value={addColumnKind}
                  onValueChange={(v) => setAddColumnKind(v as never)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddColumnOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="button" onClick={onAddColumnDialogSubmit}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div
          role="toolbar"
          aria-orientation="horizontal"
          className="flex flex-wrap items-center gap-2"
        >
          <Toggle
            aria-label={tc("toggleDirAria")}
            dir={dir}
            variant="outline"
            size="sm"
            className="bg-background dark:bg-input/30 dark:hover:bg-input/50"
            pressed={dir === "rtl"}
            onPressedChange={(pressed) =>
              patchSession((s) => ({
                ...s,
                dir: pressed ? "rtl" : "ltr",
              }))
            }
          >
            <Languages className="text-muted-foreground" />
            {dir === "ltr" ? tc("ltr") : tc("rtl")}
          </Toggle>
          <DataGridSearchButton searchState={searchState} />
          <DataGridUndoRedoButtons
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
          />
          <DataGridFilterMenu table={table} align="start" />
          <DataGridSortMenu table={table} align="start" />
          <DataGridRowHeightMenu table={table} align="start" />
          <DataGridViewMenu table={table} align="start" />
        </div>

        <DataGridKeyboardShortcuts
          enableSearch={!isWindowed}
          enableUndoRedo
          enablePaste
          enableRowAdd={!isWindowed}
          enableRowsDelete={!isWindowed}
        />
        <DataGrid
          {...dataGridProps}
          enableColumnReorder
          enableRowReorder
          table={table}
          tableMeta={tableMeta}
          searchState={searchState}
          height={height}
          onRowOrderChange={onRowOrderChange}
        />
        <DataGridPagination table={table} />
        <DataGridRowSelectionActionBar table={table} tableMeta={tableMeta} />
      </div>
    </DirectionProvider>
  );
}

export function CsvViewerApp() {
  const tl = useTranslations("landing");
  const tPage = useTranslations("pageMeta");
  const [hydrated, setHydrated] = React.useState(false);
  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const sessionRef = React.useRef<CsvViewerSession | null>(null);
  const windowedDirtyRef = React.useRef<Map<number, CsvViewerRow>>(new Map());
  const [loadGeneration, setLoadGeneration] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState<{
    rowsSoFar: number;
  } | null>(null);
  const importAbortRef = React.useRef<AbortController | null>(null);
  const [importDelimiterChoice, setImportDelimiterChoice] =
    React.useState<CsvImportDelimiterChoice>("auto");
  const [importHeaderMode, setImportHeaderMode] =
    React.useState<CsvImportHeaderMode>("header");
  const [importDialectHydrated, setImportDialectHydrated] =
    React.useState(false);

  const csvImportDialect = React.useMemo(
    () => csvParseDialectFromUi(importDelimiterChoice, importHeaderMode),
    [importDelimiterChoice, importHeaderMode],
  );

  // and load `next/script` for pagead/js/adsbygoogle.js when re-enabling <AdSlot /> below.

  React.useEffect(() => {
    let cancelled = false;
    const inMemory = getInMemoryCsvViewerSession();
    if (inMemory) {
      windowedDirtyRef.current.clear();
      sessionRef.current = inMemory;
      setSession(inMemory);
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    void loadCsvViewerSession({
      windowed: true,
      initialPageSize: CSV_VIEWER_WINDOWED_INITIAL_PAGE_SIZE,
    }).then((restored) => {
      if (cancelled) return;
      windowedDirtyRef.current.clear();
      if (restored) {
        sessionRef.current = restored;
        setInMemoryCsvViewerSession(restored);
        setSession(restored);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CSV_VIEWER_DIALECT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CsvImportDialectStorage>;
        const d = parsed.delimiterChoice;
        const h = parsed.headerMode;
        if (
          d === "auto" ||
          d === "comma" ||
          d === "semicolon" ||
          d === "tab" ||
          d === "pipe"
        ) {
          setImportDelimiterChoice(d);
        }
        if (h === "header" || h === "noHeader") {
          setImportHeaderMode(h);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setImportDialectHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!importDialectHydrated) return;
    try {
      const payload: CsvImportDialectStorage = {
        delimiterChoice: importDelimiterChoice,
        headerMode: importHeaderMode,
      };
      localStorage.setItem(
        CSV_VIEWER_DIALECT_STORAGE_KEY,
        JSON.stringify(payload),
      );
    } catch {
      // private mode / quota
    }
  }, [importDelimiterChoice, importHeaderMode, importDialectHydrated]);

  React.useEffect(() => {
    if (!hydrated || !session) return;
    const rowCount = session.windowedTotalRows ?? session.rows.length;
    const ms = csvViewerPersistDebounceMs(rowCount);
    const id = window.setTimeout(() => {
      void saveCsvViewerSession(session, {
        windowedDirty: session.windowedTotalRows
          ? windowedDirtyRef.current
          : undefined,
      });
    }, ms);
    return () => window.clearTimeout(id);
  }, [session, hydrated]);

  React.useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== "hidden") return;
      const s = sessionRef.current;
      if (!s) return;
      void saveCsvViewerSession(s, {
        windowedDirty: s.windowedTotalRows
          ? windowedDirtyRef.current
          : undefined,
      });
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // If the user switches locale, this component unmounts/remounts.
  // Flush the latest snapshot so language switching has no “state reset” side-effect.
  React.useEffect(() => {
    return () => {
      const s = sessionRef.current;
      if (!s) return;
      void saveCsvViewerSession(s, {
        windowedDirty: s.windowedTotalRows
          ? windowedDirtyRef.current
          : undefined,
      });
    };
  }, []);

  const patchSession = React.useCallback(
    (fn: (s: CsvViewerSession) => CsvViewerSession) => {
      setSession((prev) => {
        const next = prev ? fn(prev) : prev;
        sessionRef.current = next;
        setInMemoryCsvViewerSession(next);
        return next;
      });
    },
    [],
  );

  const onParsed = React.useCallback(
    (r: CsvImportResult, name: string) => {
      windowedDirtyRef.current.clear();
      const next = resultToSession(name, r, "ltr");
      sessionRef.current = next;
      setInMemoryCsvViewerSession(next);
      setSession(next);
      setLoadGeneration((g) => g + 1);
      setError(null);
      if (r.truncated) {
        toast.message(tl("largeFileTitle"), {
          description: tl("largeFileDescription", {
            shown: r.rows.length.toLocaleString(),
            total: r.rowCountBeforeCap.toLocaleString(),
          }),
        });
      }
    },
    [tl],
  );

  const onPickFiles = React.useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setBusy(true);
      setError(null);
      setImportProgress({ rowsSoFar: 0 });
      const ac = new AbortController();
      importAbortRef.current = ac;
      try {
        const r = await parseCsvFile(file, {
          signal: ac.signal,
          onProgress: (p) => setImportProgress({ rowsSoFar: p.rowsSoFar }),
          dialect: csvImportDialect,
        });
        onParsed(r, file.name);
      } catch (e) {
        if (e instanceof CsvImportError) {
          if (e.code === "import_aborted") {
            toast.message(tl("importCancelled"));
          } else {
            setError(e.message);
          }
        } else {
          setError(tl("readError"));
        }
      } finally {
        importAbortRef.current = null;
        setImportProgress(null);
        setBusy(false);
      }
    },
    [csvImportDialect, onParsed, tl],
  );

  const onTrySample = React.useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(SAMPLE_CSV_PATH);
      if (!res.ok) {
        setError(tl("sampleMissing"));
        return;
      }
      const text = await res.text();
      const r = parseCsvText(text, csvImportDialect);
      onParsed(r, SAMPLE_CSV_FILENAME);
    } catch (e) {
      if (e instanceof CsvImportError) {
        setError(e.message);
      } else {
        setError(tl("sampleError"));
      }
    } finally {
      setBusy(false);
    }
  }, [csvImportDialect, onParsed, tl]);

  const onClear = React.useCallback(async () => {
    await clearCsvViewerSession();
    windowedDirtyRef.current.clear();
    sessionRef.current = null;
    setInMemoryCsvViewerSession(null);
    setSession(null);
    setError(null);
  }, []);

  return (
    <DirectionProvider dir="ltr">

      <div className="container flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className={toolHeroTitleClassName}>{tPage("csvViewer.h1")}</h1>
            <p className="text-muted-foreground text-sm">
              {tl("heroSubtitle")}
            </p>
          </header>

          {!hydrated ? (
            <div
              className="flex items-center gap-2 text-muted-foreground text-sm"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {tl("loadingSheet")}
            </div>
          ) : !session ? (
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 rounded-md border bg-muted/15 p-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="flex min-w-40 flex-col gap-1.5">
                    <Label htmlFor="csv-import-delimiter" className="text-xs">
                      {tl("importDialectDelimiter")}
                    </Label>
                    <Select
                      value={importDelimiterChoice}
                      onValueChange={(v) =>
                        setImportDelimiterChoice(v as CsvImportDelimiterChoice)
                      }
                    >
                      <SelectTrigger id="csv-import-delimiter" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          {tl("importDialectDelimiterAuto")}
                        </SelectItem>
                        <SelectItem value="comma">
                          {tl("importDialectDelimiterComma")}
                        </SelectItem>
                        <SelectItem value="semicolon">
                          {tl("importDialectDelimiterSemicolon")}
                        </SelectItem>
                        <SelectItem value="tab">
                          {tl("importDialectDelimiterTab")}
                        </SelectItem>
                        <SelectItem value="pipe">
                          {tl("importDialectDelimiterPipe")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex min-w-48 flex-col gap-1.5">
                    <Label htmlFor="csv-import-header" className="text-xs">
                      {tl("importDialectFirstRow")}
                    </Label>
                    <Select
                      value={importHeaderMode}
                      onValueChange={(v) =>
                        setImportHeaderMode(v as CsvImportHeaderMode)
                      }
                    >
                      <SelectTrigger id="csv-import-header" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">
                          {tl("importDialectFirstRowHeader")}
                        </SelectItem>
                        <SelectItem value="noHeader">
                          {tl("importDialectFirstRowData")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {importHeaderMode === "noHeader" ? (
                    <p className="max-w-md text-muted-foreground text-xs">
                      {tl("importDialectNoHeaderHint")}
                    </p>
                  ) : null}
                </div>
              <FileDropZone
                disabled={false}
                busy={busy}
                size="lg"
                badgeSize="lg"
                fileIcon={FileSpreadsheetGlyph}
                accept=".csv,text/csv"
                onFiles={onPickFiles}
                dropTitle={tl("dropzoneTitle")}
                dropHint={tl("dropzoneHint", {
                  mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
                  maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
                })}
                chooseLabel={tl("chooseFile")}
                ariaLabel={tl("chooseFile")}
              />
                {busy && importProgress ? (
                  <div
                    className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-muted-foreground text-sm">
                        {tl("importReadingRows", {
                          count: importProgress.rowsSoFar.toLocaleString(),
                        })}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => importAbortRef.current?.abort()}
                      >
                        {tl("importCancel")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void onTrySample()}
                >
                  {tl("trySample")}
                </Button>
              </div>
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <CsvGridPanel
                key={loadGeneration}
                session={session}
                patchSession={patchSession}
                onClear={onClear}
                    windowedDirtyRef={windowedDirtyRef}
              />
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* Future: desktop rail + <AdSlot variant="rail" /> (import from @/components/ads/ad-slot)
        <aside className="hidden w-[300px] shrink-0 lg:block">
          <AdSlot variant="rail" />
        </aside>
        */}
      </div>
    </DirectionProvider>
  );
}
