import { describe, expect, it } from "vitest";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  isCsvLikeImportFile,
  parseCsvFile,
  parseCsvText,
  parseStringMatrixToImportResult,
} from "@/lib/csv-import";

describe("isCsvLikeImportFile", () => {
  it("accepts .csv by extension regardless of MIME", () => {
    expect(
      isCsvLikeImportFile(
        new File(["a"], "data.csv", { type: "application/octet-stream" }),
      ),
    ).toBe(true);
  });

  it("accepts text/csv and text/plain without .csv name", () => {
    expect(
      isCsvLikeImportFile(new File(["a,b"], "export", { type: "text/csv" })),
    ).toBe(true);
    expect(
      isCsvLikeImportFile(new File(["a,b"], "sheet", { type: "text/plain" })),
    ).toBe(true);
  });

  it("rejects typical non-CSV types", () => {
    expect(
      isCsvLikeImportFile(
        new File(["x"], "work.xlsx", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      ),
    ).toBe(false);
    expect(
      isCsvLikeImportFile(
        new File(["x"], "doc.pdf", { type: "application/pdf" }),
      ),
    ).toBe(false);
  });
});

describe("parseCsvFile", () => {
  it("throws unsupported_file_type for non-CSV files", async () => {
    const file = new File(["PK\x03\x04"], "book.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await expect(parseCsvFile(file)).rejects.toMatchObject({
      code: "unsupported_file_type",
    });
  });

  it("throws file_too_large when size exceeds limit", async () => {
    const file = new File(["a"], "big.csv", { type: "text/csv" });
    Object.defineProperty(file, "size", {
      value: CSV_IMPORT_MAX_FILE_BYTES + 1,
      configurable: true,
    });
    await expect(parseCsvFile(file)).rejects.toMatchObject({
      code: "file_too_large",
    });
  });
});

describe("parseCsvText", () => {
  it("parses basic CSV with headers", () => {
    const csv = "name,age\nAlice,30\nBob,25";
    const { rows, columns, truncated } = parseCsvText(csv);
    expect(truncated).toBe(false);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.name).toBe("Alice");
    expect(rows[0]?.age).toBe(30);
    expect(columns.map((c) => c.id)).toEqual(["name", "age"]);
  });

  it("handles quoted commas", () => {
    const csv = 'title,note\n"Hello, world",x';
    const { rows } = parseCsvText(csv);
    expect(rows[0]?.title).toBe("Hello, world");
  });

  it("handles duplicate headers (Papa renames then we key rows)", () => {
    const csv = "a,a,a\n1,2,3";
    const { rows, columns } = parseCsvText(csv);
    expect(columns).toHaveLength(3);
    const id0 = columns[0]?.id;
    const id1 = columns[1]?.id;
    const id2 = columns[2]?.id;
    const row = rows[0];
    expect(id0).toBe("a");
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(row).toBeDefined();
    if (id0 && id1 && id2 && row) {
      expect(row[id0]).toBe(1);
      expect(row[id1]).toBe(2);
      expect(row[id2]).toBe(3);
    }
  });

  it("throws empty_file when only header", () => {
    expect(() => parseCsvText("only,header")).toThrow(CsvImportError);
    try {
      parseCsvText("only,header");
    } catch (e) {
      expect(e).toBeInstanceOf(CsvImportError);
      if (e instanceof CsvImportError) expect(e.code).toBe("empty_file");
    }
  });

  it("truncates when above max rows", () => {
    const header = "c\n";
    const lines = [
      header,
      ...Array.from({ length: CSV_IMPORT_MAX_ROWS + 5 }, (_, i) => `${i}\n`),
    ];
    const { rows, truncated, rowCountBeforeCap } = parseCsvText(lines.join(""));
    expect(truncated).toBe(true);
    expect(rows).toHaveLength(CSV_IMPORT_MAX_ROWS);
    expect(rowCountBeforeCap).toBe(CSV_IMPORT_MAX_ROWS + 5);
  });
});

describe("parseStringMatrixToImportResult", () => {
  it("parses first row as headers and coerces types like CSV import", () => {
    const matrix = [
      ["name", "age"],
      ["Alice", "30"],
      ["Bob", "25"],
    ];
    const { rows, truncated } = parseStringMatrixToImportResult(matrix);
    expect(truncated).toBe(false);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.name).toBe("Alice");
    expect(rows[0]?.age).toBe(30);
  });

  it("uses a later row as header when title rows appear above", () => {
    const matrix = [["Q4 Report"], ["name", "age"], ["Ada", "40"]];
    const { rows, headerLabels } = parseStringMatrixToImportResult(matrix, {
      headerRowIndex: 1,
    });
    expect(headerLabels).toEqual(["name", "age"]);
    expect(rows).toHaveLength(1);
  });

  it("fills blank header cells with Column N labels", () => {
    const matrix = [
      ["a", "", "c"],
      ["1", "2", "3"],
    ];
    const { headerLabels } = parseStringMatrixToImportResult(matrix);
    expect(headerLabels[0]).toBe("a");
    expect(headerLabels[1]).toBe("Column 2");
    expect(headerLabels[2]).toBe("c");
  });

  it("treats all rows as data when hasHeaderRow is false", () => {
    const matrix = [
      ["x", "y"],
      ["1", "2"],
    ];
    const { rows, headerLabels } = parseStringMatrixToImportResult(matrix, {
      hasHeaderRow: false,
    });
    expect(headerLabels).toEqual(["Column 1", "Column 2"]);
    expect(rows).toHaveLength(2);
  });

  it("auto-detects a title row above headers", () => {
    const matrix = [
      ["Quarterly Revenue Report", "", ""],
      ["name", "amount", "created_at"],
      ["Acme", "1200", "2024-01-01"],
      ["Globex", "950", "2024-01-02"],
    ];
    const { headerLabels, rows } = parseStringMatrixToImportResult(matrix);
    expect(headerLabels).toEqual(["name", "amount", "created_at"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.name).toBe("Acme");
  });

  it("auto-detects no header when rows look uniformly numeric", () => {
    const matrix = [
      ["101", "202", "303"],
      ["111", "222", "333"],
      ["121", "232", "343"],
    ];
    const { headerLabels, rows } = parseStringMatrixToImportResult(matrix);
    expect(headerLabels).toEqual(["Column 1", "Column 2", "Column 3"]);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.Column_1).toBe(101);
  });
});
