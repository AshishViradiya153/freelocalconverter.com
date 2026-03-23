"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const DEFAULT_DATA_GRID_PAGE_SIZE = 100;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500] as const;

interface DataGridPaginationProps<TData> {
  table: Table<TData>;
  className?: string;
}

export function DataGridPagination<TData>({
  table,
  className,
}: DataGridPaginationProps<TData>) {
  const preRows = table.getPrePaginationRowModel().rows;
  const preCount = preRows.length;
  const safePreCount = Math.max(preCount, 1);
  const pagination = table.getState().pagination;
  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;
  const pageCount = table.getPageCount();

  const isAllMode = preCount > 0 && pageSize >= preCount;

  const sizeSelectValue =
    preCount === 0
      ? "10"
      : isAllMode
        ? "all"
        : PAGE_SIZE_OPTIONS.includes(
              pageSize as (typeof PAGE_SIZE_OPTIONS)[number],
            )
          ? String(pageSize)
          : "10";

  const onPageSizeSelect = (value: string) => {
    if (value === "all") {
      table.setPageSize(safePreCount);
      table.setPageIndex(0);
      return;
    }
    const nextSize = Number(value);
    table.setPageSize(nextSize);
    const nextPageCount = Math.max(1, Math.ceil(safePreCount / nextSize));
    if (table.getState().pagination.pageIndex >= nextPageCount) {
      table.setPageIndex(nextPageCount - 1);
    }
  };

  const from = preCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to =
    preCount === 0 ? 0 : Math.min(preCount, pageIndex * pageSize + pageSize);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t pt-3",
        className,
      )}
    >
      <p className="text-muted-foreground text-sm">
        {preCount.toLocaleString()} row{preCount === 1 ? "" : "s"} in view
        {preCount > 0 ? (
          <>
            {" "}
            · Showing {from.toLocaleString()} to {to.toLocaleString()}
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-muted-foreground text-sm">
            Rows per page
          </span>
          <Select value={sizeSelectValue} onValueChange={onPageSizeSelect}>
            <SelectTrigger size="sm" className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => {
              table.previousPage();
            }}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-18 text-center text-muted-foreground text-sm tabular-nums">
            {pageCount < 1 ? "0 / 0" : `${pageIndex + 1} / ${pageCount}`}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => {
              table.nextPage();
            }}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
