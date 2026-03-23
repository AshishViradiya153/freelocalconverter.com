"use client";

import type {
  ColumnSort,
  Header,
  SortDirection,
  SortingState,
  Table,
} from "@tanstack/react-table";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardPaste,
  Copy,
  Eraser,
  EyeOffIcon,
  PencilLine,
  PinIcon,
  PinOffIcon,
  Scissors,
  Trash2,
  XIcon,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getColumnVariant } from "@/lib/data-grid";
import { cn } from "@/lib/utils";

interface DataGridColumnHeaderProps<TData, TValue>
  extends React.ComponentProps<typeof DropdownMenuTrigger> {
  header: Header<TData, TValue>;
  table: Table<TData>;
  /** Placed after the menu trigger (e.g. column drag handle); not inside the trigger. */
  columnReorderHandleSlot?: React.ReactNode;
}

export function DataGridColumnHeader<TData, TValue>({
  header,
  table,
  className,
  onPointerDown,
  columnReorderHandleSlot,
  ...props
}: DataGridColumnHeaderProps<TData, TValue>) {
  const column = header.column;
  const metaLabel = column.columnDef.meta?.label;
  const label =
    typeof metaLabel === "string"
      ? metaLabel
      : typeof column.columnDef.header === "string"
        ? column.columnDef.header
        : column.id;

  const isAnyColumnResizing =
    table.getState().columnSizingInfo.isResizingColumn;

  const cellVariant = column.columnDef.meta?.cell;
  const columnVariant = getColumnVariant(cellVariant?.variant);

  const pinnedPosition = column.getIsPinned();
  const isPinnedLeft = pinnedPosition === "left";
  const isPinnedRight = pinnedPosition === "right";

  const onSortingChange = React.useCallback(
    (direction: SortDirection) => {
      table.setSorting((prev: SortingState) => {
        const existingSortIndex = prev.findIndex(
          (sort) => sort.id === column.id,
        );
        const newSort: ColumnSort = {
          id: column.id,
          desc: direction === "desc",
        };

        if (existingSortIndex >= 0) {
          const updated = [...prev];
          updated[existingSortIndex] = newSort;
          return updated;
        } else {
          return [...prev, newSort];
        }
      });
    },
    [column.id, table],
  );

  const onSortRemove = React.useCallback(() => {
    table.setSorting((prev: SortingState) =>
      prev.filter((sort) => sort.id !== column.id),
    );
  }, [column.id, table]);

  const onLeftPin = React.useCallback(() => {
    column.pin("left");
  }, [column]);

  const onRightPin = React.useCallback(() => {
    column.pin("right");
  }, [column]);

  const onUnpin = React.useCallback(() => {
    column.pin(false);
  }, [column]);

  const onTriggerPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);
      if (event.defaultPrevented) return;

      if (event.button !== 0) {
        return;
      }
      table.options.meta?.onColumnClick?.(column.id);
    },
    [table.options.meta, column.id, onPointerDown],
  );

  const meta = table.options.meta;
  const readOnly = Boolean(meta?.readOnly);
  const onColInsertBefore = meta?.onColumnInsertBefore;
  const onColInsertAfter = meta?.onColumnInsertAfter;
  const onColCut = meta?.onColumnCut;
  const onColCopy = meta?.onColumnCopy;
  const onColPaste = meta?.onColumnPaste;
  const onColClearAll = meta?.onColumnClearAll;
  const onColDelete = meta?.onColumnDelete;
  const onColRename = meta?.onColumnRename;
  const [renameOpen, setRenameOpen] = React.useState(false);
  const showColumnActions =
    column.id !== "select" &&
    Boolean(
      onColRename ||
        onColInsertBefore ||
        onColInsertAfter ||
        onColCut ||
        onColCopy ||
        onColPaste ||
        onColClearAll ||
        onColDelete,
    );
  return (
    <>
      <div className="relative flex min-w-0 flex-1 items-stretch gap-0">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            className={cn(
              "flex min-w-0 flex-1 items-center justify-between gap-2 p-2 text-sm hover:bg-accent/40 data-[state=open]:bg-accent/40 [&_svg]:size-4",
              isAnyColumnResizing && "pointer-events-none",
              className,
            )}
            onPointerDown={onTriggerPointerDown}
            {...props}
          >
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              {columnVariant && (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <columnVariant.icon className="size-3.5 shrink-0 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{columnVariant.label}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <span className="truncate">{label}</span>
            </div>
            <ChevronDownIcon className="shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={0} className="w-60">
            {column.getCanSort() && (
              <>
                <DropdownMenuCheckboxItem
                  className="relative ltr:pr-8 ltr:pl-2 rtl:pr-2 rtl:pl-8 [&>span:first-child]:ltr:right-2 [&>span:first-child]:ltr:left-auto [&>span:first-child]:rtl:right-auto [&>span:first-child]:rtl:left-2 [&_svg]:text-muted-foreground"
                  checked={column.getIsSorted() === "asc"}
                  onSelect={() => onSortingChange("asc")}
                >
                  <ChevronUpIcon />
                  Sort asc
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  className="relative ltr:pr-8 ltr:pl-2 rtl:pr-2 rtl:pl-8 [&>span:first-child]:ltr:right-2 [&>span:first-child]:ltr:left-auto [&>span:first-child]:rtl:right-auto [&>span:first-child]:rtl:left-2 [&_svg]:text-muted-foreground"
                  checked={column.getIsSorted() === "desc"}
                  onSelect={() => onSortingChange("desc")}
                >
                  <ChevronDownIcon />
                  Sort desc
                </DropdownMenuCheckboxItem>
                {column.getIsSorted() && (
                  <DropdownMenuItem onSelect={onSortRemove}>
                    <XIcon />
                    Remove sort
                  </DropdownMenuItem>
                )}
              </>
            )}
            {column.getCanPin() && (
              <>
                {column.getCanSort() && <DropdownMenuSeparator />}

                {isPinnedLeft ? (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    onSelect={onUnpin}
                  >
                    <PinOffIcon />
                    Unpin from left
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    onSelect={onLeftPin}
                  >
                    <PinIcon />
                    Pin to left
                  </DropdownMenuItem>
                )}
                {isPinnedRight ? (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    onSelect={onUnpin}
                  >
                    <PinOffIcon />
                    Unpin from right
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    onSelect={onRightPin}
                  >
                    <PinIcon />
                    Pin to right
                  </DropdownMenuItem>
                )}
              </>
            )}
            {showColumnActions && (
              <>
                {(column.getCanSort() || column.getCanPin()) && (
                  <DropdownMenuSeparator />
                )}
                {onColRename ? (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    disabled={readOnly}
                    onSelect={() => {
                      if (readOnly) return;
                      setRenameOpen(true);
                    }}
                  >
                    <PencilLine />
                    Rename
                  </DropdownMenuItem>
                ) : null}
                {onColInsertBefore ? (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    disabled={readOnly}
                    onSelect={() => {
                      if (readOnly) return;
                      onColInsertBefore(column.id);
                    }}
                  >
                    <ArrowLeftToLine />
                    Add column before
                  </DropdownMenuItem>
                ) : null}
                {onColInsertAfter ? (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    disabled={readOnly}
                    onSelect={() => {
                      if (readOnly) return;
                      onColInsertAfter(column.id);
                    }}
                  >
                    <ArrowRightToLine />
                    Add column after
                  </DropdownMenuItem>
                ) : null}
                {onColCut || onColCopy || onColPaste ? (
                  <DropdownMenuSeparator />
                ) : null}
                {onColCut ? (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    disabled={readOnly}
                    onSelect={() => {
                      if (readOnly) return;
                      void onColCut(column.id);
                    }}
                  >
                    <Scissors />
                    Cut
                  </DropdownMenuItem>
                ) : null}
                {onColCopy ? (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    onSelect={() => {
                      void onColCopy(column.id);
                    }}
                  >
                    <Copy />
                    Copy
                  </DropdownMenuItem>
                ) : null}
                {onColPaste ? (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    disabled={readOnly}
                    onSelect={() => {
                      if (readOnly) return;
                      void onColPaste(column.id);
                    }}
                  >
                    <ClipboardPaste />
                    Paste
                  </DropdownMenuItem>
                ) : null}
                {onColClearAll || onColDelete ? (
                  <DropdownMenuSeparator />
                ) : null}
                {onColClearAll ? (
                  <DropdownMenuItem
                    className="[&_svg]:text-muted-foreground"
                    disabled={readOnly}
                    onSelect={() => {
                      if (readOnly) return;
                      onColClearAll(column.id);
                    }}
                  >
                    <Eraser />
                    Clear all
                  </DropdownMenuItem>
                ) : null}
                {onColDelete ? (
                  <DropdownMenuItem
                    className="focus:text-destructive [&_svg]:text-destructive [&_svg]:text-destructive"
                    disabled={readOnly}
                    onSelect={() => {
                      if (readOnly) return;
                      onColDelete(column.id);
                    }}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                ) : null}
              </>
            )}
            {column.getCanHide() && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onSelect={() => column.toggleVisibility(false)}
                >
                  <EyeOffIcon />
                  Hide column
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {columnReorderHandleSlot}
        {header.column.getCanResize() && (
          <DataGridColumnResizer header={header} table={table} label={label} />
        )}
      </div>
      {onColRename ? (
        <DataGridColumnRenameDialog
          open={renameOpen}
          onOpenChange={setRenameOpen}
          columnId={column.id}
          initialLabel={label}
          readOnly={readOnly}
          onRename={onColRename}
        />
      ) : null}
    </>
  );
}

interface DataGridColumnRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  initialLabel: string;
  readOnly: boolean;
  onRename: (columnId: string, newHeaderLabel: string) => void;
}

function DataGridColumnRenameDialog({
  open,
  onOpenChange,
  columnId,
  initialLabel,
  readOnly,
  onRename,
}: DataGridColumnRenameDialogProps) {
  const [draft, setDraft] = React.useState(initialLabel);

  React.useEffect(() => {
    if (open) setDraft(initialLabel);
  }, [open, initialLabel]);

  const onFormSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (readOnly) return;
      onRename(columnId, draft);
      onOpenChange(false);
    },
    [readOnly, onRename, columnId, draft, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onFormSubmit}>
          <DialogHeader>
            <DialogTitle>Rename column</DialogTitle>
            <DialogDescription>
              Change the header label for this column. You can leave it empty.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="mt-1"
            aria-label="Column header"
          />
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={readOnly}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const DataGridColumnResizer = React.memo(
  DataGridColumnResizerImpl,
  (prev, next) => {
    const prevColumn = prev.header.column;
    const nextColumn = next.header.column;

    if (
      prevColumn.getIsResizing() !== nextColumn.getIsResizing() ||
      prevColumn.getSize() !== nextColumn.getSize()
    ) {
      return false;
    }

    if (prev.label !== next.label) return false;

    return true;
  },
) as typeof DataGridColumnResizerImpl;

interface DataGridColumnResizerProps<TData, TValue>
  extends DataGridColumnHeaderProps<TData, TValue> {
  label: string;
}

function DataGridColumnResizerImpl<TData, TValue>({
  header,
  table,
  label,
}: DataGridColumnResizerProps<TData, TValue>) {
  const defaultColumnDef = table._getDefaultColumnDef();
  const resizeAriaName = label.trim() !== "" ? label : header.column.id;

  const onDoubleClick = React.useCallback(() => {
    header.column.resetSize();
  }, [header.column]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${resizeAriaName} column`}
      aria-valuenow={header.column.getSize()}
      aria-valuemin={defaultColumnDef.minSize}
      aria-valuemax={defaultColumnDef.maxSize}
      tabIndex={0}
      className={cn(
        "absolute -end-px top-0 z-50 h-full w-0.5 cursor-ew-resize touch-none select-none bg-border transition-opacity after:absolute after:inset-y-0 after:start-1/2 after:h-full after:w-[18px] after:-translate-x-1/2 after:content-[''] hover:bg-primary focus:bg-primary focus:outline-none",
        header.column.getIsResizing()
          ? "bg-primary"
          : "opacity-0 hover:opacity-100",
      )}
      onDoubleClick={onDoubleClick}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
    />
  );
}
