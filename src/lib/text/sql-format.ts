import {
  format,
  type IndentStyle,
  type KeywordCase,
  type SqlLanguage,
  supportedDialects,
} from "sql-formatter";

export interface SqlFormatResult {
  ok: boolean;
  text: string;
  error?: string;
}

export interface SqlFormatOptions {
  language: SqlLanguage;
  tabWidth: number;
  keywordCase: KeywordCase;
  indentStyle: IndentStyle;
}

/** Dialect ids for UI; omits `tsql` (alias of `transactsql`). */
export const SQL_FORMAT_DIALECT_IDS = [...supportedDialects]
  .filter((d) => d !== "tsql")
  .sort() as SqlLanguage[];

const DIALECT_LABELS: Partial<Record<SqlLanguage, string>> = {
  bigquery: "BigQuery",
  clickhouse: "ClickHouse",
  db2: "IBM Db2",
  db2i: "IBM Db2 for i",
  duckdb: "DuckDB",
  hive: "Hive",
  mariadb: "MariaDB",
  mysql: "MySQL",
  n1ql: "N1QL (Couchbase)",
  plsql: "PL/SQL (Oracle)",
  postgresql: "PostgreSQL",
  redshift: "Amazon Redshift",
  singlestoredb: "SingleStore",
  snowflake: "Snowflake",
  spark: "Spark SQL",
  sql: "Standard SQL",
  sqlite: "SQLite",
  tidb: "TiDB",
  transactsql: "T-SQL (SQL Server)",
  trino: "Trino",
};

function stripBom(input: string): string {
  return input.replace(/^\uFEFF/, "");
}

function errorToMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message || error.name || fallback;
  if (typeof error === "string" && error.trim()) return error.trim();
  return fallback;
}

/** First line only; sql-formatter parse errors include a long grammar trace. */
function shortenFormatError(message: string): string {
  const line = message.split("\n")[0]?.trim() ?? message;
  return line.length > 280 ? `${line.slice(0, 277)}...` : line;
}

export function dialectLabel(id: SqlLanguage): string {
  return DIALECT_LABELS[id] ?? id;
}

export function formatSqlString(
  input: string,
  options: SqlFormatOptions,
): SqlFormatResult {
  const raw = stripBom(input);
  if (!raw.trim()) return { ok: true, text: "" };

  try {
    const text = format(raw, {
      language: options.language,
      tabWidth: Math.min(8, Math.max(1, Math.floor(options.tabWidth))),
      useTabs: false,
      keywordCase: options.keywordCase,
      indentStyle: options.indentStyle,
      logicalOperatorNewline: "before",
    });
    return { ok: true, text };
  } catch (e) {
    return {
      ok: false,
      text: "",
      error: shortenFormatError(errorToMessage(e, "Could not format SQL")),
    };
  }
}
