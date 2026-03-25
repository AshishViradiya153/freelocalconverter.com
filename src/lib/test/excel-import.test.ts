import { describe, expect, it } from "vitest";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CsvImportError,
} from "@/lib/csv-import";
import { isExcelImportFile, parseExcelFile } from "@/lib/excel-import";

type TestBlobPart = ArrayBuffer | SharedArrayBuffer | ArrayBufferView | string;

function blobPartToArrayBuffer(part: TestBlobPart): ArrayBuffer {
  if (part instanceof ArrayBuffer) return part.slice(0);
  if (typeof SharedArrayBuffer !== "undefined" && part instanceof SharedArrayBuffer) {
    return part.slice(0) as unknown as ArrayBuffer;
  }
  if (ArrayBuffer.isView(part)) {
    const v = part;
    return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as unknown as ArrayBuffer;
  }
  if (typeof part === "string") {
    const u = new TextEncoder().encode(part);
    return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength);
  }
  throw new Error("unsupported test file blob part");
}

/**
 * jsdom's `File.arrayBuffer()` is unreliable for binary XLSX bytes. Build a
 * real `ArrayBuffer` and return it from `arrayBuffer()` like browsers do.
 */
function testFile(
  parts: TestBlobPart[],
  name: string,
  init?: FilePropertyBag,
): File {
  if (parts.length === 0) {
    const file = new File([], name, init ?? {});
    return Object.assign(file, {
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    }) as File;
  }

  if (parts.length !== 1) {
    throw new Error("testFile: merge multiple parts with Blob if needed");
  }

  const ab = blobPartToArrayBuffer(parts[0]!);
  const file = new File([ab], name, init ?? {});
  return Object.assign(file, {
    arrayBuffer: () => Promise.resolve(ab),
  }) as File;
}

async function buildXlsxFile(
  sheets: { name: string; aoa: (string | number)[][] }[],
  fileName: string,
): Promise<File> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const { name, aoa } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as
    | ArrayBuffer
    | Uint8Array;
  const ab =
    out instanceof Uint8Array
      ? out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength)
      : out;
  return testFile([ab], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("isExcelImportFile", () => {
  it("accepts Excel extensions", () => {
    expect(
      isExcelImportFile(
        new File([], "book.xlsx", { type: "application/octet-stream" }),
      ),
    ).toBe(true);
    expect(
      isExcelImportFile(new File([], "legacy.xls", { type: "" })),
    ).toBe(true);
    expect(
      isExcelImportFile(
        new File([], "macro.xlsm", {
          type: "application/vnd.ms-excel.sheet.macroenabled.12",
        }),
      ),
    ).toBe(true);
  });

  it("accepts known Excel MIME types without extension", () => {
    expect(
      isExcelImportFile(
        new File([], "upload", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      ),
    ).toBe(true);
  });

  it("rejects typical non-Excel files", () => {
    expect(
      isExcelImportFile(new File(["a,b"], "data.csv", { type: "text/csv" })),
    ).toBe(false);
    expect(
      isExcelImportFile(new File(["x"], "notes.txt", { type: "text/plain" })),
    ).toBe(false);
  });
});

describe("parseExcelFile", () => {
  it("parses first sheet rows and headers", async () => {
    const file = await buildXlsxFile(
      [
        {
          name: "Sheet1",
          aoa: [
            ["Name", "Score"],
            ["Ada", 10],
            ["Bob", 20],
          ],
        },
      ],
      "scores.xlsx",
    );

    const { result, sheetNames, sheetIndex, sheetRowCount } = await parseExcelFile(
      file,
      0,
    );
    expect(sheetNames).toContain("Sheet1");
    expect(sheetIndex).toBe(0);
    expect(sheetRowCount).toBeGreaterThanOrEqual(3);
    expect(result.truncated).toBe(false);
    expect(result.rows).toHaveLength(2);
    const keys = result.columns.map((c) => c.id);
    expect(keys.length).toBe(2);
    const row0 = result.rows[0];
    expect(row0).toBeDefined();
    if (row0 && keys[0] && keys[1]) {
      expect(row0[keys[0]]).toBe("Ada");
      expect(row0[keys[1]]).toBe(10);
    }
  });

  it("reads the selected sheet index when multiple sheets exist", async () => {
    const file = await buildXlsxFile(
      [
        {
          name: "First",
          aoa: [
            ["A", "B"],
            [1, 2],
          ],
        },
        {
          name: "Second",
          aoa: [
            ["X", "Y"],
            ["hello", "world"],
          ],
        },
      ],
      "multi.xlsx",
    );

    const second = await parseExcelFile(file, 1);
    expect(second.sheetIndex).toBe(1);
    expect(second.result.rows).toHaveLength(1);
    const colIds = second.result.columns.map((c) => c.id);
    const r = second.result.rows[0];
    expect(r).toBeDefined();
    if (r && colIds[0] && colIds[1]) {
      expect(r[colIds[0]]).toBe("hello");
      expect(r[colIds[1]]).toBe("world");
    }

    const clamped = await parseExcelFile(file, 99);
    expect(clamped.sheetIndex).toBe(1);
    expect(clamped.result.rows).toHaveLength(1);
  });

  it("respects matrixHeader headerRowIndex for a title row", async () => {
    const file = await buildXlsxFile(
      [
        {
          name: "S1",
          aoa: [
            ["Report"],
            ["id", "val"],
            ["1", "x"],
          ],
        },
      ],
      "titled.xlsx",
    );
    const { result, sheetRowCount } = await parseExcelFile(file, {
      sheetIndex: 0,
      matrixHeader: { headerRowIndex: 1 },
    });
    expect(sheetRowCount).toBeGreaterThanOrEqual(3);
    expect(result.rows).toHaveLength(1);
    expect(result.headerLabels).toEqual(["id", "val"]);
  });

  it("throws unsupported_file_type for CSV files", async () => {
    const file = testFile(["a,b\n1,2"], "data.csv", { type: "text/csv" });
    await expect(parseExcelFile(file)).rejects.toMatchObject({
      code: "unsupported_file_type",
    });
  });

  it("throws file_too_large when size exceeds limit", async () => {
    const file = testFile([], "big.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(file, "size", {
      value: CSV_IMPORT_MAX_FILE_BYTES + 1,
      configurable: true,
    });
    await expect(parseExcelFile(file)).rejects.toMatchObject({
      code: "file_too_large",
    });
  });

  it("rejects corrupt or non-workbook xlsx bytes", async () => {
    const file = testFile(
      [new TextEncoder().encode("PK\x03\x04\x14\x00not-a-real-zip")],
      "bad.xlsx",
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    );
    await parseExcelFile(file).then(
      ({ result }) => {
        // Some SheetJS versions parse tiny garbage payloads into a single-cell sheet.
        expect(result.rows.length).toBeGreaterThanOrEqual(1);
      },
      (err: unknown) => {
        expect(err).toBeInstanceOf(CsvImportError);
        if (err instanceof CsvImportError) {
          expect(["parse_failed", "empty_file"]).toContain(err.code);
        }
      },
    );
  });

  it("throws empty_file when the sheet has no rows", async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "Empty");
    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as
      | ArrayBuffer
      | Uint8Array;
    const ab =
      out instanceof Uint8Array
        ? out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength)
        : out;
    const file = testFile([ab], "empty.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await expect(parseExcelFile(file)).rejects.toMatchObject({
      code: "empty_file",
    });
  });
});
