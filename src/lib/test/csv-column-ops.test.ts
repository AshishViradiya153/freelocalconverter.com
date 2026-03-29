import { describe, expect, it } from "vitest";
import {
  applyColumnPasteToSession,
  buildColumnClipboardPayload,
  type ColumnClipboardPayload,
  cellValueToPlainString,
  columnClipboardToTsv,
  padColumnValuesToRowCount,
  parseClipboardTextToColumnLines,
  resolvePastedColumn,
} from "@/lib/csv-column-ops";
import { parseCsvText } from "@/lib/csv-import";
import { resultToSession } from "@/lib/csv-viewer-session";

describe("csv-column-ops", () => {
  describe("cellValueToPlainString", () => {
    it("stringifies null and undefined as empty string", () => {
      expect(cellValueToPlainString(null)).toBe("");
      expect(cellValueToPlainString(undefined)).toBe("");
    });

    it("passes through strings and numbers", () => {
      expect(cellValueToPlainString("x")).toBe("x");
      expect(cellValueToPlainString(42)).toBe("42");
    });

    it("serializes Date as ISO string", () => {
      const d = new Date("2024-06-01T12:00:00.000Z");
      expect(cellValueToPlainString(d)).toBe("2024-06-01T12:00:00.000Z");
    });
  });

  describe("parseClipboardTextToColumnLines", () => {
    it("splits on LF and trims trailing empty lines", () => {
      expect(parseClipboardTextToColumnLines("a\nb\n")).toEqual(["a", "b"]);
    });

    it("handles CRLF", () => {
      expect(parseClipboardTextToColumnLines("a\r\nb")).toEqual(["a", "b"]);
    });

    it("returns empty array for whitespace-only trailing runs", () => {
      expect(parseClipboardTextToColumnLines("\n\n  \n")).toEqual([]);
    });

    it("keeps internal empty lines", () => {
      expect(parseClipboardTextToColumnLines("a\n\nb")).toEqual(["a", "", "b"]);
    });
  });

  describe("resolvePastedColumn", () => {
    it("defaults label and kind for unknown clipboard", () => {
      const r = resolvePastedColumn("one\ntwo", null);
      expect(r).toEqual({
        headerLabel: "Pasted column",
        kind: "short-text",
        values: ["one", "two"],
      });
    });

    it("restores metadata when clipboard matches internal payload", () => {
      const internal: ColumnClipboardPayload = {
        headerLabel: "SKU",
        kind: "number",
        values: ["1", "2"],
      };
      const text = columnClipboardToTsv(internal);
      const r = resolvePastedColumn(text, internal);
      expect(r.headerLabel).toBe("SKU");
      expect(r.kind).toBe("number");
      expect(r.values).toEqual(["1", "2"]);
    });

    it("does not restore metadata when clipboard text differs", () => {
      const internal: ColumnClipboardPayload = {
        headerLabel: "SKU",
        kind: "number",
        values: ["1", "2"],
      };
      const r = resolvePastedColumn("1\n2\n3", internal);
      expect(r.headerLabel).toBe("Pasted column");
      expect(r.kind).toBe("short-text");
      expect(r.values).toEqual(["1", "2", "3"]);
    });
  });

  describe("padColumnValuesToRowCount", () => {
    it("pads with empty strings when values are short", () => {
      expect(padColumnValuesToRowCount(["a"], 3)).toEqual(["a", "", ""]);
    });

    it("truncates excess values when scanning by index", () => {
      expect(padColumnValuesToRowCount(["a", "b", "c"], 2)).toEqual(["a", "b"]);
    });
  });

  describe("buildColumnClipboardPayload", () => {
    it("returns null for unknown column id", () => {
      const r = parseCsvText("a,b\n1,2");
      const s = resultToSession("t.csv", r, "ltr");
      expect(buildColumnClipboardPayload(s, "missing")).toBeNull();
    });

    it("collects labels, kind, and cell strings", () => {
      const r = parseCsvText("a,b\n1,2");
      const s = resultToSession("t.csv", r, "ltr");
      const key = s.columnKeys[0];
      if (!key) throw new Error("fixture: expected column key");
      const p = buildColumnClipboardPayload(s, key);
      expect(p?.headerLabel).toBeTruthy();
      expect(p?.kind).toBeDefined();
      expect(p?.values).toHaveLength(1);
    });
  });

  describe("columnClipboardToTsv", () => {
    it("joins with newline", () => {
      const p: ColumnClipboardPayload = {
        headerLabel: "x",
        kind: "short-text",
        values: ["a", "b"],
      };
      expect(columnClipboardToTsv(p)).toBe("a\nb");
    });
  });

  describe("applyColumnPasteToSession", () => {
    it("returns null for unknown anchor column", () => {
      const r = parseCsvText("a,b\n1,2");
      const s = resultToSession("t.csv", r, "ltr");
      expect(
        applyColumnPasteToSession(s, {
          afterColumnId: "nope",
          newColumnKey: "z",
          clipboardText: "x",
          internal: null,
        }),
      ).toBeNull();
    });

    it("returns null for empty paste after trimming", () => {
      const r = parseCsvText("a,b\n1,2");
      const s = resultToSession("t.csv", r, "ltr");
      const anchor = s.columnKeys[0];
      if (!anchor) throw new Error("fixture: expected column key");
      expect(
        applyColumnPasteToSession(s, {
          afterColumnId: anchor,
          newColumnKey: "z",
          clipboardText: "\n\n",
          internal: null,
        }),
      ).toBeNull();
    });

    it("inserts after anchor and pads to row count", () => {
      const r = parseCsvText("a,b\n1,2\n3,4");
      const s = resultToSession("t.csv", r, "ltr");
      const anchor = s.columnKeys[0];
      if (!anchor) throw new Error("fixture: expected column key");
      const next = applyColumnPasteToSession(s, {
        afterColumnId: anchor,
        newColumnKey: "pasted",
        clipboardText: "x\ny",
        internal: null,
      });
      expect(next).not.toBeNull();
      expect(next?.columnKeys.indexOf("pasted")).toBe(1);
      expect(next?.rows).toHaveLength(2);
      expect(next?.rows[0]?.pasted).toBe("x");
      expect(next?.rows[1]?.pasted).toBe("y");
    });

    it("uses internal metadata when clipboard matches", () => {
      const r = parseCsvText("a,b\n1,2");
      const s = resultToSession("t.csv", r, "ltr");
      const anchor = s.columnKeys[0];
      if (!anchor) throw new Error("fixture: expected column key");
      const internal: ColumnClipboardPayload = {
        headerLabel: "Qty",
        kind: "number",
        values: ["9"],
      };
      const text = columnClipboardToTsv(internal);
      const next = applyColumnPasteToSession(s, {
        afterColumnId: anchor,
        newColumnKey: "q",
        clipboardText: text,
        internal,
      });
      expect(next?.headerLabels[next.columnKeys.indexOf("q")]).toBe("Qty");
      expect(next?.columnKinds[next.columnKeys.indexOf("q")]).toBe("number");
    });
  });
});
