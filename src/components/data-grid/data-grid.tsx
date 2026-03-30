"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import type { Header } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import * as React from "react";
import { DataGridContextMenu } from "@/components/data-grid/data-grid-context-menu";
import { DataGridHeaderCell } from "@/components/data-grid/data-grid-header-cell";
import { DataGridPasteDialog } from "@/components/data-grid/data-grid-paste-dialog";
import { DataGridRow } from "@/components/data-grid/data-grid-row";
import { DataGridSearch } from "@/components/data-grid/data-grid-search";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from "@/components/ui/sortable";
import { useAsRef } from "@/hooks/use-as-ref";
import type { useDataGrid } from "@/hooks/use-data-grid";
import { useComposedRefs } from "@/lib/compose-refs";
import {
  flexRender,
  getPrePaginationRowIndexForDataRow,
  getRowHeightValue,
  getVirtualRowIndexForPrePaginationMatch,
} from "@/lib/data-grid";
import { resolveVirtualizedRowOrderOnDragEnd } from "@/lib/data-grid-virtual-row-reorder";
import { cn } from "@/lib/utils";
import type { Direction } from "@/types/data-grid";

const EMPTY_CELL_SELECTION_SET = new Set<string>();

const noSortableLayoutAnimation = () => false;

function DataGridColumnDragPreview<TData>({
  header,
}: {
  header: Header<TData, unknown>;
}) {
  const meta = header.column.columnDef.meta as { label?: string } | undefined;
  const label =
    meta?.label ??
    (typeof header.column.columnDef.header === "string"
      ? header.column.columnDef.header
      : header.column.id);

  return (
    <div
      className="pointer-events-none flex h-9 min-w-[140px] max-w-md items-center overflow-hidden rounded-md border bg-background px-3 font-medium text-sm"
      style={{
        width: `calc(var(--header-${header.id}-size) * 1px)`,
      }}
    >
      {header.isPlaceholder ? null : typeof header.column.columnDef.header ===
        "function" ? (
        <div className="min-w-0 flex-1 truncate px-0 py-1.5">
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div>
      ) : (
        <span className="truncate">{label}</span>
      )}
    </div>
  );
}

interface DataGridProps<TData>
  extends Omit<ReturnType<typeof useDataGrid<TData>>, "dir">,
    Omit<React.ComponentProps<"div">, "contextMenu"> {
  dir?: Direction;
  height?: number;
  scrollContainerRef?: React.Ref<HTMLDivElement | null>;
  onGridScroll?: React.UIEventHandler<HTMLDivElement>;
  stretchColumns?: boolean;
  enableColumnReorder?: boolean;
  enableRowReorder?: boolean;
  onRowOrderChange?: (orderedRowIds: string[]) => void;
}

export function DataGrid<TData>({
  dataGridRef,
  headerRef,
  rowMapRef,
  footerRef,
  dir = "ltr",
  table,
  tableMeta,
  virtualTotalSize,
  virtualItems,
  measureElement,
  columns,
  columnSizeVars,
  searchState,
  searchMatchesByRow,
  activeSearchMatch,
  cellSelectionMap,
  focusedCell,
  editingCell,
  rowHeight,
  contextMenu,
  pasteDialog,
  onRowAdd: onRowAddProp,
  height = 600,
  stretchColumns = false,
  adjustLayout = false,
  enableColumnReorder = false,
  enableRowReorder = false,
  onRowOrderChange,
  scrollContainerRef,
  onGridScroll,
  className,
  ...props
}: DataGridProps<TData>) {
  const composedGridRef = useComposedRefs(dataGridRef, scrollContainerRef);
  const rows = table.getRowModel().rows;
  const paginationEnabledForSearch = Boolean(table.options.getPaginationRowModel);
  const activeSearchPrePaginationIndex =
    activeSearchMatch?.dataRowIndex !== undefined
      ? getPrePaginationRowIndexForDataRow(
          table,
          table.options.data,
          activeSearchMatch.dataRowIndex,
        )
      : (activeSearchMatch?.rowIndex ?? -1);
  const activeSearchVirtualRowIndex =
    activeSearchPrePaginationIndex >= 0
      ? getVirtualRowIndexForPrePaginationMatch(
          table,
          activeSearchPrePaginationIndex,
          paginationEnabledForSearch,
        )
      : null;
  const footerTrackWidth =
    table.getTotalSize() +
    (table.getVisibleLeafColumns().some((c) => c.id === "select") ? 48 : 0);
  const readOnly = tableMeta?.readOnly ?? false;
  const rowLayoutUsesTop = adjustLayout || Boolean(enableRowReorder);
  const columnVisibility = table.getState().columnVisibility;
  const columnPinning = table.getState().columnPinning;

  const onRowAddRef = useAsRef(onRowAddProp);

  const onRowAdd = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onRowAddRef.current?.(event);
    },
    [onRowAddRef],
  );

  const onDataGridContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  const onFooterCellKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onRowAddRef.current) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onRowAddRef.current();
      }
    },
    [onRowAddRef],
  );

  const onVirtualizedRowReorderFromDrag = React.useCallback(
    (event: DragEndEvent, value: string[]) => {
      const scrollEl = dataGridRef.current;
      if (!scrollEl) {
        return undefined;
      }
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      return resolveVirtualizedRowOrderOnDragEnd(event, value, {
        scrollEl,
        headerHeight,
        rowHeightPx: getRowHeightValue(rowHeight),
      });
    },
    [rowHeight, dataGridRef.current, headerRef.current?.offsetHeight],
  );

  return (
    <div
      data-slot="grid-wrapper"
      dir={dir}
      {...props}
      className={cn("relative flex w-full flex-col", className)}
    >
      {searchState && <DataGridSearch {...searchState} />}
      <DataGridContextMenu
        tableMeta={tableMeta}
        columns={columns}
        contextMenu={contextMenu}
      />
      <DataGridPasteDialog tableMeta={tableMeta} pasteDialog={pasteDialog} />
      <div
        role="grid"
        aria-label="Data grid"
        aria-rowcount={rows.length + (onRowAddProp ? 1 : 0)}
        aria-colcount={columns.length}
        data-slot="grid"
        tabIndex={0}
        ref={composedGridRef}
        className="relative grid select-none overflow-auto rounded-md border focus:outline-none"
        style={{
          ...columnSizeVars,
          maxHeight: `${height}px`,
        }}
        onScroll={onGridScroll}
        onContextMenu={onDataGridContextMenu}
      >
        <div
          role="rowgroup"
          data-slot="grid-header"
          ref={headerRef}
          className="sticky top-0 z-10 grid border-b bg-background"
        >
          {table.getHeaderGroups().map((headerGroup, rowIndex) => {
            const headers = headerGroup.headers;
            const selectHeader = headers.find((h) => h.column.id === "select");
            const reorderableHeaders = selectHeader
              ? headers.filter((h) => h.column.id !== "select")
              : [...headers];
            const columnOrderPrefix = selectHeader ? (["select"] as const) : [];

            const canReorderColumns =
              enableColumnReorder && !readOnly && reorderableHeaders.length > 0;

            return (
              <div
                key={headerGroup.id}
                role="row"
                aria-rowindex={rowIndex + 1}
                data-slot="grid-header-row"
                tabIndex={-1}
                className="flex w-full"
              >
                {canReorderColumns ? (
                  <>
                    {selectHeader ? (
                      <DataGridHeaderCell
                        key={selectHeader.id}
                        colIndex={0}
                        dir={dir}
                        header={selectHeader}
                        headersInRow={headers}
                        reorderByDraggingHeader={false}
                        stretchColumns={stretchColumns}
                        table={table}
                      />
                    ) : null}
                    <Sortable
                      modifiers={[restrictToHorizontalAxis]}
                      mouseActivationDistance={8}
                      orientation="horizontal"
                      value={reorderableHeaders.map((h) => h.column.id)}
                      onValueChange={(ids) => {
                        table.setColumnOrder([...columnOrderPrefix, ...ids]);
                      }}
                    >
                      <SortableContent
                        className="flex min-w-0 flex-1"
                        withoutSlot
                      >
                        {reorderableHeaders.map((header, i) => (
                          <DataGridHeaderCell
                            key={header.id}
                            colIndex={selectHeader ? i + 1 : i}
                            dir={dir}
                            header={header}
                            headersInRow={headers}
                            reorderByDraggingHeader
                            stretchColumns={stretchColumns}
                            table={table}
                          />
                        ))}
                      </SortableContent>
                      <SortableOverlay>
                        {({ value }) => {
                          const h = reorderableHeaders.find(
                            (x) => x.column.id === String(value),
                          );
                          if (!h) return null;
                          return <DataGridColumnDragPreview header={h} />;
                        }}
                      </SortableOverlay>
                    </Sortable>
                  </>
                ) : (
                  headers.map((header, colIndex) => (
                    <DataGridHeaderCell
                      key={header.id}
                      colIndex={colIndex}
                      dir={dir}
                      header={header}
                      headersInRow={headers}
                      reorderByDraggingHeader={false}
                      stretchColumns={stretchColumns}
                      table={table}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
        <div
          role="rowgroup"
          data-slot="grid-body"
          className="relative grid"
          style={{
            height: `${virtualTotalSize}px`,
            contain: rowLayoutUsesTop ? "layout paint" : "strict",
          }}
        >
          {(() => {
            const canReorderRows =
              enableRowReorder &&
              !readOnly &&
              Boolean(onRowOrderChange) &&
              rows.length > 0;

            const rowNodes = virtualItems.map((virtualItem) => {
              const row = rows[virtualItem.index];
              if (!row) return null;

              const cellSelectionKeys =
                cellSelectionMap?.get(virtualItem.index) ??
                EMPTY_CELL_SELECTION_SET;

              const searchMatchColumns =
                searchMatchesByRow?.get(virtualItem.index) ?? null;
              const isActiveSearchRow =
                activeSearchVirtualRowIndex !== null &&
                activeSearchVirtualRowIndex === virtualItem.index;

              const sharedRowProps = {
                row,
                tableMeta,
                rowMapRef,
                virtualItem,
                measureElement,
                rowHeight,
                columnVisibility,
                columnPinning,
                focusedCell,
                editingCell,
                cellSelectionKeys,
                searchMatchColumns,
                activeSearchMatch: isActiveSearchRow ? activeSearchMatch : null,
                dir,
                adjustLayout: rowLayoutUsesTop,
                stretchColumns,
                readOnly,
                rowReorderByHandle: canReorderRows,
              };

              if (!canReorderRows) {
                return <DataGridRow key={row.id} {...sharedRowProps} />;
              }

              return (
                <SortableItem
                  key={row.id}
                  value={row.id}
                  asChild
                  animateLayoutChanges={noSortableLayoutAnimation}
                >
                  <DataGridRow {...sharedRowProps} />
                </SortableItem>
              );
            });

            if (!canReorderRows) {
              return rowNodes;
            }

            return (
              <Sortable
                modifiers={[restrictToVerticalAxis]}
                mouseActivationDistance={8}
                orientation="vertical"
                resolveOrderOnDragEnd={onVirtualizedRowReorderFromDrag}
                value={rows.map((r) => r.id)}
                onValueChange={onRowOrderChange}
              >
                <SortableContent withoutSlot>{rowNodes}</SortableContent>
                <SortableOverlay>
                  {({ value }) => {
                    const row = rows.find((r) => r.id === value);
                    const dataColumns = table
                      .getVisibleLeafColumns()
                      .filter((c) => c.id !== "select");
                    const first = dataColumns[0];
                    let preview = "Row";
                    if (row && first) {
                      const raw = row.getValue(first.id);
                      const text =
                        raw != null && String(raw).trim() !== ""
                          ? String(raw)
                          : "";
                      preview = text || `Row ${row.index + 1}`;
                    }
                    return (
                      <div
                        className="pointer-events-none flex w-max min-w-48 max-w-[min(100vw-2rem,56rem)] items-center gap-2 rounded-md border bg-background py-2 ps-3 pe-4 text-sm"
                        style={{
                          width: Math.min(
                            table.getTotalSize(),
                            typeof globalThis.window === "undefined"
                              ? table.getTotalSize()
                              : globalThis.window.innerWidth - 32,
                          ),
                        }}
                      >
                        <span className="shrink-0 text-muted-foreground text-xs">
                          Move row
                        </span>
                        <span className="min-w-0 truncate font-medium">
                          {preview}
                        </span>
                      </div>
                    );
                  }}
                </SortableOverlay>
              </Sortable>
            );
          })()}
        </div>
        {!readOnly && onRowAdd && (
          <div
            role="rowgroup"
            data-slot="grid-footer"
            ref={footerRef}
            className="sticky bottom-0 z-10 grid border-t bg-background"
          >
            <div
              role="row"
              aria-rowindex={rows.length + 2}
              data-slot="grid-add-row"
              tabIndex={-1}
              className="flex w-full"
            >
              <div
                role="gridcell"
                tabIndex={0}
                className="relative flex h-9 grow items-center bg-muted/30 transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                style={{
                  width: footerTrackWidth,
                  minWidth: footerTrackWidth,
                }}
                onClick={onRowAdd}
                onKeyDown={onFooterCellKeyDown}
              >
                <div className="sticky start-0 flex items-center gap-2 px-3 text-muted-foreground">
                  <Plus className="size-3.5" />
                  <span className="text-sm">Add row</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
