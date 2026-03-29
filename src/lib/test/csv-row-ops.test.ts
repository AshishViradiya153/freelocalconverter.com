import { describe, expect, it } from "vitest";
import { parseCsvText } from "@/lib/csv-import";
import {
  buildCsvRowClipboardTsv,
  csvViewerRowsFromClipboardTsv,
} from "@/lib/csv-row-ops";
import { resultToSession } from "@/lib/csv-viewer-session";

describe("csv-row-ops", () => {
  it("buildCsvRowClipboardTsv joins data columns with tabs", () => {
    const r = parseCsvText("a,b\n1,2");
    const s = resultToSession("t.csv", r, "ltr");
    const row = s.rows[0];
    if (!row) throw new Error("fixture: expected one row");
    expect(buildCsvRowClipboardTsv(row, s.columnKeys)).toBe("1\t2");
  });

  it("csvViewerRowsFromClipboardTsv parses one line", () => {
    const r = parseCsvText("x,y\na,b");
    const s = resultToSession("t.csv", r, "ltr");
    const rows = csvViewerRowsFromClipboardTsv("9\t8", s.columnKeys);
    expect(rows).toHaveLength(1);
    expect(s.columnKeys).toHaveLength(2);
    const [k0, k1] = s.columnKeys;
    expect(rows[0]?.[k0]).toBe("9");
    expect(rows[0]?.[k1]).toBe("8");
  });

  it("csvViewerRowsFromClipboardTsv returns empty for blank", () => {
    const r = parseCsvText("a\n1");
    const s = resultToSession("t.csv", r, "ltr");
    expect(csvViewerRowsFromClipboardTsv("  \n", s.columnKeys)).toEqual([]);
  });
});
