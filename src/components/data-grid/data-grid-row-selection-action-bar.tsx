"use client";

import type { RowData, Table, TableMeta } from "@tanstack/react-table";
import { Copy, Eraser, Scissors, Trash2, X } from "lucide-react";
import * as React from "react";

import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from "@/components/ui/action-bar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataGridRowSelectionActionBarProps<TData extends RowData> {
  table: Table<TData>;
  tableMeta: TableMeta<TData>;
}

function IconActionTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function DataGridRowSelectionActionBar<TData extends RowData>({
  table,
  tableMeta,
}: DataGridRowSelectionActionBarProps<TData>) {
  const meta = tableMeta;
  const readOnly = Boolean(meta.readOnly);

  const onCopy = meta.onSelectedRowsCopy;
  const onCut = meta.onSelectedRowsCut;
  const onClearAll = meta.onSelectedRowsClearAll;
  const onDelete = meta.onSelectedRowsDelete;

  const selectedCount = table.getSelectedRowModel().flatRows.length;

  const showBar =
    selectedCount > 0 && Boolean(onCopy || onCut || onClearAll || onDelete);

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false);
        meta.onSelectionClear?.();
      }
    },
    [table, meta],
  );

  if (!showBar) {
    return null;
  }

  return (
    <ActionBar
      data-grid-popover
      open
      onOpenChange={onOpenChange}
    >
      <ActionBarSelection>
        <span className="font-medium">{selectedCount}</span>
        <span>
          {selectedCount === 1 ? "row" : "rows"} selected
        </span>
        <ActionBarSeparator />
        <IconActionTooltip label="Clear selection">
          <ActionBarClose aria-label="Clear selection">
            <X />
          </ActionBarClose>
        </IconActionTooltip>
      </ActionBarSelection>
      <ActionBarSeparator />
      <ActionBarGroup>
        {onCut ? (
          <IconActionTooltip label="Cut">
            <ActionBarItem
              variant="secondary"
              size="icon-sm"
              aria-label="Cut"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                void onCut();
              }}
            >
              <Scissors />
            </ActionBarItem>
          </IconActionTooltip>
        ) : null}
        {onCopy ? (
          <IconActionTooltip label="Copy">
            <ActionBarItem
              variant="secondary"
              size="icon-sm"
              aria-label="Copy"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                void onCopy();
              }}
            >
              <Copy />
            </ActionBarItem>
          </IconActionTooltip>
        ) : null}
        {onClearAll ? (
          <IconActionTooltip label="Clear all">
            <ActionBarItem
              variant="secondary"
              size="icon-sm"
              aria-label="Clear all"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                onClearAll();
              }}
            >
              <Eraser />
            </ActionBarItem>
          </IconActionTooltip>
        ) : null}
        {onDelete ? (
          <IconActionTooltip label="Delete">
            <ActionBarItem
              variant="destructive"
              size="icon-sm"
              aria-label="Delete"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                onDelete();
              }}
            >
              <Trash2 />
            </ActionBarItem>
          </IconActionTooltip>
        ) : null}
      </ActionBarGroup>
    </ActionBar>
  );
}
