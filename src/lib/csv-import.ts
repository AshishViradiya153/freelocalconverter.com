import type { ColumnDef } from "@tanstack/react-table";
import Papa from "papaparse";
import { getFilterFn } from "@/lib/data-grid-filters";
import { generateId } from "@/lib/id";
import type { CellOpts } from "@/types/data-grid";

export const CSV_IMPORT_MAX_FILE_BYTES = 200 * 1024 * 1024;
export const CSV_IMPORT_MAX_ROWS = 50_000;
const INFER_SAMPLE_ROWS = 500;

export type CsvImportErrorCode =
  | "file_too_large"
  | "unsupported_file_type"
  | "empty_file"
  | "parse_failed"
  | "no_headers"
  | "json_not_array"
  | "json_empty"
  | "json_row_not_object";

export class CsvImportError extends Error {
  code: CsvImportErrorCode;

  constructor(code: CsvImportErrorCode, message: string) {
    super(message);
    this.name = "CsvImportError";
    this.code = code;
  }
}

export interface CsvViewerRow {
  id: string;
  [key: string]: unknown;
}

export interface CsvImportResult {
  rows: CsvViewerRow[];
  columns: ColumnDef<CsvViewerRow>[];
  /** Original header labels for export (same order as column keys). */
  headerLabels: string[];
  truncated: boolean;
  rowCountBeforeCap: number;
}

function slugifyHeader(raw: string, index: number): string {
  const base = raw.trim() || `column_${index + 1}`;
  const slug = base
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return slug || `column_${index + 1}`;
}

function uniqueKeys(headers: string[]): string[] {
  const used = new Map<string, number>();
  return headers.map((h, i) => {
    let key = slugifyHeader(h, i);
    const count = used.get(key) ?? 0;
    used.set(key, count + 1);
    if (count > 0) key = `${key}_${count + 1}`;
    return key;
  });
}

function tryParseNumber(value: string): number | null {
  const t = value.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function tryParseDate(value: string): Date | null {
  const t = value.trim();
  if (t === "") return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  if (y < 1900 || y > 2100) return null;
  return d;
}

export type CsvColumnKind = "number" | "date" | "short-text";

function inferColumnKind(sampleValues: string[]): CsvColumnKind {
  const nonEmpty = sampleValues.filter((v) => v.trim() !== "");
  if (nonEmpty.length === 0) return "short-text";

  let numberHits = 0;
  let dateHits = 0;

  for (const v of nonEmpty) {
    if (tryParseNumber(v) !== null) numberHits++;
    if (tryParseDate(v) !== null) dateHits++;
  }

  const ratio = 0.8;
  if (numberHits / nonEmpty.length >= ratio) return "number";
  if (dateHits / nonEmpty.length >= ratio) return "date";
  return "short-text";
}

function buildCellOpts(kind: CsvColumnKind): CellOpts {
  switch (kind) {
    case "number":
      return { variant: "number" };
    case "date":
      return { variant: "date" };
    default:
      return { variant: "short-text" };
  }
}

function coerceValue(raw: unknown, kind: CsvColumnKind): unknown {
  if (raw === null || raw === undefined) return "";
  const s = String(raw);
  if (kind === "number") {
    const n = tryParseNumber(s);
    return n ?? "";
  }
  if (kind === "date") {
    const d = tryParseDate(s);
    return d ? d.toISOString() : s;
  }
  return s;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function cellSampleForJsonInference(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return v.toISOString();
  return JSON.stringify(v);
}

function coerceJsonCell(raw: unknown, kind: CsvColumnKind): unknown {
  if (raw !== null && typeof raw === "object" && !(raw instanceof Date)) {
    return JSON.stringify(raw);
  }
  return coerceValue(raw, kind);
}

function collectJsonHeaderOrder(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        order.push(k);
      }
    }
  }
  return order;
}

/**
 * Build the same {@link CsvImportResult} shape as CSV import from a parsed JSON
 * array of plain objects (e.g. after `JSON.parse` on user-edited text).
 */
export function jsonRecordsToImportResult(records: unknown): CsvImportResult {
  if (!Array.isArray(records)) {
    throw new CsvImportError(
      "json_not_array",
      "JSON must be an array of objects, for example [{\"name\": \"a\"}, …].",
    );
  }
  if (records.length === 0) {
    throw new CsvImportError(
      "json_empty",
      "The JSON array is empty. Add at least one object.",
    );
  }
  const objects: Record<string, unknown>[] = [];
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!isPlainRecord(r)) {
      throw new CsvImportError(
        "json_row_not_object",
        `Each array item must be a plain object (check item ${i + 1}).`,
      );
    }
    objects.push(r);
  }

  const rowCountBeforeCap = objects.length;
  const truncated = objects.length > CSV_IMPORT_MAX_ROWS;
  const capped = truncated
    ? objects.slice(0, CSV_IMPORT_MAX_ROWS)
    : objects;

  const headerLabels = collectJsonHeaderOrder(capped);
  const columnKeys = uniqueKeys(headerLabels);

  const kinds: CsvColumnKind[] = columnKeys.map((_key, colIdx) => {
    const label = headerLabels[colIdx];
    const sample: string[] = [];
    const limit = Math.min(capped.length, INFER_SAMPLE_ROWS);
    for (let r = 0; r < limit; r++) {
      const row = capped[r];
      const v =
        row && label !== undefined ? row[label] : undefined;
      sample.push(cellSampleForJsonInference(v));
    }
    return inferColumnKind(sample);
  });

  const rows: CsvViewerRow[] = capped.map((row) => {
    const out: CsvViewerRow = { id: generateId() };
    for (let i = 0; i < columnKeys.length; i++) {
      const label = headerLabels[i];
      const colKey = columnKeys[i];
      if (colKey === undefined || label === undefined) continue;
      const raw = row[label];
      out[colKey] = coerceJsonCell(raw, kinds[i] ?? "short-text");
    }
    return out;
  });

  return {
    rows,
    columns: buildColumnDefsForCsv(columnKeys, headerLabels, kinds),
    headerLabels: [...headerLabels],
    truncated,
    rowCountBeforeCap,
  };
}

export function buildColumnDefsForCsv(
  keys: string[],
  labels: string[],
  kinds: CsvColumnKind[],
): ColumnDef<CsvViewerRow>[] {
  const filterFn = getFilterFn<CsvViewerRow>();
  return keys.map((key, i) => ({
    id: key,
    accessorKey: key,
    header: labels[i] ?? key,
    minSize: 120,
    filterFn,
    meta: {
      label: labels[i] ?? key,
      cell: buildCellOpts(kinds[i] ?? "short-text"),
    },
  }));
}

export function parseCsvText(text: string): CsvImportResult {
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    const fatal = parsed.errors.find(
      (e) => e.type === "Quotes" || e.type === "FieldMismatch",
    );
    if (fatal) {
      throw new CsvImportError(
        "parse_failed",
        fatal.message || "Could not parse CSV. Check quoting and delimiters.",
      );
    }
  }

  const rawRows = parsed.data.filter(
    (row) =>
      row && Object.keys(row).some((k) => String(row[k] ?? "").trim() !== ""),
  );

  if (rawRows.length === 0) {
    throw new CsvImportError(
      "empty_file",
      "This CSV has no data rows. Add at least one row besides the header.",
    );
  }

  const headerRow = parsed.meta.fields;
  if (!headerRow?.length) {
    throw new CsvImportError(
      "no_headers",
      "No header row found. The first line should be column names.",
    );
  }

  const labels = headerRow.map((h) => h.trim() || "");
  const keys = uniqueKeys(labels);

  const rowCountBeforeCap = rawRows.length;
  const truncated = rawRows.length > CSV_IMPORT_MAX_ROWS;
  const capped = truncated ? rawRows.slice(0, CSV_IMPORT_MAX_ROWS) : rawRows;

  const kinds: CsvColumnKind[] = keys.map((_key, colIdx) => {
    const sample: string[] = [];
    const limit = Math.min(capped.length, INFER_SAMPLE_ROWS);
    for (let r = 0; r < limit; r++) {
      const row = capped[r];
      const v = row?.[headerRow[colIdx] ?? ""];
      sample.push(v === null || v === undefined ? "" : String(v));
    }
    return inferColumnKind(sample);
  });

  const rows: CsvViewerRow[] = capped.map((row) => {
    const out: CsvViewerRow = { id: generateId() };
    for (let i = 0; i < keys.length; i++) {
      const originalField = headerRow[i] ?? "";
      const raw = row[originalField];
      const colKey = keys[i];
      if (colKey) {
        out[colKey] = coerceValue(raw, kinds[i] ?? "short-text");
      }
    }
    return out;
  });

  const columns = buildColumnDefsForCsv(keys, labels, kinds);

  return {
    rows,
    columns,
    headerLabels: labels,
    truncated,
    rowCountBeforeCap,
  };
}

const CSV_FILE_EXTENSION = /\.csv$/i;
const CSV_LIKE_MIME_TYPES = new Set([
  "",
  "text/csv",
  "application/csv",
  "text/plain",
]);

/**
 * Whether a {@link File} is treated as uploadable CSV: `.csv` name, or a
 * known text/csv/plain MIME (many exporters use `text/plain` for UTF-8 CSV).
 * Excel `.xlsx`, PDF, images, etc. are rejected before reading file contents.
 */
export function isCsvLikeImportFile(file: File): boolean {
  if (CSV_FILE_EXTENSION.test(file.name)) return true;
  return CSV_LIKE_MIME_TYPES.has(file.type.trim().toLowerCase());
}

export async function parseCsvFile(file: File): Promise<CsvImportResult> {
  if (file.size > CSV_IMPORT_MAX_FILE_BYTES) {
    throw new CsvImportError(
      "file_too_large",
      `File is too large (max ${Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024))} MB).`,
    );
  }

  if (!isCsvLikeImportFile(file)) {
    throw new CsvImportError(
      "unsupported_file_type",
      "Only CSV files are supported. Use a .csv file (comma-separated values with a header row). Excel (.xlsx), PDF, and other formats are not supported.",
    );
  }

  const text = await file.text();
  return parseCsvText(text);
}
