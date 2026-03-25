import { describe, expect, it } from "vitest";
import type { CsvViewerSession } from "@/lib/csv-viewer-session";
import { csvSessionToMarkdownTable } from "@/lib/csv-to-markdown";

function makeSession(overrides?: Partial<CsvViewerSession>): CsvViewerSession {
  return {
    version: 1,
    fileName: "test.csv",
    dir: "ltr",
    columnKeys: ["a", "b"],
    headerLabels: ["A", "B"],
    columnKinds: ["short-text", "short-text"],
    rows: [{ id: "r1", a: "x|y", b: "line1\nline2" }],
    truncated: false,
    rowCountBeforeCap: 1,
    importedRowCount: 1,
    ...overrides,
  };
}

describe("csvSessionToMarkdownTable", () => {
  it("escapes pipe separators and preserves newlines via <br/>", () => {
    const session = makeSession({
      rows: [{ id: "r1", a: "x|y", b: "line1\nline2" }],
    });
    const md = csvSessionToMarkdownTable(session);

    // `|` inside cells must be escaped so the table columns don't shift.
    expect(md).toContain("x\\|y");
    // Newlines are rendered via <br/> inside markdown cells.
    expect(md).toContain("line1<br/>line2");
  });

  it("produces a valid markdown table shape", () => {
    const md = csvSessionToMarkdownTable(makeSession());
    const lines = md.trim().split("\n");
    // header + separator + at least one row
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines[0]).toMatch(/^\| .* \|$/);
    expect(lines[1]).toMatch(/^\| .* \|$/);
  });
});

