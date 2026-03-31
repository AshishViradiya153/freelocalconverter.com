"use client";

import type {
  ColumnPinningState,
  Row,
  TableMeta,
  VisibilityState,
} from "@tanstack/react-table";
import type { VirtualItem } from "@tanstack/react-virtual";
import { GripVertical } from "lucide-react";
import * as React from "react";
import { DataGridCell } from "@/components/data-grid/data-grid-cell";
import { SortableItemHandle } from "@/components/ui/sortable";
import { useComposedRefs } from "@/lib/compose-refs";
import {
  flexRender,
  getCellKey,
  getColumnBorderVisibility,
  getColumnPinningStyle,
  getDataGridColumnWidthStyle,
  getRowHeightValue,
} from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import type {
  CellPosition,
  Direction,
  RowHeightValue,
} from "@/types/data-grid";
import type { DataGridCellMergeState } from "@/types/data-grid";

const rowReorderGripClassName = cn(
  "flex max-h-full shrink-0 touch-none items-center justify-center self-stretch overflow-hidden rounded-sm text-muted-foreground",
  "w-0 max-w-0 min-w-0 p-0 opacity-0 pointer-events-none",
  "transition-[width,max-width,min-width,opacity] duration-150 ease-out",
  "group-hover/grid-row-reorder:pointer-events-auto group-hover/grid-row-reorder:w-7 group-hover/grid-row-reorder:max-w-7 group-hover/grid-row-reorder:min-w-7 group-hover/grid-row-reorder:opacity-100",
  "data-dragging:pointer-events-auto data-dragging:w-7 data-dragging:max-w-7 data-dragging:min-w-7 data-dragging:opacity-100",
  "focus-visible:pointer-events-auto focus-visible:w-7 focus-visible:max-w-7 focus-visible:min-w-7 focus-visible:opacity-100",
  "hover:bg-accent/40 hover:text-foreground",
);

function RowReorderGrip() {
  return (
    <SortableItemHandle
      aria-label="Drag to reorder row"
      title="Drag to reorder row"
      className={rowReorderGripClassName}
    >
      <GripVertical className="size-3.5" aria-hidden />
    </SortableItemHandle>
  );
}

interface DataGridRowProps<TData> extends React.ComponentProps<"div"> {
  row: Row<TData>;
  tableMeta: TableMeta<TData>;
  virtualItem: VirtualItem;
  measureElement: (node: Element | null) => void;
  rowMapRef: React.RefObject<Map<number, HTMLDivElement>>;
  rowHeight: RowHeightValue;
  columnVisibility: VisibilityState;
  columnPinning: ColumnPinningState;
  focusedCell: CellPosition | null;
  editingCell: CellPosition | null;
  cellSelectionKeys: Set<string>;
  searchMatchColumns: Set<string> | null;
  activeSearchMatch: CellPosition | null;
  dir: Direction;
  readOnly: boolean;
  stretchColumns: boolean;
  adjustLayout: boolean;
  /** Drag handle in select column (hover to show); only when row is wrapped in `SortableItem`. */
  rowReorderByHandle?: boolean;
}

export const DataGridRow = React.memo(DataGridRowImpl, (prev, next) => {
  const prevRowIndex = prev.virtualItem.index;
  const nextRowIndex = next.virtualItem.index;

  // Re-render if row identity changed
  if (prev.row.id !== next.row.id) {
    return false;
  }

  // Re-render if row data (original) reference changed
  if (prev.row.original !== next.row.original) {
    return false;
  }

  // Re-render if virtual position changed (handles transform updates)
  if (prev.virtualItem.start !== next.virtualItem.start) {
    return false;
  }

  // Re-render if focus state changed for this row
  const prevHasFocus = prev.focusedCell?.rowIndex === prevRowIndex;
  const nextHasFocus = next.focusedCell?.rowIndex === nextRowIndex;

  if (prevHasFocus !== nextHasFocus) {
    return false;
  }

  // Re-render if focused column changed within this row
  if (nextHasFocus && prevHasFocus) {
    if (prev.focusedCell?.columnId !== next.focusedCell?.columnId) {
      return false;
    }
  }

  // Re-render if editing state changed for this row
  const prevHasEditing = prev.editingCell?.rowIndex === prevRowIndex;
  const nextHasEditing = next.editingCell?.rowIndex === nextRowIndex;

  if (prevHasEditing !== nextHasEditing) {
    return false;
  }

  // Re-render if editing column changed within this row
  if (nextHasEditing && prevHasEditing) {
    if (prev.editingCell?.columnId !== next.editingCell?.columnId) {
      return false;
    }
  }

  // Re-render if this row's selected cells changed
  // Using stable Set reference that only includes this row's cells
  if (prev.cellSelectionKeys !== next.cellSelectionKeys) {
    return false;
  }

  // Re-render if column visibility changed
  if (prev.columnVisibility !== next.columnVisibility) {
    return false;
  }

  // Re-render if row height changed
  if (prev.rowHeight !== next.rowHeight) {
    return false;
  }

  // Re-render if column pinning state changed
  if (prev.columnPinning !== next.columnPinning) {
    return false;
  }

  // Re-render if readOnly changed
  if (prev.readOnly !== next.readOnly) {
    return false;
  }

  // Re-render if search match columns changed for this row
  if (prev.searchMatchColumns !== next.searchMatchColumns) {
    return false;
  }

  // Re-render if active search match changed for this row
  if (prev.activeSearchMatch?.columnId !== next.activeSearchMatch?.columnId) {
    return false;
  }

  // Re-render if direction changed
  if (prev.dir !== next.dir) {
    return false;
  }

  // Re-render if adjustLayout state changed
  if (prev.adjustLayout !== next.adjustLayout) {
    return false;
  }

  // Re-render if stretchColumns changed
  if (prev.stretchColumns !== next.stretchColumns) {
    return false;
  }

  if (prev.rowReorderByHandle !== next.rowReorderByHandle) {
    return false;
  }

  // Skip re-render - props are equal
  return true;
}) as typeof DataGridRowImpl;

function DataGridRowImpl<TData>({
  row,
  tableMeta,
  virtualItem,
  measureElement,
  rowMapRef,
  rowHeight,
  columnVisibility,
  columnPinning,
  focusedCell,
  editingCell,
  cellSelectionKeys,
  searchMatchColumns,
  activeSearchMatch,
  dir,
  readOnly,
  stretchColumns,
  adjustLayout,
  rowReorderByHandle = false,
  className,
  style,
  ref,
  ...props
}: DataGridRowProps<TData>) {
  const virtualRowIndex = virtualItem.index;

  const onRowChange = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof virtualRowIndex === "undefined") return;

      if (node) {
        measureElement(node);
        rowMapRef.current?.set(virtualRowIndex, node);
      } else {
        rowMapRef.current?.delete(virtualRowIndex);
      }
    },
    [virtualRowIndex, measureElement, rowMapRef],
  );

  const rowRef = useComposedRefs(ref, onRowChange);

  const isRowSelected = row.getIsSelected();


  const visibleCells = React.useMemo(
    () => row.getVisibleCells(),
    [row, columnVisibility, columnPinning],
  );

  return (
    <div
      key={row.id}
      role="row"
      aria-rowindex={virtualRowIndex + 2}
      aria-selected={isRowSelected}
      data-index={virtualRowIndex}
      data-slot="grid-row"
      tabIndex={-1}
      {...props}
      ref={rowRef}
      className={cn(
        "absolute flex w-full border-b [content-visibility:auto]",
        !adjustLayout && "will-change-transform",
        rowReorderByHandle && "group/grid-row-reorder",
        className,
      )}
      style={{
        height: `${getRowHeightValue(rowHeight)}px`,
        ...(adjustLayout
          ? { top: `${virtualItem.start}px` }
          : { transform: `translateY(${virtualItem.start}px)` }),
        ...style,
      }}
    >
      {visibleCells.map((cell, colIndex) => {
        const columnId = cell.column.id;

        const mergeState: DataGridCellMergeState | null =
          typeof tableMeta?.getCellMergeState === "function"
            ? tableMeta.getCellMergeState(virtualRowIndex, columnId)
            : null;

        const isCoveredCell = mergeState?.kind === "covered";
        if (isCoveredCell) {
          return (
            <div
              key={cell.id}
              role="gridcell"
              aria-colindex={colIndex + 1}
              data-slot="grid-cell"
              tabIndex={-1}
              className={cn({
                grow: stretchColumns && columnId !== "select",
                "shrink-0": columnId === "select",
              })}
              style={{
                ...getColumnPinningStyle({ column: cell.column, dir }),
                ...getDataGridColumnWidthStyle({
                  column: cell.column,
                  cssVarName: `--col-${columnId}-size`,
                }),
                width: 0,
                minWidth: 0,
                maxWidth: 0,
                padding: 0,
                border: "none",
                overflow: "hidden",
                pointerEvents: "none",
                opacity: 0,
              }}
            />
          );
        }

        const isCellFocused =
          focusedCell?.rowIndex === virtualRowIndex &&
          focusedCell?.columnId === columnId;
        const isCellEditing =
          editingCell?.rowIndex === virtualRowIndex &&
          editingCell?.columnId === columnId;
        const isCellSelected =
          cellSelectionKeys?.has(getCellKey(virtualRowIndex, columnId)) ??
          false;

        const isSearchMatch = searchMatchColumns?.has(columnId) ?? false;
        const isActiveSearchMatch = activeSearchMatch?.columnId === columnId;

        const nextCell = visibleCells[colIndex + 1];
        const isLastColumn = colIndex === visibleCells.length - 1;
        const { showEndBorder, showStartBorder } = getColumnBorderVisibility({
          column: cell.column,
          nextColumn: nextCell?.column,
          isLastColumn,
        });

        return (
          <div
            key={cell.id}
            role="gridcell"
            aria-colindex={colIndex + 1}
            data-highlighted={isCellFocused ? "" : undefined}
            data-slot="grid-cell"
            tabIndex={-1}
            className={cn({
              grow: stretchColumns && columnId !== "select",
              "shrink-0": columnId === "select",
              "border-e": showEndBorder && columnId !== "select",
              "border-s": showStartBorder && columnId !== "select",
            })}
            style={{
              ...getColumnPinningStyle({ column: cell.column, dir }),
              ...getDataGridColumnWidthStyle({
                column: cell.column,
                cssVarName: `--col-${columnId}-size`,
              }),
              ...(mergeState?.kind === "anchor" && mergeState.widthCss
                ? {
                  width: mergeState.widthCss,
                  minWidth: mergeState.widthCss,
                  maxWidth: mergeState.widthCss,
                  position: "relative",
                  zIndex: 3,
                }
                : null),
            }}
          >
            {typeof cell.column.columnDef.header === "function" ? (
              <div
                className={cn(
                  "size-full",
                  columnId === "select" && rowReorderByHandle
                    ? "flex min-h-0 min-w-0 gap-0 py-1.5 ps-2 pe-0.5"
                    : "px-3 py-1.5",
                  {
                    "bg-primary/10": isRowSelected,
                  },
                )}
              >
                {columnId === "select" && rowReorderByHandle ? (
                  <>
                    <div className="flex min-h-0 min-w-0 flex-1 items-center overflow-hidden pe-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </div>
                    <RowReorderGrip />
                  </>
                ) : (
                  flexRender(cell.column.columnDef.cell, cell.getContext())
                )}
              </div>
            ) : columnId === "select" && rowReorderByHandle ? (
              <div className="flex h-full min-h-0 min-w-0 gap-0 px-2 py-1.5 pe-0.5">
                <div className="min-h-0 min-w-0 flex-1 overflow-hidden pe-1">
                  <DataGridCell
                    cell={cell}
                    tableMeta={tableMeta}
                    rowIndex={virtualRowIndex}
                    columnId={columnId}
                    rowHeight={rowHeight}
                    isFocused={isCellFocused}
                    isEditing={isCellEditing}
                    isSelected={isCellSelected}
                    isSearchMatch={isSearchMatch}
                    isActiveSearchMatch={isActiveSearchMatch}
                    readOnly={readOnly}
                  />
                </div>
                <RowReorderGrip />
              </div>
            ) : (
              <DataGridCell
                cell={cell}
                tableMeta={tableMeta}
                rowIndex={virtualRowIndex}
                columnId={columnId}
                rowHeight={rowHeight}
                isFocused={isCellFocused}
                isEditing={isCellEditing}
                isSelected={isCellSelected}
                isSearchMatch={isSearchMatch}
                isActiveSearchMatch={isActiveSearchMatch}
                readOnly={readOnly}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
