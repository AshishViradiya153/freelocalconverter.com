import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CsvImportError,
  type CsvImportResult,
  type ParseStringMatrixHeaderOptions,
  parseStringMatrixToImportResult,
} from "@/lib/csv-import";

const EXCEL_NAME = /\.(xlsx|xlsm|xlsb|xls)$/i;
const EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "application/vnd.ms-excel.sheet.binary.macroenabled.12",
  "application/octet-stream",
]);

function normalizeSheetMatrix(aoa: unknown[][]): string[][] {
  return aoa.map((row) => {
    if (!Array.isArray(row)) return [];
    return row.map((c) => {
      if (c === null || c === undefined) return "";
      if (c instanceof Date) return c.toISOString();
      return String(c);
    });
  });
}

export function isExcelImportFile(file: File): boolean {
  if (EXCEL_NAME.test(file.name)) return true;
  const t = file.type.trim().toLowerCase();
  return EXCEL_MIME_TYPES.has(t);
}

export interface ParseExcelFileResult {
  result: CsvImportResult;
  sheetNames: string[];
  sheetIndex: number;
  /** Row count on the selected sheet after reading (for header-row UI). */
  sheetRowCount: number;
}

export interface ParseExcelFileOptions {
  sheetIndex?: number;
  matrixHeader?: ParseStringMatrixHeaderOptions;
}

/**
 * Reads the selected sheet. Parsing runs entirely in the browser via SheetJS.
 * Pass a number as the second argument for backward compatibility (`sheetIndex` only).
 */
export async function parseExcelFile(
  file: File,
  sheetIndexOrOptions: number | ParseExcelFileOptions = 0,
): Promise<ParseExcelFileResult> {
  const opts: ParseExcelFileOptions =
    typeof sheetIndexOrOptions === "number"
      ? { sheetIndex: sheetIndexOrOptions }
      : sheetIndexOrOptions;
  const sheetIndex = opts.sheetIndex ?? 0;
  const matrixHeader = opts.matrixHeader;
  if (file.size > CSV_IMPORT_MAX_FILE_BYTES) {
    throw new CsvImportError(
      "file_too_large",
      `File is too large (max ${Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024))} MB).`,
    );
  }

  if (!isExcelImportFile(file)) {
    throw new CsvImportError(
      "unsupported_file_type",
      "Use an Excel file (.xlsx, .xlsm, .xlsb, or legacy .xls).",
    );
  }

  const buf = await file.arrayBuffer();

  const XLSX = await import("xlsx");

  let workbook: ReturnType<typeof XLSX.read>;
  try {
    workbook = XLSX.read(buf, { type: "array", cellDates: true });
  } catch {
    throw new CsvImportError(
      "parse_failed",
      "Could not read this Excel file. It may be corrupted or password-protected.",
    );
  }

  const sheetNames = workbook.SheetNames ?? [];
  if (sheetNames.length === 0) {
    throw new CsvImportError("empty_file", "This workbook has no sheets.");
  }

  const idx = Math.min(Math.max(0, sheetIndex), sheetNames.length - 1);
  const sheetName = sheetNames[idx];
  if (!sheetName) {
    throw new CsvImportError("empty_file", "This workbook has no sheets.");
  }

  const ws = workbook.Sheets[sheetName];
  if (!ws) {
    throw new CsvImportError(
      "parse_failed",
      "Could not read the selected sheet.",
    );
  }

  const aoa = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  const rows = Array.isArray(aoa)
    ? aoa.map((r) => (Array.isArray(r) ? r : []))
    : [];
  const matrix = normalizeSheetMatrix(rows);

  if (matrix.length === 0) {
    throw new CsvImportError("empty_file", "The selected sheet is empty.");
  }

  const result = parseStringMatrixToImportResult(matrix, matrixHeader);

  return {
    result,
    sheetNames,
    sheetIndex: idx,
    sheetRowCount: matrix.length,
  };
}
