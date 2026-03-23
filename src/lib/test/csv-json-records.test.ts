import { describe, expect, it } from "vitest";
import { buildLabelKeyedExportRows } from "@/lib/csv-export";
import {
  CsvImportError,
  jsonRecordsToImportResult,
  parseCsvText,
} from "@/lib/csv-import";
import { resultToSession } from "@/lib/csv-viewer-session";

describe("jsonRecordsToImportResult", () => {
  it("builds rows and headers from an object array", () => {
    const r = jsonRecordsToImportResult([
      { name: "Ada", score: "10" },
      { name: "Bob", score: "20", extra: "x" },
    ]);
    expect(r.rows).toHaveLength(2);
    expect(r.headerLabels).toEqual(["name", "score", "extra"]);
    const keyed = buildLabelKeyedExportRows(
      r.rows,
      r.columns.map((c) => String(c.accessorKey)),
      r.headerLabels,
    );
    expect(keyed[0]).toMatchObject({ name: "Ada", score: 10, extra: "" });
    expect(keyed[1]).toMatchObject({ name: "Bob", score: 20, extra: "x" });
  });

  it("rejects non-arrays", () => {
    expect(() => jsonRecordsToImportResult({})).toThrow(CsvImportError);
    expect(() => jsonRecordsToImportResult({})).toThrow(/array of objects/i);
  });

  it("rejects empty arrays", () => {
    expect(() => jsonRecordsToImportResult([])).toThrow(CsvImportError);
  });

  it("rejects non-object rows", () => {
    expect(() => jsonRecordsToImportResult([1])).toThrow(CsvImportError);
    expect(() => jsonRecordsToImportResult([[]])).toThrow(CsvImportError);
  });

  it("round-trips with CSV import via label-keyed JSON shape", () => {
    const csv = parseCsvText("a,b\n1,2\n3,4\n");
    const session = resultToSession("t.csv", csv, "ltr");
    const labelRows = buildLabelKeyedExportRows(
      session.rows,
      session.columnKeys,
      session.headerLabels,
    );
    const again = jsonRecordsToImportResult(labelRows);
    expect(again.rows).toHaveLength(2);
    expect(again.headerLabels).toEqual(session.headerLabels);
  });
});
