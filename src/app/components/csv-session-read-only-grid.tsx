"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import type {
  ColumnDef,
  PaginationState,
  Updater,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import {
  DataGridPagination,
  DEFAULT_DATA_GRID_PAGE_SIZE,
} from "@/components/data-grid/data-grid-pagination";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
import { DataGridSearchButton } from "@/components/data-grid/data-grid-search";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridUndoRedoButtons } from "@/components/data-grid/data-grid-undo-redo-buttons";
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { useDataGrid } from "@/hooks/use-data-grid";
import {
  type UndoRedoCellUpdate,
  useDataGridUndoRedo,
} from "@/hooks/use-data-grid-undo-redo";
import { useWindowSize } from "@/hooks/use-window-size";
import { buildColumnDefsForCsv, type CsvViewerRow } from "@/lib/csv-import";
import type { CsvViewerSession } from "@/lib/csv-viewer-session";
import { mergeRowsIntoSession } from "@/lib/csv-viewer-session";
import type { Direction } from "@/types/data-grid";

interface CsvSessionReadOnlyGridProps {
  session: CsvViewerSession;
  gridKey: string;
  /**
   * Called whenever the grid commits cell edits (so downloads use the latest data).
   * If omitted, the grid stays read-only.
   */
  onSessionChange?: (next: CsvViewerSession) => void;
  /** When set with `highlightDiffs`, cells in the set are highlighted (compare mode). */
  diffCellSet?: Set<string> | null;
  highlightDiffs?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  onGridScroll?: React.UIEventHandler<HTMLDivElement>;
}

export function CsvSessionReadOnlyGrid({
  session,
  gridKey,
  onSessionChange,
  diffCellSet = null,
  highlightDiffs = false,
  scrollContainerRef,
  onGridScroll,
}: CsvSessionReadOnlyGridProps) {
  const tc = useTranslations("csv");
  const windowSize = useWindowSize({ defaultHeight: 800 });
  const height = Math.max(360, Math.min(560, windowSize.height - 420));
  const dir: Direction = session.dir === "rtl" ? "rtl" : "ltr";
  const editingEnabled = Boolean(onSessionChange);

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

  const tableControlledState = React.useMemo(
    () => ({ pagination }),
    [pagination],
  );

  const getCompareDiffHighlight = React.useCallback(
    (rowId: string, columnId: string) => {
      if (!highlightDiffs || !diffCellSet?.size) return false;
      return diffCellSet.has(`${rowId}\t${columnId}`);
    },
    [diffCellSet, highlightDiffs],
  );

  const replaceRows = React.useCallback(
    (newRows: CsvViewerRow[]) => {
      if (!onSessionChange) return;
      onSessionChange(mergeRowsIntoSession(session, newRows));
    },
    [onSessionChange, session],
  );

  const { canUndo, canRedo, onUndo, onRedo, trackCellsUpdate } =
    useDataGridUndoRedo({
      data: session.rows,
      onDataChange: replaceRows,
      getRowId: (row) => row.id,
      enabled: editingEnabled,
    });

  const onDataChange = React.useCallback(
    (newData: CsvViewerRow[]) => {
      if (!editingEnabled) return;
      const oldData = session.rows;
      const cellUpdates: UndoRedoCellUpdate[] = [];
      const maxLength = Math.max(oldData.length, newData.length);

      for (let rowIndex = 0; rowIndex < maxLength; rowIndex++) {
        const oldRow = oldData[rowIndex];
        const newRow = newData[rowIndex];
        if (!oldRow || !newRow) continue;

        const allKeys = new Set([
          ...Object.keys(oldRow),
          ...Object.keys(newRow),
        ]);

        for (const key of allKeys) {
          if (key === "id") continue;
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

      if (cellUpdates.length > 0) trackCellsUpdate(cellUpdates);
      replaceRows(newData);
    },
    [editingEnabled, replaceRows, session.rows, trackCellsUpdate],
  );

  const { table, searchState, tableMeta, ...dataGridProps } = useDataGrid({
    data: session.rows,
    columns: dataColumns as ColumnDef<CsvViewerRow>[],
    getRowId: (row) => row.id,
    enableSearch: true,
    readOnly: !editingEnabled,
    enablePaste: editingEnabled,
    onDataChange,
    state: tableControlledState,
    onPaginationChange,
    dir,
    meta: highlightDiffs ? { getCompareDiffHighlight } : undefined,
  });

  const pageCount = table.getPageCount();
  React.useEffect(() => {
    if (pageCount > 0 && pagination.pageIndex >= pageCount) {
      setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }));
    }
  }, [pageCount, pagination.pageIndex]);

  return (
    <DirectionProvider dir={dir}>
      <div key={gridKey} className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{session.fileName}</p>
          <p className="text-muted-foreground text-xs">
            {tc("rowsColumns", {
              rowCount: session.rows.length.toLocaleString(),
              columnCount: session.columnKeys.length.toLocaleString(),
            })}
          </p>
        </div>
        <div
          role="toolbar"
          aria-orientation="horizontal"
          className="flex flex-wrap items-center gap-2"
        >
          <DataGridSearchButton searchState={searchState} />
          {editingEnabled ? (
            <DataGridUndoRedoButtons
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={onUndo}
              onRedo={onRedo}
            />
          ) : null}
          <DataGridFilterMenu table={table} align="start" />
          <DataGridSortMenu table={table} align="start" />
          <DataGridRowHeightMenu table={table} align="start" />
          <DataGridViewMenu table={table} align="start" />
        </div>
        <DataGridKeyboardShortcuts
          enableSearch
          enableUndoRedo={editingEnabled}
          enablePaste={editingEnabled}
        />
        <DataGrid
          {...dataGridProps}
          table={table}
          tableMeta={tableMeta}
          searchState={searchState}
          height={height}
          scrollContainerRef={scrollContainerRef}
          onGridScroll={onGridScroll}
        />
        <DataGridPagination table={table} />
      </div>
    </DirectionProvider>
  );
}
