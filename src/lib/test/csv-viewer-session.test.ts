import { describe, expect, it } from "vitest";
import { parseCsvText } from "@/lib/csv-import";
import { createEmptyCsvViewerRow } from "@/lib/csv-viewer";
import {
  clearCsvSessionColumnValues,
  cloneCsvViewerSession,
  insertCsvSessionColumnWithDataAt,
  insertCsvSessionRowsAfter,
  insertEmptyCsvSessionColumnAt,
  insertEmptyCsvSessionRowAt,
  mergeRowsIntoSession,
  newCsvViewerColumnKey,
  normalizeCsvViewerSessionForLoad,
  removeCsvSessionColumn,
  removeCsvSessionRowById,
  renameCsvSessionColumnHeader,
  reorderCsvSessionColumnKeys,
  resultToSession,
  sessionToResult,
} from "@/lib/csv-viewer-session";
import {
  makeCsvCellMerge,
  mergeCsvCellsAnyway,
  tryAddCsvCellMerge,
} from "@/lib/csv-cell-merges";

describe("csv-viewer-session", () => {
  it("round-trips parse result through session", () => {
    const r = parseCsvText("a,b\n1,2");
    const s = resultToSession("t.csv", r, "ltr");
    const again = sessionToResult(s);
    expect(again.rows).toEqual(r.rows);
    expect(again.headerLabels).toEqual(r.headerLabels);
    expect(again.columns.map((c) => c.id)).toEqual(["a", "b"]);
    expect(again.truncated).toBe(false);
  });

  it("normalizeCsvViewerSessionForLoad pads labels and kinds", () => {
    const n = normalizeCsvViewerSessionForLoad({
      version: 2,
      fileName: "t.csv",
      dir: "ltr",
      columnKeys: ["a", "b"],
      headerLabels: ["A"],
      columnKinds: ["short-text"],
      rows: [{ id: "r1", a: "1", b: "2" }],
      truncated: false,
      rowCountBeforeCap: 1,
      importedRowCount: 1,
    });
    expect(n?.headerLabels).toEqual(["A", "b"]);
    expect(n?.columnKinds).toEqual(["short-text", "short-text"]);
  });

  it("normalizeCsvViewerSessionForLoad returns null for invalid keys", () => {
    expect(
      normalizeCsvViewerSessionForLoad({
        version: 2,
        fileName: "t.csv",
        dir: "ltr",
        columnKeys: ["", "b"],
        headerLabels: ["", "B"],
        columnKinds: ["short-text", "short-text"],
        rows: [{ id: "1" }],
        truncated: false,
        rowCountBeforeCap: 1,
        importedRowCount: 1,
      }),
    ).toBeNull();
  });

  it("mergeRowsIntoSession appends new column keys from row data", () => {
    const r = parseCsvText("x\n1");
    const s = resultToSession("t.csv", r);
    const withNew = mergeRowsIntoSession(s, [
      { ...s.rows[0], new_col: "hi" } as (typeof s.rows)[0],
    ]);
    expect(withNew.columnKeys).toContain("new_col");
    expect(withNew.headerLabels.at(-1)).toBe("new_col");
    expect(withNew.columnKinds.at(-1)).toBe("short-text");
    const rebuilt = sessionToResult(withNew);
    expect(rebuilt.columns.map((c) => c.id)).toContain("new_col");
  });

  it("insertEmptyCsvSessionColumnAt splices schema, empty header, and empty cells", () => {
    const r = parseCsvText("a,b\n1,2");
    const s = resultToSession("t.csv", r, "ltr");
    const next = insertEmptyCsvSessionColumnAt(s, 1);
    expect(next.columnKeys).toHaveLength(3);
    expect(next.headerLabels).toHaveLength(3);
    expect(next.headerLabels[1]).toBe("");
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0]?.[next.columnKeys[1] ?? ""]).toBe("");
  });

  it("removeCsvSessionColumn drops key from rows", () => {
    const r = parseCsvText("a,b\n1,2");
    const s = resultToSession("t.csv", r, "ltr");
    const key = s.columnKeys[0];
    if (!key) throw new Error("fixture: expected column key");
    const next = removeCsvSessionColumn(s, key);
    expect(next?.columnKeys).toHaveLength(1);
    expect(Object.keys(next?.rows[0] ?? {})).not.toContain(key);
  });

  it("removeCsvSessionColumn returns null for last column", () => {
    const r = parseCsvText("a\n1");
    const s = resultToSession("t.csv", r, "ltr");
    const onlyKey = s.columnKeys[0];
    if (!onlyKey) throw new Error("fixture: expected one column");
    expect(removeCsvSessionColumn(s, onlyKey)).toBeNull();
  });

  it("renameCsvSessionColumnHeader updates label at index", () => {
    const r = parseCsvText("a,b\n1,2");
    const s = resultToSession("t.csv", r, "ltr");
    const key = s.columnKeys[0];
    if (!key) throw new Error("fixture: expected column key");
    const next = renameCsvSessionColumnHeader(s, key, "Alpha");
    expect(next?.headerLabels[0]).toBe("Alpha");
    expect(next?.columnKeys).toEqual(s.columnKeys);
  });

  it("renameCsvSessionColumnHeader returns null for unknown key", () => {
    const r = parseCsvText("a\n1");
    const s = resultToSession("t.csv", r, "ltr");
    expect(renameCsvSessionColumnHeader(s, "missing", "x")).toBeNull();
  });

  it("clearCsvSessionColumnValues clears cells only", () => {
    const r = parseCsvText("a,b\n1,2");
    const s = resultToSession("t.csv", r, "ltr");
    const key = s.columnKeys[0];
    if (!key) throw new Error("fixture: expected column key");
    const next = clearCsvSessionColumnValues(s, key);
    expect(next.rows[0]?.[key]).toBe("");
    expect(next.columnKeys).toEqual(s.columnKeys);
  });

  it("insertCsvSessionColumnWithDataAt pads values", () => {
    const r = parseCsvText("a,b\n1,2");
    const s = resultToSession("t.csv", r, "ltr");
    const next = insertCsvSessionColumnWithDataAt(s, 0, {
      key: "z",
      headerLabel: "Z",
      kind: "short-text",
      cellValues: ["x"],
    });
    expect(next.columnKeys[0]).toBe("z");
    expect(next.rows[0]?.z).toBe("x");
  });

  it("insertEmptyCsvSessionRowAt splices a new empty row", () => {
    const r = parseCsvText("a\n1");
    const s = resultToSession("t.csv", r, "ltr");
    const next = insertEmptyCsvSessionRowAt(s, 0);
    expect(next.rows).toHaveLength(2);
    expect(next.rows[0]?.id).not.toBe(next.rows[1]?.id);
    expect(next.rows[0]?.a).toBe("");
  });

  it("removeCsvSessionRowById removes one row", () => {
    const r = parseCsvText("a,b\n1,2\n3,4");
    const s = resultToSession("t.csv", r, "ltr");
    const id = s.rows[0]?.id;
    if (!id) throw new Error("fixture: expected row id");
    const next = removeCsvSessionRowById(s, id);
    expect(next?.rows).toHaveLength(1);
  });

  it("insertCsvSessionRowsAfter inserts after anchor id", () => {
    const r = parseCsvText("a\n1");
    const s = resultToSession("t.csv", r, "ltr");
    const id = s.rows[0]?.id;
    if (!id) throw new Error("fixture: expected row id");
    const extra = [
      { ...createEmptyCsvViewerRow(s.columnKeys), id: "new1", a: "x" },
    ];
    const next = insertCsvSessionRowsAfter(s, id, extra);
    expect(next?.rows).toHaveLength(2);
    expect(next?.rows[1]?.a).toBe("x");
  });

  it("newCsvViewerColumnKey returns unique col_ prefixed ids", () => {
    const a = newCsvViewerColumnKey();
    const b = newCsvViewerColumnKey();
    expect(a.startsWith("col_")).toBe(true);
    expect(b.startsWith("col_")).toBe(true);
    expect(a).not.toBe(b);
  });

  it("cloneCsvViewerSession deep-copies rows", () => {
    const r = parseCsvText("a\n1");
    const s = resultToSession("t.csv", r, "ltr");
    const before = s.rows[0]?.a;
    const c = cloneCsvViewerSession(s);
    const clonedFirst = c.rows[0];
    if (!clonedFirst) throw new Error("fixture: expected one row");
    clonedFirst.a = "9";
    expect(c.rows[0]?.a).toBe("9");
    expect(s.rows[0]?.a).toBe(before);
  });

  it("reorderCsvSessionColumnKeys permutes labels and kinds with keys", () => {
    const r = parseCsvText("a,b,c\n1,2,3");
    const s = resultToSession("t.csv", r, "ltr");
    const keys = s.columnKeys;
    expect(keys).toHaveLength(3);
    const labelByKey = Object.fromEntries(
      keys.map((k, i) => [k, s.headerLabels[i]]),
    );
    const kindByKey = Object.fromEntries(
      keys.map((k, i) => [k, s.columnKinds[i]]),
    );
    const [colA, colB, colC] = keys;
    if (colA === undefined || colB === undefined || colC === undefined) {
      throw new Error("fixture: expected three columns");
    }
    const next = reorderCsvSessionColumnKeys(s, [colC, colA, colB]);
    expect(next.columnKeys).toEqual([colC, colA, colB]);
    expect(next.headerLabels).toEqual([
      labelByKey[colC],
      labelByKey[colA],
      labelByKey[colB],
    ]);
    expect(next.columnKinds).toEqual([
      kindByKey[colC],
      kindByKey[colA],
      kindByKey[colB],
    ]);
    expect(next.rows).toEqual(s.rows);
  });

  it("removes merges when deleting a merged column", () => {
    const r = parseCsvText("a,b\n1,2\n3,4");
    let s = resultToSession("t.csv", r, "ltr");
    const [a, b] = s.columnKeys;
    const [r1, r2] = s.rows.map((x) => x.id);
    if (!a || !b || !r1 || !r2) throw new Error("fixture");

    const orderedRowIds = s.rows.map((x) => x.id);
    const merge = makeCsvCellMerge({
      startRowId: r1,
      endRowId: r1,
      startColumnId: a,
      endColumnId: b,
    });
    const attempt = tryAddCsvCellMerge({ session: s, merge, orderedRowIds });
    if (!attempt.ok) throw new Error("fixture merge failed");
    s = attempt.session;
    expect(s.cellMerges?.length).toBe(1);

    const removed = removeCsvSessionColumn(s, a);
    expect(removed).not.toBeNull();
    expect(removed?.cellMerges?.length ?? 0).toBe(0);
  });

  it("removes merges when deleting a merged row", () => {
    const r = parseCsvText("a,b\n1,2\n3,4");
    let s = resultToSession("t.csv", r, "ltr");
    const [a, b] = s.columnKeys;
    const [r1, r2] = s.rows.map((x) => x.id);
    if (!a || !b || !r1 || !r2) throw new Error("fixture");

    const orderedRowIds = s.rows.map((x) => x.id);
    const merge = makeCsvCellMerge({
      startRowId: r1,
      endRowId: r1,
      startColumnId: a,
      endColumnId: b,
    });
    const attempt = tryAddCsvCellMerge({ session: s, merge, orderedRowIds });
    if (!attempt.ok) throw new Error("fixture merge failed");
    s = attempt.session;
    expect(s.cellMerges?.length).toBe(1);

    const removed = removeCsvSessionRowById(s, r1);
    expect(removed).not.toBeNull();
    expect(removed?.cellMerges?.length ?? 0).toBe(0);
  });

  it("mergeCsvCellsAnyway replaces intersecting merges", () => {
    const r = parseCsvText("a,b,c,d\n1,2,3,4\n5,6,7,8");
    let s = resultToSession("t.csv", r, "ltr");
    const [a, b, c, d] = s.columnKeys;
    const [r1] = s.rows.map((x) => x.id);
    if (!a || !b || !c || !d || !r1) throw new Error("fixture");

    const orderedRowIds = s.rows.map((x) => x.id);
    const m1 = makeCsvCellMerge({
      startRowId: r1,
      endRowId: r1,
      startColumnId: a,
      endColumnId: b,
    });
    const m2 = makeCsvCellMerge({
      startRowId: r1,
      endRowId: r1,
      startColumnId: c,
      endColumnId: d,
    });

    const a1 = tryAddCsvCellMerge({ session: s, merge: m1, orderedRowIds });
    if (!a1.ok) throw new Error("fixture m1");
    const a2 = tryAddCsvCellMerge({ session: a1.session, merge: m2, orderedRowIds });
    if (!a2.ok) throw new Error("fixture m2");
    s = a2.session;
    expect(s.cellMerges?.length).toBe(2);

    // Merge a rectangle intersecting both existing merges.
    const big = makeCsvCellMerge({
      startRowId: r1,
      endRowId: r1,
      startColumnId: a,
      endColumnId: d,
    });
    const out = mergeCsvCellsAnyway({ session: s, merge: big, orderedRowIds });
    if (!out.ok) throw new Error("expected ok");
    expect(out.session.cellMerges?.length).toBe(1);
    expect(out.session.cellMerges?.[0]?.startRowId).toBe(big.startRowId);
  });
});
