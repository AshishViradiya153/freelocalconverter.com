import { describe, expect, it } from "vitest";
import type { CsvViewerSession } from "@/lib/csv-viewer-session";
import {
  alignSessionsByKeyColumn,
  buildCompareDiffReportCsv,
  buildDiffHighlightSets,
  computeCsvCompareStats,
  defaultCompareEqualityOptions,
  filterSessionToRowIndices,
  normalizeCellForCompare,
  prepareCompareWorkSessions,
  reorderRightSessionToMatchLeft,
} from "@/lib/csv-compare";

function sessionFromRows(
  columnKeys: string[],
  headerLabels: string[],
  rows: Record<string, string>[],
  fileName: string,
): CsvViewerSession {
  return {
    version: 1,
    fileName,
    dir: "ltr",
    columnKeys,
    headerLabels,
    columnKinds: columnKeys.map(() => "short-text"),
    rows: rows.map((r, i) => ({
      id: `id-${i}`,
      ...r,
    })),
    truncated: false,
    rowCountBeforeCap: rows.length,
    importedRowCount: rows.length,
  };
}

describe("computeCsvCompareStats", () => {
  it("detects identical files", () => {
    const cols = ["a", "b"];
    const labels = ["A", "B"];
    const left = sessionFromRows(
      cols,
      labels,
      [
        { a: "1", b: "x" },
        { a: "2", b: "y" },
      ],
      "a.csv",
    );
    const right = sessionFromRows(
      cols,
      labels,
      [
        { a: "1", b: "x" },
        { a: "2", b: "y" },
      ],
      "b.csv",
    );
    const s = computeCsvCompareStats(left, right);
    expect(s.identicalColumnStructure).toBe(true);
    expect(s.differingCells).toBe(0);
    expect(s.rowsWithDifferences).toBe(0);
    expect(s.differingRowIndices).toEqual([]);
  });

  it("counts cell and row diffs when structure matches", () => {
    const cols = ["a", "b"];
    const labels = ["A", "B"];
    const left = sessionFromRows(
      cols,
      labels,
      [
        { a: "1", b: "x" },
        { a: "2", b: "y" },
      ],
      "a.csv",
    );
    const right = sessionFromRows(
      cols,
      labels,
      [
        { a: "1", b: "changed" },
        { a: "2", b: "y" },
      ],
      "b.csv",
    );
    const s = computeCsvCompareStats(left, right);
    expect(s.differingCells).toBe(1);
    expect(s.rowsWithDifferences).toBe(1);
    expect(s.differingRowIndices).toEqual([0]);
  });

  it("treats extra rows on one side as differing", () => {
    const cols = ["a"];
    const labels = ["A"];
    const left = sessionFromRows(cols, labels, [{ a: "1" }], "a.csv");
    const right = sessionFromRows(
      cols,
      labels,
      [
        { a: "1" },
        { a: "2" },
      ],
      "b.csv",
    );
    const s = computeCsvCompareStats(left, right);
    expect(s.differingCells).toBe(1);
    expect(s.rowsWithDifferences).toBe(1);
    expect(s.differingRowIndices).toEqual([1]);
  });

  it("returns no cell compare when column structure differs", () => {
    const left = sessionFromRows(["a"], ["A"], [{ a: "1" }], "a.csv");
    const right = sessionFromRows(["b"], ["B"], [{ b: "1" }], "b.csv");
    const s = computeCsvCompareStats(left, right);
    expect(s.canCompareCells).toBe(false);
    expect(s.identicalColumnStructure).toBe(false);
    expect(s.differingRowIndices).toEqual([]);
  });
});

describe("filterSessionToRowIndices", () => {
  it("fills missing indices with empty rows", () => {
    const s = sessionFromRows(["a"], ["A"], [{ a: "1" }], "one.csv");
    const out = filterSessionToRowIndices(s, [0, 1]);
    expect(out.rows).toHaveLength(2);
    expect(out.rows[0]?.a).toBe("1");
    expect(out.rows[1]?.a).toBe("");
  });
});

describe("normalizeCellForCompare", () => {
  it("trims and lowercases when options enabled", () => {
    const opts = { trimWhitespace: true, ignoreCase: true };
    expect(normalizeCellForCompare("  Ab ", opts)).toBe("ab");
  });
});

describe("prepareCompareWorkSessions", () => {
  it("reorders columns when keys match in different order", () => {
    const left = sessionFromRows(
      ["a", "b"],
      ["A", "B"],
      [{ a: "1", b: "x" }],
      "l.csv",
    );
    const right = sessionFromRows(
      ["b", "a"],
      ["B", "A"],
      [{ b: "x", a: "1" }],
      "r.csv",
    );
    const { workLeft, workRight, comparable } = prepareCompareWorkSessions(
      left,
      right,
      {
        matchColumnsByName: true,
        alignRows: "index",
        alignKeyColumn: "a",
        equality: defaultCompareEqualityOptions,
      },
    );
    expect(comparable).toBe(true);
    expect(workRight.columnKeys).toEqual(["a", "b"]);
    expect(workRight.rows[0]?.a).toBe("1");
    expect(workRight.rows[0]?.b).toBe("x");
    expect(workLeft.columnKeys).toEqual(workRight.columnKeys);
  });

  it("is not comparable when same keys but reorder matching is off", () => {
    const left = sessionFromRows(
      ["a", "b"],
      ["A", "B"],
      [{ a: "1", b: "x" }],
      "l.csv",
    );
    const right = sessionFromRows(
      ["b", "a"],
      ["B", "A"],
      [{ b: "x", a: "1" }],
      "r.csv",
    );
    const { comparable } = prepareCompareWorkSessions(left, right, {
      matchColumnsByName: false,
      alignRows: "index",
      alignKeyColumn: "a",
      equality: defaultCompareEqualityOptions,
    });
    expect(comparable).toBe(false);
  });
});

describe("reorderRightSessionToMatchLeft", () => {
  it("aligns right column order to left keys", () => {
    const left = sessionFromRows(["x", "y"], ["X", "Y"], [], "l.csv");
    const right = sessionFromRows(
      ["y", "x"],
      ["Y", "X"],
      [{ y: "2", x: "1" }],
      "r.csv",
    );
    const out = reorderRightSessionToMatchLeft(left, right);
    expect(out.columnKeys).toEqual(["x", "y"]);
    expect(out.rows[0]?.x).toBe("1");
    expect(out.rows[0]?.y).toBe("2");
  });
});

describe("alignSessionsByKeyColumn", () => {
  it("pairs rows by key value regardless of source order", () => {
    const left = sessionFromRows(
      ["id", "v"],
      ["Id", "V"],
      [
        { id: "a", v: "1" },
        { id: "b", v: "2" },
      ],
      "l.csv",
    );
    const right = sessionFromRows(
      ["id", "v"],
      ["Id", "V"],
      [
        { id: "b", v: "x" },
        { id: "a", v: "y" },
      ],
      "r.csv",
    );
    const { alignedLeft, alignedRight } = alignSessionsByKeyColumn(
      left,
      right,
      "id",
      defaultCompareEqualityOptions,
    );
    expect(alignedLeft.rows).toHaveLength(2);
    expect(alignedRight.rows[0]?.v).toBe("y");
    expect(alignedRight.rows[1]?.v).toBe("x");
  });
});

describe("buildDiffHighlightSets", () => {
  it("marks both sides when a cell differs", () => {
    const left = sessionFromRows(["a"], ["A"], [{ a: "1" }], "l.csv");
    const right = sessionFromRows(["a"], ["A"], [{ a: "2" }], "r.csv");
    const { left: L, right: R } = buildDiffHighlightSets(
      left,
      right,
      defaultCompareEqualityOptions,
    );
    const lid = left.rows[0]?.id ?? "";
    const rid = right.rows[0]?.id ?? "";
    expect(L.has(`${lid}\ta`)).toBe(true);
    expect(R.has(`${rid}\ta`)).toBe(true);
  });
});

describe("buildCompareDiffReportCsv", () => {
  it("includes header and one row per differing cell", () => {
    const left = sessionFromRows(["a"], ["A"], [{ a: "1" }], "l.csv");
    const right = sessionFromRows(["a"], ["A"], [{ a: "2" }], "r.csv");
    const csv = buildCompareDiffReportCsv(
      left,
      right,
      defaultCompareEqualityOptions,
    );
    expect(csv.startsWith("row_index,column,left_value,right_value")).toBe(
      true,
    );
    expect(csv).toContain("A");
    expect(csv).toContain("1");
    expect(csv).toContain("2");
  });
});
