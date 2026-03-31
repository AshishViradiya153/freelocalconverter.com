import { describe, expect, it } from "vitest";
import {
  buildCsvExportString,
  buildLabelKeyedExportRows,
  buildPdfExportBytes,
  neutralizeCsvFormulaPrefix,
  serializeCellForDownload,
  sanitizeCsvDownloadFileBaseName,
} from "@/lib/csv-export";
import type { CsvViewerRow } from "@/lib/csv-import";
import type { CsvCellMerge } from "@/lib/csv-viewer-session";

describe("neutralizeCsvFormulaPrefix", () => {
  it("prefixes tab for leading formula metacharacters", () => {
    expect(neutralizeCsvFormulaPrefix("=1+1")).toBe("\t=1+1");
    expect(neutralizeCsvFormulaPrefix("+123")).toBe("\t+123");
    expect(neutralizeCsvFormulaPrefix("-sum(A1)")).toBe("\t-sum(A1)");
    expect(neutralizeCsvFormulaPrefix("@sum(A1)")).toBe("\t@sum(A1)");
  });

  it("leaves normal text unchanged", () => {
    expect(neutralizeCsvFormulaPrefix("hello")).toBe("hello");
    expect(neutralizeCsvFormulaPrefix("a=1")).toBe("a=1");
  });
});

describe("sanitizeCsvDownloadFileBaseName", () => {
  it("uses the path leaf and strips reserved characters", () => {
    expect(sanitizeCsvDownloadFileBaseName("../../../etc/passwd")).toBe(
      "passwd",
    );
    expect(sanitizeCsvDownloadFileBaseName("folder/data.csv")).toBe("data");
    expect(sanitizeCsvDownloadFileBaseName("report.xlsx")).toBe("report");
    expect(sanitizeCsvDownloadFileBaseName("dump.json")).toBe("dump");
    expect(sanitizeCsvDownloadFileBaseName('a<b>"c')).toBe("abc");
  });
});

describe("buildLabelKeyedExportRows", () => {
  it("maps column keys to header labels", () => {
    const rows: CsvViewerRow[] = [
      { id: "1", name: "Ada", score: 10 },
      { id: "2", name: "Bob", score: 20 },
    ];
    const out = buildLabelKeyedExportRows(
      rows,
      ["name", "score"],
      ["Name", "Score"],
    );
    expect(out).toEqual([
      { Name: "Ada", Score: 10 },
      { Name: "Bob", Score: 20 },
    ]);
  });

  it("blanks covered cells for merged ranges", () => {
    const rows: CsvViewerRow[] = [
      { id: "r1", a: "A1", b: "B1" },
      { id: "r2", a: "A2", b: "B2" },
    ];
    const merges: CsvCellMerge[] = [
      {
        id: "m1",
        startRowId: "r1",
        endRowId: "r2",
        startColumnId: "a",
        endColumnId: "b",
      },
    ];

    const out = buildLabelKeyedExportRows(rows, ["a", "b"], ["A", "B"], merges);
    expect(out).toEqual([
      { A: "A1", B: "" },
      { A: "", B: "" },
    ]);
  });
});

describe("buildCsvExportString", () => {
  it("includes header labels and row values", () => {
    const rows: CsvViewerRow[] = [
      { id: "1", name: "Ada", score: 10 },
      { id: "2", name: "Bob", score: 20 },
    ];
    const csv = buildCsvExportString(
      rows,
      ["name", "score"],
      ["Name", "Score"],
    );
    expect(csv).toContain("Name");
    expect(csv).toContain("Score");
    expect(csv).toContain("Ada");
    expect(csv).toContain("10");
    expect(csv).toContain("Bob");
    expect(csv).toContain("20");
  });

  it("serializes dates as ISO strings", () => {
    const d = new Date("2024-06-01T12:00:00.000Z");
    const rows: CsvViewerRow[] = [{ id: "1", when: d }];
    const csv = buildCsvExportString(rows, ["when"], ["When"]);
    expect(csv).toContain(d.toISOString());
  });

  it("neutralizes formula-like cell values on export", () => {
    const rows: CsvViewerRow[] = [{ id: "1", cmd: "=cmd|'/c calc'!A0" }];
    const csv = buildCsvExportString(rows, ["cmd"], ["Cmd"]);
    expect(csv).toContain("\t=cmd|");
  });

  it("uses empty cells for nullish values", () => {
    const rows: CsvViewerRow[] = [{ id: "1", x: null, y: undefined, z: "" }];
    const csv = buildCsvExportString(rows, ["x", "y", "z"], ["X", "Y", "Z"]);
    const lines = csv.trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const dataLine = lines.at(-1);
    expect(dataLine).toBeDefined();
    expect(dataLine).toMatch(/^,?,?$/);
  });

  it("blanks covered cells for merged ranges", () => {
    const rows: CsvViewerRow[] = [
      { id: "r1", a: "A1", b: "B1", c: "C1" },
      { id: "r2", a: "A2", b: "B2", c: "C2" },
    ];
    const merges: CsvCellMerge[] = [
      {
        id: "m1",
        startRowId: "r1",
        endRowId: "r2",
        startColumnId: "a",
        endColumnId: "b",
      },
    ];

    const csv = buildCsvExportString(
      rows,
      ["a", "b", "c"],
      ["A", "B", "C"],
      merges,
    );
    const lines = csv.trim().split(/\r?\n/);
    expect(lines[0]).toBe("A,B,C");
    expect(lines[1]).toBe("A1,,C1");
    expect(lines[2]).toBe(",,C2");
  });
});

describe("serializeCellForDownload", () => {
  it("serializes file cells as urls or names", () => {
    expect(
      serializeCellForDownload([
        {
          id: "f1",
          name: "pic.png",
          size: 1,
          type: "image/png",
          url: "blob:abc",
        },
      ]),
    ).toBe("blob:abc");
    expect(
      serializeCellForDownload([
        { id: "f1", name: "pic.png", size: 1, type: "image/png" },
      ]),
    ).toBe("pic.png");
  });
});

describe("buildPdfExportBytes", () => {
  it("creates a PDF document", async () => {
    const rows: CsvViewerRow[] = [{ id: "1", name: "Ada", score: 10 }];
    const bytes = await buildPdfExportBytes({
      rows,
      columnKeys: ["name", "score"],
      headerLabels: ["Name", "Score"],
      title: "test",
    });
    const prefix = new TextDecoder().decode(bytes.slice(0, 4));
    expect(prefix).toBe("%PDF");
  });
});
