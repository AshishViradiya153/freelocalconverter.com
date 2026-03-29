import type { ParseStringMatrixHeaderOptions } from "@/lib/csv-import";
import type { CsvViewerSession } from "@/lib/csv-viewer-session";
import { resultToSession } from "@/lib/csv-viewer-session";
import { parseExcelFile } from "@/lib/excel-import";

export function xlsExportCsvBaseName(excelName: string): string {
  const leaf = excelName.replace(/\.(xlsx|xlsm|xlsb|xls)$/i, "");
  return leaf ? `${leaf}.csv` : "export.csv";
}

export function buildXlsMatrixHeaderOptions(
  hasHeaderRow: boolean,
  headerRowLine: number,
): ParseStringMatrixHeaderOptions {
  if (!hasHeaderRow) return { hasHeaderRow: false };
  const line = Math.max(1, Math.floor(headerRowLine || 1));
  return { hasHeaderRow: true, headerRowIndex: line - 1 };
}

export async function parseXlsToCsvSession(
  file: File,
  opts: {
    sheetIndex?: number;
    hasHeaderRow: boolean;
    headerRowLine: number;
  },
): Promise<{
  session: CsvViewerSession;
  sheetNames: string[];
  sheetIndex: number;
  sheetRowCount: number;
}> {
  const { sheetIndex = 0, hasHeaderRow, headerRowLine } = opts;

  const matrixHeader = buildXlsMatrixHeaderOptions(hasHeaderRow, headerRowLine);
  const {
    result,
    sheetNames,
    sheetIndex: resolvedIndex,
    sheetRowCount,
  } = await parseExcelFile(file, {
    sheetIndex,
    matrixHeader,
  });

  const csvName = xlsExportCsvBaseName(file.name);
  const session = resultToSession(csvName, result, "ltr");

  return {
    session,
    sheetNames,
    sheetIndex: resolvedIndex,
    sheetRowCount,
  };
}
