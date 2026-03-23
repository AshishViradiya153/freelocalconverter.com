"use client";

import type { Header, Table } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import * as React from "react";
import { DataGridColumnHeader } from "@/components/data-grid/data-grid-column-header";
import { SortableItem, SortableItemHandle } from "@/components/ui/sortable";
import {
  flexRender,
  getColumnBorderVisibility,
  getColumnPinningStyle,
  getDataGridColumnWidthStyle,
} from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import type { Direction } from "@/types/data-grid";

interface DataGridHeaderCellProps<TData> {
  header: Header<TData, unknown>;
  colIndex: number;
  headersInRow: Header<TData, unknown>[];
  table: Table<TData>;
  dir: Direction;
  stretchColumns: boolean;
  reorderByDraggingHeader: boolean;
}

export function DataGridHeaderCell<TData>({
  header,
  colIndex,
  headersInRow,
  table,
  dir,
  stretchColumns,
  reorderByDraggingHeader,
}: DataGridHeaderCellProps<TData>) {
  const sorting = table.getState().sorting;
  const currentSort = sorting.find((sort) => sort.id === header.column.id);
  const isSortable = header.column.getCanSort();

  const nextHeader = headersInRow[colIndex + 1];
  const isLastColumn = colIndex === headersInRow.length - 1;

  const { showEndBorder, showStartBorder } = getColumnBorderVisibility({
    column: header.column,
    nextColumn: nextHeader?.column,
    isLastColumn,
  });

  const inner = (
    <div className="min-w-0 flex-1">
      {header.isPlaceholder ? null : typeof header.column.columnDef.header ===
        "function" ? (
        <div className="size-full px-3 py-1.5">
          {flexRender(
            header.column.columnDef.header,
            header.getContext(),
          )}
        </div>
      ) : (
        <DataGridColumnHeader header={header} table={table} />
      )}
    </div>
  );

  const shellClass = cn("relative flex items-stretch", {
    grow: stretchColumns && header.column.id !== "select",
    "shrink-0": header.column.id === "select",
    "border-e": showEndBorder && header.column.id !== "select",
    "border-s": showStartBorder && header.column.id !== "select",
  });

  const shellStyle: React.CSSProperties = {
    ...getColumnPinningStyle({ column: header.column, dir }),
    ...getDataGridColumnWidthStyle({
      column: header.column,
      cssVarName: `--header-${header.id}-size`,
    }),
  };

  const columnReorderHandle = reorderByDraggingHeader ? (
    <SortableItemHandle
      aria-label="Drag to reorder column"
      title="Drag to reorder column"
      className={cn(
        "flex h-9 shrink-0 touch-none items-center justify-center overflow-hidden rounded-sm text-muted-foreground",
        "w-0 max-w-0 min-w-0 p-0 opacity-0 pointer-events-none",
        "transition-[width,max-width,min-width,opacity] duration-150 ease-out",
        "group-hover/grid-header-cell:pointer-events-auto group-hover/grid-header-cell:w-7 group-hover/grid-header-cell:max-w-7 group-hover/grid-header-cell:min-w-7 group-hover/grid-header-cell:opacity-100",
        "data-dragging:pointer-events-auto data-dragging:w-7 data-dragging:max-w-7 data-dragging:min-w-7 data-dragging:opacity-100",
        "focus-visible:pointer-events-auto focus-visible:w-7 focus-visible:max-w-7 focus-visible:min-w-7 focus-visible:opacity-100",
        "hover:bg-accent/40 hover:text-foreground",
      )}
    >
      <GripVertical className="size-3.5" aria-hidden />
    </SortableItemHandle>
  ) : null;

  if (reorderByDraggingHeader) {
    const reorderInner =
      header.isPlaceholder ? null : typeof header.column.columnDef.header ===
        "function" ? (
        <div className="flex min-w-0 flex-1 items-center">
          <div className="min-w-0 flex-1 px-3 py-1.5">
            {flexRender(
              header.column.columnDef.header,
              header.getContext(),
            )}
          </div>
          {columnReorderHandle}
        </div>
      ) : (
        <DataGridColumnHeader
          header={header}
          table={table}
          columnReorderHandleSlot={columnReorderHandle}
        />
      );

    return (
      <SortableItem value={header.column.id} asChild>
        <div
          role="columnheader"
          aria-colindex={colIndex + 1}
          aria-sort={
            currentSort?.desc === false
              ? "ascending"
              : currentSort?.desc === true
                ? "descending"
                : isSortable
                  ? "none"
                  : undefined
          }
          data-slot="grid-header-cell"
          tabIndex={-1}
          className={cn(shellClass, "group/grid-header-cell")}
          style={shellStyle}
        >
          {reorderInner}
        </div>
      </SortableItem>
    );
  }

  return (
    <div
      role="columnheader"
      aria-colindex={colIndex + 1}
      aria-sort={
        currentSort?.desc === false
          ? "ascending"
          : currentSort?.desc === true
            ? "descending"
            : isSortable
              ? "none"
              : undefined
      }
      data-slot="grid-header-cell"
      tabIndex={-1}
      className={shellClass}
      style={shellStyle}
    >
      {inner}
    </div>
  );
}
