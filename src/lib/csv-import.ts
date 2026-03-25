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

export interface ParseStringMatrixHeaderOptions {
  /**
   * Auto-detect whether a header row exists and which row should be used.
   * Enabled by default when `hasHeaderRow` is not explicitly provided.
   */
  autoDetectHeaderRow?: boolean;
  /**
   * When false, every non-empty row is data and column names are `Column 1`, ….
   * Default true.
   */
  hasHeaderRow?: boolean;
  /**
   * 0-based index of the header row. Rows above are ignored (e.g. title blocks).
   * Default 0. Ignored when `hasHeaderRow` is false.
   */
  headerRowIndex?: number;
}

interface HeaderDetectionResult {
  hasHeaderRow: boolean;
  headerRowIndex: number;
}

function classifyHeaderCellKind(value: string): "empty" | "number" | "date" | "text" {
  const t = value.trim();
  if (t === "") return "empty";
  if (tryParseNumber(t) !== null) return "number";
  if (tryParseDate(t) !== null) return "date";
  return "text";
}

function normalizedHeaderToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");
}

function detectHeaderRow(normalized: string[][]): HeaderDetectionResult {
  const width = Math.max(0, ...normalized.map((r) => r.length));
  if (width === 0) return { hasHeaderRow: false, headerRowIndex: 0 };

  const candidateLimit = Math.min(20, Math.max(1, normalized.length - 1));
  const lookaheadRows = 25;

  let best = { score: -Infinity, rowIndex: 0 };

  for (let headerIdx = 0; headerIdx < candidateLimit; headerIdx++) {
    const header = normalized[headerIdx] ?? [];
    const body = normalized
      .slice(headerIdx + 1, headerIdx + 1 + lookaheadRows)
      .filter((row) => row.some((c) => c.trim() !== ""));
    if (body.length === 0) continue;

    let filledHeaderCount = 0;
    let textHeaderCount = 0;
    let numericLikeHeaderCount = 0;
    let dateLikeHeaderCount = 0;
    let differsFromBodyKindCount = 0;
    let duplicatePenalty = 0;
    let titleRowPenalty = 0;
    const seen = new Set<string>();

    for (let col = 0; col < width; col++) {
      const hv = (header[col] ?? "").trim();
      const hk = classifyHeaderCellKind(hv);
      if (hk !== "empty") filledHeaderCount++;
      if (hk === "text") textHeaderCount++;
      if (hk === "number") numericLikeHeaderCount++;
      if (hk === "date") dateLikeHeaderCount++;

      const token = normalizedHeaderToken(hv);
      if (token !== "") {
        if (seen.has(token)) duplicatePenalty += 1;
        seen.add(token);
      }

      let bodyText = 0;
      let bodyNumericOrDate = 0;
      for (const row of body) {
        const bk = classifyHeaderCellKind((row[col] ?? "").trim());
        if (bk === "empty") continue;
        if (bk === "text") bodyText++;
        else bodyNumericOrDate++;
      }
      if (hk === "text" && bodyNumericOrDate > bodyText) differsFromBodyKindCount++;
      if ((hk === "number" || hk === "date") && bodyText > bodyNumericOrDate) {
        differsFromBodyKindCount--;
      }
    }

    if (filledHeaderCount <= 1 && width >= 3) titleRowPenalty += 3;
    const coverage = filledHeaderCount / width;
    const textRatio = filledHeaderCount === 0 ? 0 : textHeaderCount / filledHeaderCount;
    const numericDateRatio =
      filledHeaderCount === 0
        ? 0
        : (numericLikeHeaderCount + dateLikeHeaderCount) / filledHeaderCount;

    const score =
      coverage * 2.5 +
      textRatio * 2.25 +
      differsFromBodyKindCount * 0.7 -
      numericDateRatio * 1.8 -
      duplicatePenalty * 0.5 -
      titleRowPenalty;

    if (score > best.score) best = { score, rowIndex: headerIdx };
  }

  if (best.score < 1.25) return { hasHeaderRow: false, headerRowIndex: 0 };
  return { hasHeaderRow: true, headerRowIndex: best.rowIndex };
}

function buildImportResultFromLabelsAndDataRows(
  headerLabels: string[],
  rawRows: string[][],
): CsvImportResult {
  if (rawRows.length === 0) {
    throw new CsvImportError(
      "empty_file",
      "No data rows below the chosen header row.",
    );
  }

  const keys = uniqueKeys(headerLabels);
  const rowCountBeforeCap = rawRows.length;
  const truncated = rawRows.length > CSV_IMPORT_MAX_ROWS;
  const capped = truncated ? rawRows.slice(0, CSV_IMPORT_MAX_ROWS) : rawRows;

  const kinds: CsvColumnKind[] = keys.map((_key, colIdx) => {
    const sample: string[] = [];
    const limit = Math.min(capped.length, INFER_SAMPLE_ROWS);
    for (let r = 0; r < limit; r++) {
      const row = capped[r];
      const v = row?.[colIdx];
      sample.push(v === null || v === undefined ? "" : String(v));
    }
    return inferColumnKind(sample);
  });

  const rows: CsvViewerRow[] = capped.map((row) => {
    const out: CsvViewerRow = { id: generateId() };
    for (let i = 0; i < keys.length; i++) {
      const raw = row[i];
      const colKey = keys[i];
      if (colKey) {
        out[colKey] = coerceValue(raw, kinds[i] ?? "short-text");
      }
    }
    return out;
  });

  const columns = buildColumnDefsForCsv(keys, headerLabels, kinds);

  return {
    rows,
    columns,
    headerLabels,
    truncated,
    rowCountBeforeCap,
  };
}

/**
 * Parse a rectangular string matrix into the same shape as CSV import.
 * Used by Excel import after the sheet is read as an array of arrays.
 *
 * Default: row 0 is the header; use {@link ParseStringMatrixHeaderOptions} to skip
 * title rows, pick another header row, or import without a header (synthetic names).
 */
export function parseStringMatrixToImportResult(
  matrix: string[][],
  options?: ParseStringMatrixHeaderOptions,
): CsvImportResult {
  if (matrix.length === 0) {
    throw new CsvImportError(
      "empty_file",
      "This spreadsheet has no rows.",
    );
  }

  const width = Math.max(0, ...matrix.map((r) => r.length));
  if (width === 0) {
    throw new CsvImportError(
      "empty_file",
      "This spreadsheet has no columns.",
    );
  }

  const normalized = matrix.map((r) => {
    const row = r.map((c) =>
      c === null || c === undefined ? "" : String(c),
    );
    while (row.length < width) row.push("");
    return row;
  });

  const hasExplicitHeaderOption = options?.hasHeaderRow !== undefined;
  const shouldAutoDetect =
    options?.autoDetectHeaderRow !== false && !hasExplicitHeaderOption;

  const detected = shouldAutoDetect ? detectHeaderRow(normalized) : null;
  const hasHeaderRow =
    options?.hasHeaderRow ?? detected?.hasHeaderRow ?? true;
  const maxHeaderIdx = Math.max(0, normalized.length - 1);
  const defaultHeaderRowIndex = detected?.headerRowIndex ?? 0;
  const headerRowIndex = Math.min(
    Math.max(
      0,
      Math.floor(
        options?.headerRowIndex ?? defaultHeaderRowIndex,
      ),
    ),
    maxHeaderIdx,
  );

  if (!hasHeaderRow) {
    const rawRows = normalized.filter((row) =>
      row.some((cell) => String(cell ?? "").trim() !== ""),
    );
    if (rawRows.length === 0) {
      throw new CsvImportError(
        "empty_file",
        "This spreadsheet has no data rows.",
      );
    }
    const headerLabels = Array.from(
      { length: width },
      (_, i) => `Column ${i + 1}`,
    );
    return buildImportResultFromLabelsAndDataRows(headerLabels, rawRows);
  }

  const headerCells = normalized[headerRowIndex];
  if (!headerCells) {
    throw new CsvImportError(
      "empty_file",
      "This spreadsheet has no rows.",
    );
  }

  const headerLabels = headerCells.map((h, i) => {
    const t = h.trim();
    return t === "" ? `Column ${i + 1}` : t;
  });

  const rawRows = normalized
    .slice(headerRowIndex + 1)
    .filter((row) =>
      row.some((cell) => String(cell ?? "").trim() !== ""),
    );

  return buildImportResultFromLabelsAndDataRows(headerLabels, rawRows);
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
