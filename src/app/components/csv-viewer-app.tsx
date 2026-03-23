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
  FileSpreadsheet,
  Languages,
  Loader2,
  Trash2,
  Upload,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { type UseDataGridProps, useDataGrid } from "@/hooks/use-data-grid";
import {
  type UndoRedoCellUpdate,
  useDataGridUndoRedo,
} from "@/hooks/use-data-grid-undo-redo";
import { useWindowSize } from "@/hooks/use-window-size";
import {
  applyColumnPasteToSession,
  buildColumnClipboardPayload,
  type ColumnClipboardPayload,
  columnClipboardToTsv,
} from "@/lib/csv-column-ops";
import {
  downloadCsvExport,
  downloadJsonExport,
  downloadXlsxExport,
} from "@/lib/csv-export";
import {
  buildColumnDefsForCsv,
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  type CsvImportResult,
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
  loadCsvViewerSession,
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
} from "@/lib/csv-viewer-session";
import { cn } from "@/lib/utils";
import type { Direction } from "@/types/data-grid";
import { SAMPLE_CSV_FILENAME, SAMPLE_CSV_PATH } from "../lib/sample-csv";

const PERSIST_DEBOUNCE_MS = 500;

interface CsvGridPanelProps {
  session: CsvViewerSession;
  patchSession: (fn: (s: CsvViewerSession) => CsvViewerSession) => void;
  onClear: () => void | Promise<void>;
}

function CsvGridPanel({ session, patchSession, onClear }: CsvGridPanelProps) {
  const tc = useTranslations("csv");
  const tCommon = useTranslations("common");
  const csvGridTableRef = React.useRef<Table<CsvViewerRow> | null>(null);
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
  }, [session.columnKeys]);

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

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_DATA_GRID_PAGE_SIZE,
  });

  const onPaginationChange = React.useCallback(
    (updater: Updater<PaginationState>) => {
      setPagination((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const replaceRows = React.useCallback(
    (newRows: CsvViewerRow[]) => {
      patchSession((s) => mergeRowsIntoSession(s, newRows));
    },
    [patchSession],
  );

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
      const newRow = createEmptyCsvViewerRow(columnKeys);
      const newRowIndex = data.length;
      replaceRows([...data, newRow]);
      trackRowsAdd([newRow]);
      return {
        rowIndex: newRowIndex,
        columnId: firstDataColumnId,
      };
    }, [columnKeys, data, firstDataColumnId, replaceRows, trackRowsAdd]);

  const onRowsAdd: NonNullable<UseDataGridProps<CsvViewerRow>["onRowsAdd"]> =
    React.useCallback(
      (count: number) => {
        const newRows = Array.from({ length: count }, () =>
          createEmptyCsvViewerRow(columnKeys),
        );
        replaceRows([...data, ...newRows]);
        trackRowsAdd(newRows);
      },
      [columnKeys, data, replaceRows, trackRowsAdd],
    );

  const onRowsDelete: NonNullable<
    UseDataGridProps<CsvViewerRow>["onRowsDelete"]
  > = React.useCallback(
    (rows) => {
      trackRowsDelete(rows);
      replaceRows(data.filter((row) => !rows.includes(row)));
    },
    [data, replaceRows, trackRowsDelete],
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
    [session, patchSession, trackColumnReorder],
  );

  const onColumnInsertAfter = React.useCallback(
    (columnId: string) => {
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
    [session, patchSession, trackColumnReorder],
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
    [session],
  );

  const onColumnCut = React.useCallback(
    async (columnId: string) => {
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
    [session, patchSession, trackColumnReorder],
  );

  const onColumnPaste = React.useCallback(
    async (columnId: string) => {
      let text: string;
      try {
        text = await navigator.clipboard.readText();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tc("toastClipboardReadFailed"),
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
    [session, patchSession, trackColumnReorder],
  );

  const onColumnClearAll = React.useCallback(
    (columnId: string) => {
      if (!session.columnKeys.includes(columnId)) return;
      onDataChange(data.map((row) => ({ ...row, [columnId]: "" })));
      toast.success(tc("toastColumnCleared"));
    },
    [session.columnKeys, data, onDataChange],
  );

  const onColumnDelete = React.useCallback(
    (columnId: string) => {
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
    [session, patchSession, trackColumnReorder],
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
    [session, patchSession, trackColumnReorder],
  );

  const onRowInsertBefore = React.useCallback(
    (rowId: string) => {
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
    [data, session, patchSession, trackColumnReorder],
  );

  const onRowInsertAfter = React.useCallback(
    (rowId: string) => {
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
    [data, session, patchSession, trackColumnReorder],
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
    [data, columnKeys],
  );

  const onRowCut = React.useCallback(
    async (rowId: string) => {
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
    [data, session, columnKeys, patchSession, trackColumnReorder],
  );

  const onRowPaste = React.useCallback(
    async (rowId: string) => {
      let text: string;
      try {
        text = await navigator.clipboard.readText();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tc("toastClipboardReadFailed"),
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
    [session, columnKeys, patchSession, trackColumnReorder],
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
    [data, columnKeys, onDataChange],
  );

  const onRowDelete = React.useCallback(
    (rowId: string) => {
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
    [session, patchSession, trackColumnReorder],
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
    }),
    [
      columnKeys,
      data,
      session,
      patchSession,
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
          reject(
            e instanceof Error ? e : new Error(tc("columnReorderError")),
          );
        }
      });

      void toast.promise(promise, {
        id: "csv-column-reorder",
        loading: tc("columnReorderLoading"),
        success: tc("columnReorderSuccess"),
        error: tc("columnReorderError"),
      });
    },
    [session, patchSession, trackColumnReorder, tc],
  );

  const onRowOrderChange = React.useCallback(
    (orderedPageIds: string[]) => {
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
    [data, patchSession, trackRowReorder],
  );

  const exportBaseName = session.fileName || "export";

  const onExportCsv = React.useCallback(() => {
    downloadCsvExport(
      session.rows,
      columnKeys,
      session.headerLabels,
      exportBaseName,
    );
    toast.success(tc("downloadStarted"));
  }, [columnKeys, exportBaseName, session.headerLabels, session.rows, tc]);

  const onExportJson = React.useCallback(() => {
    downloadJsonExport(
      session.rows,
      columnKeys,
      session.headerLabels,
      exportBaseName,
    );
    toast.success(tc("downloadStarted"));
  }, [columnKeys, exportBaseName, session.headerLabels, session.rows, tc]);

  const onExportXlsx = React.useCallback(() => {
    void toast.promise(
      downloadXlsxExport(
        session.rows,
        columnKeys,
        session.headerLabels,
        exportBaseName,
      ),
      {
        loading: tc("prepExcel"),
        success: tc("downloadStarted"),
        error: tc("excelError"),
      },
    );
  }, [columnKeys, exportBaseName, session.headerLabels, session.rows, tc]);

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
    enableSearch: true,
    enablePaste: true,
    enableRowReorder: true,
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
                rowCount: session.rows.length.toLocaleString(),
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
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onSelect={onExportCsv}>
                  {tc("exportCsv")}
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

        {/* Future: banner ad (placeholder / AdSense) */}
        {/* <AdSlot variant="banner" className="lg:hidden" /> */}

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
          enableSearch
          enableUndoRedo
          enablePaste
          enableRowAdd
          enableRowsDelete
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
  const [hydrated, setHydrated] = React.useState(false);
  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const [loadGeneration, setLoadGeneration] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // and load `next/script` for pagead/js/adsbygoogle.js when re-enabling <AdSlot /> below.

  React.useEffect(() => {
    let cancelled = false;
    void loadCsvViewerSession().then((restored) => {
      if (cancelled) return;
      if (restored) {
        setSession(restored);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!hydrated || !session) return;
    const id = window.setTimeout(() => {
      void saveCsvViewerSession(session);
    }, PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [session, hydrated]);

  const patchSession = React.useCallback(
    (fn: (s: CsvViewerSession) => CsvViewerSession) => {
      setSession((prev) => (prev ? fn(prev) : prev));
    },
    [],
  );

  const onParsed = React.useCallback(
    (r: CsvImportResult, name: string) => {
      setSession(resultToSession(name, r, "ltr"));
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
      try {
        const r = await parseCsvFile(file);
        onParsed(r, file.name);
      } catch (e) {
        if (e instanceof CsvImportError) {
          setError(e.message);
        } else {
          setError(tl("readError"));
        }
      } finally {
        setBusy(false);
      }
    },
    [onParsed, tl],
  );

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      void onPickFiles(e.dataTransfer.files);
    },
    [onPickFiles],
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
      const r = parseCsvText(text);
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
  }, [onParsed, tl]);

  const onClear = React.useCallback(async () => {
    await clearCsvViewerSession();
    setSession(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <DirectionProvider dir="ltr">
      {/* {adsenseClient ? (
        <Script
          id="adsense-lib"
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
        />
      ) : null} */}

      <div className="container flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className="font-semibold text-5xl tracking-tight">
              {tl("heroTitle")}
            </h1>
            <p className="text-muted-foreground text-sm">{tl("heroSubtitle")}</p>
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
              {/* Future: banner ad (placeholder / AdSense). Import AdSlot from @/components/ads/ad-slot */}
              {/* <AdSlot variant="banner" className="lg:hidden" /> */}
              <button
                type="button"
                disabled={busy}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors",
                  "border-border bg-muted/20 hover:bg-muted/40",
                  busy && "pointer-events-none opacity-60",
                )}
              >
                <FileSpreadsheet className="size-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium text-sm">{tl("dropzoneTitle")}</p>
                  <p className="text-muted-foreground text-xs">
                    {tl("dropzoneHint", {
                      mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
                      maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
                    })}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-md bg-background px-3 py-1.5 font-medium text-sm shadow-sm">
                  <Upload className="size-4" />
                  {tl("chooseFile")}
                </span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => void onPickFiles(e.target.files)}
              />
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
