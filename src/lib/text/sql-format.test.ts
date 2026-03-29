import { describe, expect, it } from "vitest";

import {
  dialectLabel,
  formatSqlString,
  SQL_FORMAT_DIALECT_IDS,
} from "./sql-format";

describe("SQL_FORMAT_DIALECT_IDS", () => {
  it("lists dialects without the tsql alias", () => {
    expect(SQL_FORMAT_DIALECT_IDS).not.toContain("tsql");
    expect(SQL_FORMAT_DIALECT_IDS).toContain("transactsql");
    expect(SQL_FORMAT_DIALECT_IDS).toContain("postgresql");
  });
});

describe("dialectLabel", () => {
  it("returns friendly names for common engines", () => {
    expect(dialectLabel("postgresql")).toBe("PostgreSQL");
    expect(dialectLabel("transactsql")).toBe("T-SQL (SQL Server)");
  });
});

describe("formatSqlString", () => {
  it("returns empty output for whitespace-only input", () => {
    const r = formatSqlString("  \n  ", {
      language: "sql",
      tabWidth: 2,
      keywordCase: "upper",
      indentStyle: "standard",
    });
    expect(r.ok).toBe(true);
    expect(r.text).toBe("");
  });

  it("formats a simple SELECT with uppercase keywords", () => {
    const r = formatSqlString("select a,b from t where id=1", {
      language: "sql",
      tabWidth: 2,
      keywordCase: "upper",
      indentStyle: "standard",
    });
    expect(r.ok).toBe(true);
    expect(r.text).toMatch(/SELECT/);
    expect(r.text).toMatch(/FROM/);
    expect(r.text).toMatch(/WHERE/);
  });

  it("respects PostgreSQL double-quoted identifiers", () => {
    const r = formatSqlString('select "order" from public."User" limit 1', {
      language: "postgresql",
      tabWidth: 2,
      keywordCase: "lower",
      indentStyle: "standard",
    });
    expect(r.ok).toBe(true);
    expect(r.text).toContain('"order"');
    expect(r.text).toContain('"User"');
  });

  it("returns ok false with a short error for invalid SQL", () => {
    const r = formatSqlString("SELECT (((", {
      language: "postgresql",
      tabWidth: 2,
      keywordCase: "preserve",
      indentStyle: "standard",
    });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
    expect(r.error?.includes("Parse error")).toBe(true);
    expect(r.error?.length ?? 0).toBeLessThan(400);
  });

  it("supports tabular indent style", () => {
    const r = formatSqlString("select a from t", {
      language: "sql",
      tabWidth: 2,
      keywordCase: "upper",
      indentStyle: "tabularLeft",
    });
    expect(r.ok).toBe(true);
    expect(r.text.length).toBeGreaterThan(0);
  });
});
