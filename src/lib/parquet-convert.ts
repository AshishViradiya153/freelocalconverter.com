import type { BasicType, ColumnSource } from "hyparquet-writer";
import type { CsvViewerRow } from "@/lib/csv-import";
import {
  CSV_IMPORT_MAX_ROWS,
  type CsvImportResult,
  jsonRecordsToImportResult,
} from "@/lib/csv-import";
import type { CsvViewerSession } from "@/lib/csv-viewer-session";

type ParquetConversionErrorCode =
  | "parquet_read_failed"
  | "parquet_write_failed";

export class ParquetConversionError extends Error {
  code: ParquetConversionErrorCode;

  constructor(code: ParquetConversionErrorCode, message: string) {
    super(message);
    this.name = "ParquetConversionError";
    this.code = code;
  }
}

function safeStringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function uniqueColumnNames(values: string[]): string[] {
  // Parquet writers require unique column names.
  const used = new Map<string, number>();
  return values.map((raw, i) => {
    const base = raw?.trim() ? raw.trim() : `column_${i + 1}`;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

export const PARQUET_READ_ROW_CAP = CSV_IMPORT_MAX_ROWS + 1;
const STRING_TYPE = "STRING" satisfies BasicType;

/**
 * Read a Parquet file buffer and convert it into the same `CsvImportResult` shape
 * the rest of the app understands.
 */
export async function parseParquetFileToImportResult(
  file: File,
  opts?: {
    rowEnd?: number;
  },
): Promise<{ result: CsvImportResult; truncated: boolean }> {
  const hyparquet = await import("hyparquet");
  const rowEnd = Math.min(
    opts?.rowEnd ?? PARQUET_READ_ROW_CAP,
    PARQUET_READ_ROW_CAP,
  );

  const buf = await file.arrayBuffer();

  try {
    const records = await (
      hyparquet as unknown as {
        parquetReadObjects: (args: {
          file: ArrayBuffer;
          rowStart?: number;
          rowEnd?: number;
        }) => Promise<Record<string, unknown>[]>;
      }
    ).parquetReadObjects({
      file: buf,
      rowStart: 0,
      rowEnd,
    });

    // `jsonRecordsToImportResult()` applies the same `CSV_IMPORT_MAX_ROWS` cap used
    // elsewhere in the app, so if we read `CSV_IMPORT_MAX_ROWS + 1` objects,
    // it can reliably set `result.truncated`.
    const truncated = records.length >= rowEnd;
    const result = jsonRecordsToImportResult(records);
    return { result, truncated };
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Could not read Parquet file in this browser.";
    throw new ParquetConversionError("parquet_read_failed", msg);
  }
}

export async function parquetCsvSessionToBuffer(
  session: CsvViewerSession,
  opts?: {
    maxRows?: number;
  },
): Promise<ArrayBuffer> {
  const { parquetWriteBuffer } = await import("hyparquet-writer");

  const maxRows = Math.min(
    opts?.maxRows ?? CSV_IMPORT_MAX_ROWS,
    session.rows.length,
  );
  const rows = session.rows.slice(0, maxRows);

  if (rows.length === 0) {
    // Hyparquet writer expects at least one row; keep schema with empty rows.
    const emptyColumnNames = uniqueColumnNames(session.headerLabels);
    const columnData: ColumnSource[] = emptyColumnNames.map((name) => ({
      name,
      type: STRING_TYPE,
      data: [],
    }));
    const empty = parquetWriteBuffer({ columnData });
    return empty;
  }

  const columnKeys = session.columnKeys;
  const columnLabels = session.headerLabels;
  const baseColumnNames =
    columnLabels.length === columnKeys.length ? columnLabels : columnKeys;
  const columnNames = uniqueColumnNames(baseColumnNames);

  const columnData: ColumnSource[] = columnNames.map((name, i) => {
    const key = columnKeys[i] ?? columnLabels[i] ?? `column_${i + 1}`;
    const data = rows.map((r: CsvViewerRow) => safeStringifyCell(r[key]));
    return {
      name,
      type: STRING_TYPE,
      data,
    };
  });

  try {
    return parquetWriteBuffer({ columnData });
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Could not write Parquet file in this browser.";
    throw new ParquetConversionError("parquet_write_failed", msg);
  }
}
