"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import type { ColumnDef, PaginationState, Updater } from "@tanstack/react-table";
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
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { useDataGrid } from "@/hooks/use-data-grid";
import { useWindowSize } from "@/hooks/use-window-size";
import { buildColumnDefsForCsv, type CsvViewerRow } from "@/lib/csv-import";
import type { CsvViewerSession } from "@/lib/csv-viewer-session";
import type { Direction } from "@/types/data-grid";

interface CsvSessionReadOnlyGridProps {
  session: CsvViewerSession;
  gridKey: string;
  /** When set with `highlightDiffs`, cells in the set are highlighted (compare mode). */
  diffCellSet?: Set<string> | null;
  highlightDiffs?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  onGridScroll?: React.UIEventHandler<HTMLDivElement>;
}

export function CsvSessionReadOnlyGrid({
  session,
  gridKey,
  diffCellSet = null,
  highlightDiffs = false,
  scrollContainerRef,
  onGridScroll,
}: CsvSessionReadOnlyGridProps) {
  const tc = useTranslations("csv");
  const windowSize = useWindowSize({ defaultHeight: 800 });
  const height = Math.max(360, Math.min(560, windowSize.height - 420));
  const dir: Direction = session.dir === "rtl" ? "rtl" : "ltr";

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

  const { table, searchState, tableMeta, ...dataGridProps } = useDataGrid({
    data: session.rows,
    columns: dataColumns as ColumnDef<CsvViewerRow>[],
    getRowId: (row) => row.id,
    readOnly: true,
    enableSearch: true,
    enablePaste: false,
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
          <DataGridFilterMenu table={table} align="start" />
          <DataGridSortMenu table={table} align="start" />
          <DataGridRowHeightMenu table={table} align="start" />
          <DataGridViewMenu table={table} align="start" />
        </div>
        <DataGridKeyboardShortcuts enableSearch />
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
