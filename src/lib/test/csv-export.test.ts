import { describe, expect, it } from "vitest";
import {
  buildCsvExportString,
  buildLabelKeyedExportRows,
  neutralizeCsvFormulaPrefix,
  sanitizeCsvDownloadFileBaseName,
} from "@/lib/csv-export";
import type { CsvViewerRow } from "@/lib/csv-import";

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
});
