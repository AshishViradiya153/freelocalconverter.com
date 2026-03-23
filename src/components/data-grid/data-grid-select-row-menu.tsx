"use client";

import type { RowData, Table } from "@tanstack/react-table";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Eraser,
  Scissors,
  Trash2,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataGridSelectRowMenuProps<TData extends RowData> {
  table: Table<TData>;
  rowId: string;
}

export function DataGridSelectRowMenu<TData extends RowData>({
  table,
  rowId,
}: DataGridSelectRowMenuProps<TData>) {
  const meta = table.options.meta;
  const readOnly = Boolean(meta?.readOnly);

  const onRowInsertBefore = meta?.onRowInsertBefore;
  const onRowInsertAfter = meta?.onRowInsertAfter;
  const onRowCut = meta?.onRowCut;
  const onRowCopy = meta?.onRowCopy;
  const onRowPaste = meta?.onRowPaste;
  const onRowClearAll = meta?.onRowClearAll;
  const onRowDelete = meta?.onRowDelete;

  const show =
    onRowInsertBefore ||
    onRowInsertAfter ||
    onRowCut ||
    onRowCopy ||
    onRowPaste ||
    onRowClearAll ||
    onRowDelete;

  if (!show) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Row options"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={0} className="w-56">
        {onRowInsertBefore ? (
          <DropdownMenuItem
            className="[&_svg]:text-muted-foreground"
            disabled={readOnly}
            onSelect={() => {
              if (readOnly) return;
              onRowInsertBefore(rowId);
            }}
          >
            <ArrowUpToLine />
            Add row before
          </DropdownMenuItem>
        ) : null}
        {onRowInsertAfter ? (
          <DropdownMenuItem
            className="[&_svg]:text-muted-foreground"
            disabled={readOnly}
            onSelect={() => {
              if (readOnly) return;
              onRowInsertAfter(rowId);
            }}
          >
            <ArrowDownToLine />
            Add row after
          </DropdownMenuItem>
        ) : null}
        {onRowCut || onRowCopy || onRowPaste ? (
          <DropdownMenuSeparator />
        ) : null}
        {onRowCut ? (
          <DropdownMenuItem
            className="[&_svg]:text-muted-foreground"
            disabled={readOnly}
            onSelect={() => {
              if (readOnly) return;
              void onRowCut(rowId);
            }}
          >
            <Scissors />
            Cut
          </DropdownMenuItem>
        ) : null}
        {onRowCopy ? (
          <DropdownMenuItem
            className="[&_svg]:text-muted-foreground"
            onSelect={() => {
              void onRowCopy(rowId);
            }}
          >
            <Copy />
            Copy
          </DropdownMenuItem>
        ) : null}
        {onRowPaste ? (
          <DropdownMenuItem
            className="[&_svg]:text-muted-foreground"
            disabled={readOnly}
            onSelect={() => {
              if (readOnly) return;
              void onRowPaste(rowId);
            }}
          >
            <ClipboardPaste />
            Paste
          </DropdownMenuItem>
        ) : null}
        {onRowClearAll || onRowDelete ? <DropdownMenuSeparator /> : null}
        {onRowClearAll ? (
          <DropdownMenuItem
            className="[&_svg]:text-muted-foreground"
            disabled={readOnly}
            onSelect={() => {
              if (readOnly) return;
              onRowClearAll(rowId);
            }}
          >
            <Eraser />
            Clear all
          </DropdownMenuItem>
        ) : null}
        {onRowDelete ? (
          <DropdownMenuItem
            className="[&_svg]:text-destructive focus:text-destructive [&_svg]:text-destructive"
            disabled={readOnly}
            onSelect={() => {
              if (readOnly) return;
              onRowDelete(rowId);
            }}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
