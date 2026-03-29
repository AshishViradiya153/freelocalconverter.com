/**
 * CSV grid → SQL sketch: CREATE TABLE (inferred types) + batched INSERTs.
 * Identifiers are always dialect-quoted to avoid reserved words (e.g. `order`, `user`).
 * String literals use standard SQL single-quote doubling.
 */

import type { CsvColumnKind } from "@/lib/csv-import";
import type { CsvViewerSession } from "@/lib/csv-viewer-session";

export type SqlDialect = "postgresql" | "mysql" | "sqlite";

export interface CsvToSqlOptions {
  /** Logical table name (unquoted form; will be escaped per dialect). */
  tableName?: string;
  dialect?: SqlDialect;
  includeCreateTable?: boolean;
  includeInserts?: boolean;
  /** Rows per INSERT statement (multi-row VALUES). */
  rowsPerInsert?: number;
  /** When true, empty strings and missing cells become NULL in INSERT. */
  emptyAsNull?: boolean;
}

const DEFAULT_OPTIONS: Required<
  Pick<
    CsvToSqlOptions,
    | "dialect"
    | "includeCreateTable"
    | "includeInserts"
    | "rowsPerInsert"
    | "emptyAsNull"
  >
> = {
  dialect: "postgresql",
  includeCreateTable: true,
  includeInserts: true,
  rowsPerInsert: 100,
  emptyAsNull: true,
};

const MAX_IDENTIFIER_LEN = 63;

/** Strip extension and produce a safe unquoted SQL identifier stem (lowercase snake). */
export function defaultTableNameFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^/.\\]+$/g, "").trim();
  let s = base
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  if (!s) s = "imported_csv";
  if (/^\d/.test(s)) s = `t_${s}`;
  return s.slice(0, MAX_IDENTIFIER_LEN);
}

function quoteIdent(dialect: SqlDialect, ident: string): string {
  switch (dialect) {
    case "mysql":
      return `\`${ident.replace(/`/g, "``")}\``;
    case "sqlite":
    case "postgresql":
      return `"${ident.replace(/"/g, '""')}"`;
    default:
      return `"${ident.replace(/"/g, '""')}"`;
  }
}

function sqlStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function isEmptyCell(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

function numberStorageKind(
  rows: Array<Record<string, unknown>>,
  colKey: string,
): "integer" | "decimal" {
  let sawNonInteger = false;
  const maxInt = BigInt("9223372036854775807");
  const minInt = BigInt("-9223372036854775808");

  for (const row of rows) {
    const v = row[colKey];
    if (isEmptyCell(v)) continue;
    if (typeof v === "number") {
      if (!Number.isFinite(v)) {
        sawNonInteger = true;
        continue;
      }
      if (!Number.isInteger(v)) sawNonInteger = true;
      else {
        try {
          const b = BigInt(Math.trunc(v));
          if (b > maxInt || b < minInt) sawNonInteger = true;
        } catch {
          sawNonInteger = true;
        }
      }
      continue;
    }
    const s = String(v).trim();
    if (s === "") continue;
    if (!/^-?\d+$/.test(s)) {
      sawNonInteger = true;
      continue;
    }
    try {
      const b = BigInt(s);
      if (b > maxInt || b < minInt) sawNonInteger = true;
    } catch {
      sawNonInteger = true;
    }
  }

  return sawNonInteger ? "decimal" : "integer";
}

function createTableType(
  dialect: SqlDialect,
  kind: CsvColumnKind,
  rows: Array<Record<string, unknown>>,
  colKey: string,
): string {
  switch (kind) {
    case "number": {
      const sk = numberStorageKind(rows, colKey);
      if (dialect === "postgresql") {
        return sk === "integer" ? "BIGINT" : "DOUBLE PRECISION";
      }
      if (dialect === "mysql") {
        return sk === "integer" ? "BIGINT" : "DOUBLE";
      }
      return sk === "integer" ? "INTEGER" : "REAL";
    }
    case "date":
      if (dialect === "postgresql") return "TIMESTAMPTZ";
      if (dialect === "mysql") return "DATETIME(6)";
      return "TEXT";
    default:
      if (dialect === "mysql") return "LONGTEXT";
      return "TEXT";
  }
}

function formatInsertScalar(
  dialect: SqlDialect,
  kind: CsvColumnKind,
  value: unknown,
  emptyAsNull: boolean,
): string {
  if (isEmptyCell(value)) {
    return emptyAsNull ? "NULL" : kind === "number" ? "NULL" : "''";
  }

  if (kind === "number") {
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
    const n = Number(String(value).trim());
    if (Number.isFinite(n)) return String(n);
    return emptyAsNull ? "NULL" : "0";
  }

  if (kind === "date") {
    const s =
      value instanceof Date
        ? value.toISOString()
        : typeof value === "string"
          ? value.trim()
          : String(value);
    if (s === "") return emptyAsNull ? "NULL" : sqlStringLiteral("");
    if (dialect === "mysql") {
      const iso =
        /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.exec(
          s,
        );
      if (iso) {
        const frac = iso[3] ?? "";
        const micro = frac
          ? frac.slice(1, 7).padEnd(6, "0").slice(0, 6)
          : "000000";
        return sqlStringLiteral(`${iso[1]} ${iso[2]}.${micro}`);
      }
    }
    return sqlStringLiteral(s);
  }

  const text =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? ""
        : String(value);
  return sqlStringLiteral(text);
}

function buildCreateTable(
  dialect: SqlDialect,
  tableSql: string,
  session: CsvViewerSession,
): string {
  const lines: string[] = [];
  lines.push(`CREATE TABLE ${tableSql} (`);
  const parts: string[] = [];
  for (let i = 0; i < session.columnKeys.length; i++) {
    const key = session.columnKeys[i] ?? "";
    const kind = session.columnKinds[i] ?? "short-text";
    const col = quoteIdent(dialect, key);
    const typ = createTableType(dialect, kind, session.rows, key);
    parts.push(`  ${col} ${typ}`);
  }
  lines.push(parts.join(",\n"));
  lines.push(");");
  return lines.join("\n");
}

function buildInsertChunks(
  dialect: SqlDialect,
  tableSql: string,
  session: CsvViewerSession,
  rowsPerInsert: number,
  emptyAsNull: boolean,
): string[] {
  if (session.rows.length === 0) return [];

  const cols = session.columnKeys.map((k) => quoteIdent(dialect, k));
  const colList = cols.join(", ");
  const header = `INSERT INTO ${tableSql} (${colList}) VALUES\n`;

  const chunks: string[] = [];
  for (let start = 0; start < session.rows.length; start += rowsPerInsert) {
    const end = Math.min(start + rowsPerInsert, session.rows.length);
    const valueRows: string[] = [];
    for (const row of session.rows.slice(start, end)) {
      const values = session.columnKeys.map((key, i) => {
        const kind = session.columnKinds[i] ?? "short-text";
        return formatInsertScalar(dialect, kind, row[key], emptyAsNull);
      });
      valueRows.push(`  (${values.join(", ")})`);
    }
    chunks.push(`${header}${valueRows.join(",\n")};`);
  }
  return chunks;
}

/**
 * Turn a loaded CSV session into a SQL script (CREATE TABLE sketch + INSERT batches).
 */
export function csvSessionToSql(
  session: CsvViewerSession,
  options: CsvToSqlOptions = {},
): string {
  const dialect = options.dialect ?? DEFAULT_OPTIONS.dialect;
  const includeCreateTable =
    options.includeCreateTable ?? DEFAULT_OPTIONS.includeCreateTable;
  const includeInserts =
    options.includeInserts ?? DEFAULT_OPTIONS.includeInserts;
  const rowsPerInsert = Math.max(
    1,
    Math.min(
      500,
      Math.floor(options.rowsPerInsert ?? DEFAULT_OPTIONS.rowsPerInsert),
    ),
  );
  const emptyAsNull = options.emptyAsNull ?? DEFAULT_OPTIONS.emptyAsNull;

  const rawName =
    options.tableName?.trim() || defaultTableNameFromFileName(session.fileName);
  const tableStem = rawName
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  const safeTable =
    tableStem.length > 0
      ? tableStem.slice(0, MAX_IDENTIFIER_LEN)
      : "imported_csv";
  const tableSql = quoteIdent(dialect, safeTable);

  const sections: string[] = [];
  sections.push(
    "-- Sketch generated from CSV (types inferred from a sample; review before production).",
    `-- Dialect: ${dialect}`,
    "",
  );

  if (includeCreateTable) {
    sections.push(buildCreateTable(dialect, tableSql, session), "");
  }

  if (includeInserts) {
    sections.push(
      ...buildInsertChunks(
        dialect,
        tableSql,
        session,
        rowsPerInsert,
        emptyAsNull,
      ),
    );
  }

  return `${sections.join("\n").trimEnd()}\n`;
}
