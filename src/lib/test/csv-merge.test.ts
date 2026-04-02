import { describe, expect, it } from "vitest";
import { parseCsvText } from "@/lib/csv-import";
import {
  dedupeDuplicateValueColumns,
  dedupeMergedRows,
  mergeCsvImports,
  sourceRowMatchesBaseHeaders,
} from "@/lib/csv-merge";

describe("mergeCsvImports", () => {
  it("stacks rows from two files with matching headers", () => {
    const a = parseCsvText("Name,Score\nAlice,1\nBob,2", {});
    const b = parseCsvText("Name,Score\nCarol,3", {});
    const out = mergeCsvImports([{ result: a }, { result: b }]);
    expect(out.rows).toHaveLength(3);
    expect(out.headerLabels).toEqual(["Name", "Score"]);
    expect(out.rows[0]?.Name).toBe("Alice");
    expect(out.rows[2]?.Name).toBe("Carol");
    expect(out.truncated).toBe(false);
  });

  it("aligns columns by header label case-insensitively", () => {
    const a = parseCsvText("name,score\na,1", {});
    const b = parseCsvText("SCORE,Name\n2,B", {});
    const out = mergeCsvImports([{ result: a }, { result: b }]);
    expect(out.rows).toHaveLength(2);
    expect(String(out.rows[1]?.[out.columnKeys[0] ?? ""])).toBe("B");
  });

  it("fills missing columns with empty string", () => {
    const a = parseCsvText("A,B\n1,2", {});
    const b = parseCsvText("A\n3", {});
    const out = mergeCsvImports([{ result: a }, { result: b }]);
    expect(out.rows).toHaveLength(2);
    const bKey = out.columnKeys[1];
    expect(bKey).toBeDefined();
    expect(out.rows[1]?.[bKey as string]).toBe("");
  });

  it("skips repeated header row in subsequent files by default", () => {
    const a = parseCsvText("Name,Score\nAlice,1", {});
    const b = parseCsvText("Name,Score\nName,Score\nBob,2", {});
    const out = mergeCsvImports([{ result: a }, { result: b }]);
    expect(out.rows).toHaveLength(2);
    expect(String(out.rows[1]?.Name)).toBe("Bob");
  });

  it("keeps repeated header row when skip option is off", () => {
    const a = parseCsvText("Name,Score\nAlice,1", {});
    const b = parseCsvText("Name,Score\nName,Score\nBob,2", {});
    const out = mergeCsvImports([{ result: a }, { result: b }], {
      skipRepeatedHeaderRowsInSubsequentFiles: false,
    });
    expect(out.rows).toHaveLength(3);
  });

  it("dedupes identical rows when enabled", () => {
    const a = parseCsvText("A,B\n1,2\n1,2", {});
    const out = mergeCsvImports([{ result: a }], { dedupeRows: true });
    expect(out.rows).toHaveLength(1);
  });

  it("drops duplicate-value columns when enabled", () => {
    const a = parseCsvText("A,B,C\n1,1,x\n2,2,y", {});
    const out = mergeCsvImports([{ result: a }], {
      dedupeDuplicateColumns: true,
    });
    expect(out.columnKeys).toHaveLength(2);
    expect(out.headerLabels).toEqual(["A", "C"]);
  });

  it("prepends Index column when enabled", () => {
    const a = parseCsvText("A\nx\ny", {});
    const out = mergeCsvImports([{ result: a }], { addIndexColumn: true });
    expect(out.headerLabels[0]).toBe("Index");
    expect(String(out.rows[0]?.[out.columnKeys[0] ?? ""])).toBe("1");
    expect(String(out.rows[1]?.[out.columnKeys[0] ?? ""])).toBe("2");
  });
});

describe("sourceRowMatchesBaseHeaders", () => {
  it("detects header-like row", () => {
    const row = { id: "x", Name: "Name", Score: "Score" };
    const srcKeys = ["Name", "Score"];
    const baseLabels = ["Name", "Score"];
    expect(
      sourceRowMatchesBaseHeaders(row, srcKeys, baseLabels),
    ).toBe(true);
  });
});

describe("dedupeMergedRows", () => {
  it("preserves first occurrence order", () => {
    const keys = ["a", "b"];
    const rows = [
      { id: "1", a: "1", b: "2" },
      { id: "2", a: "1", b: "2" },
      { id: "3", a: "3", b: "4" },
    ];
    const out = dedupeMergedRows(rows, keys);
    expect(out).toHaveLength(2);
  });
});

describe("dedupeDuplicateValueColumns", () => {
  it("keeps first of identical columns", () => {
    const rows = [
      { id: "1", x: "a", y: "a" },
      { id: "2", x: "b", y: "b" },
    ];
    const r = dedupeDuplicateValueColumns(rows, ["x", "y"], ["X", "Y"]);
    expect(r.columnKeys).toEqual(["x"]);
    expect(r.headerLabels).toEqual(["X"]);
  });
});
