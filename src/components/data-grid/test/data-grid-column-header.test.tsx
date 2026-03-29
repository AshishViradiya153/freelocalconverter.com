import type { ColumnDef, Header } from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { DataGridColumnHeader } from "@/components/data-grid/data-grid-column-header";

function ColumnHeaderHarness({ meta }: { meta?: Record<string, unknown> }) {
  const columns = React.useMemo<ColumnDef<{ name: string }>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Label",
        enableSorting: true,
        enablePinning: true,
        enableHiding: true,
      },
    ],
    [],
  );
  const table = useReactTable({
    data: [{ name: "x" }],
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: meta as never,
  });
  const header = table.getHeaderGroups()[0]?.headers[0] as Header<
    { name: string },
    unknown
  >;
  return <DataGridColumnHeader header={header} table={table} />;
}

describe("DataGridColumnHeader", () => {
  it("renders column actions when meta handlers are provided", async () => {
    const onColumnInsertBefore = vi.fn();
    render(
      <ColumnHeaderHarness
        meta={{
          readOnly: false,
          onColumnRename: vi.fn(),
          onColumnInsertBefore,
          onColumnInsertAfter: vi.fn(),
          onColumnCopy: vi.fn(),
          onColumnCut: vi.fn(),
          onColumnPaste: vi.fn(),
          onColumnClearAll: vi.fn(),
          onColumnDelete: vi.fn(),
        }}
      />,
    );

    const trigger = screen.getByRole("button", { name: /label/i });
    fireEvent.pointerDown(trigger, { button: 0 });

    await waitFor(() => {
      expect(screen.getByText("Rename")).toBeTruthy();
    });
    expect(screen.getByText("Add column before")).toBeTruthy();
    expect(screen.getByText("Hide column")).toBeTruthy();
  });

  it("does not show column actions for the select column id", async () => {
    const columns: ColumnDef<{ name: string }>[] = [
      {
        id: "select",
        accessorKey: "name",
        header: "Sel",
        enableSorting: false,
        enablePinning: false,
        enableHiding: false,
      },
    ];
    function SelectHarness() {
      const table = useReactTable({
        data: [{ name: "x" }],
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
          readOnly: false,
          onColumnInsertBefore: vi.fn(),
          onColumnInsertAfter: vi.fn(),
          onColumnCopy: vi.fn(),
        } as never,
      });
      const header = table.getHeaderGroups()[0]?.headers[0] as Header<
        { name: string },
        unknown
      >;
      return <DataGridColumnHeader header={header} table={table} />;
    }

    render(<SelectHarness />);
    fireEvent.pointerDown(screen.getByRole("button", { name: /sel/i }), {
      button: 0,
    });

    await waitFor(() => {
      expect(screen.queryByText("Add column before")).toBeNull();
    });
  });
});
