import type { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import type { CsvViewerRow } from "@/lib/csv-import";
import {
  createEmptyCsvViewerRow,
  getAccessorKeysFromColumnDefs,
} from "@/lib/csv-viewer";

describe("getAccessorKeysFromColumnDefs", () => {
  it("returns accessorKey strings in order", () => {
    const columns: ColumnDef<CsvViewerRow>[] = [
      { id: "a", accessorKey: "alpha", header: "A" },
      { id: "b", accessorKey: "beta", header: "B" },
    ];
    expect(getAccessorKeysFromColumnDefs(columns)).toEqual(["alpha", "beta"]);
  });

  it("skips columns without string accessorKey", () => {
    const columns = [
      { id: "select", header: "" },
      { id: "name", accessorKey: "name", header: "Name" },
    ] as ColumnDef<CsvViewerRow>[];
    expect(getAccessorKeysFromColumnDefs(columns)).toEqual(["name"]);
  });
});

describe("createEmptyCsvViewerRow", () => {
  it("assigns id and empty strings for each key", () => {
    const row = createEmptyCsvViewerRow(["a", "b"]);
    expect(typeof row.id).toBe("string");
    expect(row.id.length).toBeGreaterThan(0);
    expect(row.a).toBe("");
    expect(row.b).toBe("");
  });

  it("supports empty key list (id only)", () => {
    const row = createEmptyCsvViewerRow([]);
    expect(row.id).toBeDefined();
    expect(Object.keys(row)).toEqual(["id"]);
  });
});
