import { describe, expect, it } from "vitest";
import type { CsvViewerSession } from "@/lib/csv-viewer-session";
import {
  csvSessionToSql,
  defaultTableNameFromFileName,
} from "./csv-sql-transform";

function makeSession(
  partial: Pick<
    CsvViewerSession,
    | "fileName"
    | "columnKeys"
    | "headerLabels"
    | "columnKinds"
    | "rows"
    | "truncated"
    | "rowCountBeforeCap"
    | "importedRowCount"
  >,
): CsvViewerSession {
  return {
    version: 1,
    dir: "ltr",
    ...partial,
  };
}

describe("defaultTableNameFromFileName", () => {
  it("strips extension and normalizes", () => {
    expect(defaultTableNameFromFileName("Orders Export.csv")).toBe(
      "orders_export",
    );
    expect(defaultTableNameFromFileName("2024-report.csv")).toBe(
      "t_2024_report",
    );
  });
});

describe("csvSessionToSql", () => {
  it("quotes identifiers and emits CREATE + INSERT for PostgreSQL", () => {
    const session = makeSession({
      fileName: "users.csv",
      columnKeys: ["name", "user", "age"],
      headerLabels: ["Name", "User", "Age"],
      columnKinds: ["short-text", "short-text", "number"],
      rows: [
        {
          id: "a",
          name: "Ann",
          user: "ann",
          age: 30,
        },
        {
          id: "b",
          name: "O'Brien",
          user: "",
          age: 41,
        },
      ],
      truncated: false,
      rowCountBeforeCap: 2,
      importedRowCount: 2,
    });

    const sql = csvSessionToSql(session, { dialect: "postgresql" });
    expect(sql).toContain('CREATE TABLE "users" (');
    expect(sql).toContain('"name" TEXT');
    expect(sql).toContain('"user" TEXT');
    expect(sql).toContain('"age" BIGINT');
    expect(sql).toContain(`('Ann', 'ann', 30)`);
    expect(sql).toContain(`('O''Brien', NULL, 41)`);
  });

  it("uses DOUBLE when decimals appear in a numeric column", () => {
    const session = makeSession({
      fileName: "data.csv",
      columnKeys: ["x"],
      headerLabels: ["X"],
      columnKinds: ["number"],
      rows: [
        { id: "1", x: 1 },
        { id: "2", x: 2.5 },
      ],
      truncated: false,
      rowCountBeforeCap: 2,
      importedRowCount: 2,
    });
    const sql = csvSessionToSql(session, { dialect: "postgresql" });
    expect(sql).toContain('"x" DOUBLE PRECISION');
  });

  it("uses backticks for MySQL", () => {
    const session = makeSession({
      fileName: "t.csv",
      columnKeys: ["select"],
      headerLabels: ["select"],
      columnKinds: ["short-text"],
      rows: [{ id: "1", select: "ok" }],
      truncated: false,
      rowCountBeforeCap: 1,
      importedRowCount: 1,
    });
    const sql = csvSessionToSql(session, { dialect: "mysql" });
    expect(sql).toContain("CREATE TABLE `t` (");
    expect(sql).toContain("`select` LONGTEXT");
    expect(sql).toContain("('ok')");
  });

  it("batches INSERTs by rowsPerInsert", () => {
    const session = makeSession({
      fileName: "batch.csv",
      columnKeys: ["n"],
      headerLabels: ["N"],
      columnKinds: ["number"],
      rows: [
        { id: "1", n: 1 },
        { id: "2", n: 2 },
        { id: "3", n: 3 },
      ],
      truncated: false,
      rowCountBeforeCap: 3,
      importedRowCount: 3,
    });
    const sql = csvSessionToSql(session, {
      dialect: "sqlite",
      rowsPerInsert: 2,
      includeCreateTable: false,
    });
    const inserts = sql.split(/INSERT INTO/).length - 1;
    expect(inserts).toBe(2);
  });

  it("respects emptyAsNull false for text columns", () => {
    const session = makeSession({
      fileName: "e.csv",
      columnKeys: ["a"],
      headerLabels: ["A"],
      columnKinds: ["short-text"],
      rows: [{ id: "1", a: "" }],
      truncated: false,
      rowCountBeforeCap: 1,
      importedRowCount: 1,
    });
    const sql = csvSessionToSql(session, {
      dialect: "postgresql",
      includeCreateTable: false,
      emptyAsNull: false,
    });
    expect(sql).toContain("('')");
  });

  it("honors custom tableName", () => {
    const session = makeSession({
      fileName: "ignore.csv",
      columnKeys: ["k"],
      headerLabels: ["K"],
      columnKinds: ["short-text"],
      rows: [{ id: "1", k: "v" }],
      truncated: false,
      rowCountBeforeCap: 1,
      importedRowCount: 1,
    });
    const sql = csvSessionToSql(session, {
      tableName: "my_table",
      dialect: "postgresql",
      includeInserts: false,
    });
    expect(sql).toContain('CREATE TABLE "my_table"');
  });

  it("can omit CREATE or INSERT", () => {
    const session = makeSession({
      fileName: "x.csv",
      columnKeys: ["k"],
      headerLabels: ["K"],
      columnKinds: ["short-text"],
      rows: [{ id: "1", k: "v" }],
      truncated: false,
      rowCountBeforeCap: 1,
      importedRowCount: 1,
    });
    expect(
      csvSessionToSql(session, { includeCreateTable: false }),
    ).not.toContain("CREATE TABLE");
    expect(csvSessionToSql(session, { includeInserts: false })).not.toContain(
      "INSERT INTO",
    );
  });
});
