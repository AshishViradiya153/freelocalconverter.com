import { describe, expect, it } from "vitest";
import { reorderRowsByStableIds } from "@/lib/reorder-rows-by-ids";

describe("reorderRowsByStableIds", () => {
  const rows = [
    { id: "a", v: 1 },
    { id: "b", v: 2 },
    { id: "c", v: 3 },
  ];
  const getId = (r: (typeof rows)[0]) => r.id;

  it("reorders by id list", () => {
    expect(reorderRowsByStableIds(rows, getId, ["c", "a", "b"])).toEqual([
      { id: "c", v: 3 },
      { id: "a", v: 1 },
      { id: "b", v: 2 },
    ]);
  });

  it("returns copy when order unchanged", () => {
    const next = reorderRowsByStableIds(rows, getId, ["a", "b", "c"]);
    expect(next).toEqual(rows);
    expect(next).not.toBe(rows);
  });

  it("returns copy when id missing from rows", () => {
    const next = reorderRowsByStableIds(rows, getId, ["a", "b", "x"]);
    expect(next).toEqual(rows);
    expect(next).not.toBe(rows);
  });

  it("returns copy when length mismatch", () => {
    expect(reorderRowsByStableIds(rows, getId, ["a", "b"])).toEqual(rows);
  });
});
