import { describe, expect, it } from "vitest";
import { formatJson, minifyJson } from "@/lib/text/json-transform";

describe("json-transform", () => {
  it("formats JSON with spaces", () => {
    expect(formatJson('{"a":1,"b":[2,3]}', 2)).toEqual({
      ok: true,
      text: '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}',
    });
  });

  it("minifies JSON", () => {
    expect(minifyJson('{ "a": 1, "b": [2, 3] }')).toEqual({
      ok: true,
      text: '{"a":1,"b":[2,3]}',
    });
  });

  it("returns ok for empty input", () => {
    expect(formatJson("   ", 2)).toEqual({ ok: true, text: "" });
    expect(minifyJson("   ")).toEqual({ ok: true, text: "" });
  });

  it("returns error on invalid JSON", () => {
    const r = formatJson("{", 2);
    expect(r.ok).toBe(false);
    expect(r.text).toBe("");
    expect(typeof r.error).toBe("string");
  });

  it("handles UTF-8 BOM prefix", () => {
    expect(minifyJson('\uFEFF{ "a": 1 }')).toEqual({
      ok: true,
      text: '{"a":1}',
    });
  });

  it("clamps indent spaces to 0..8", () => {
    expect(formatJson('{"a":1}', 99)).toEqual({
      ok: true,
      text: '{\n        "a": 1\n}',
    });
    expect(formatJson('{"a":1}', -10)).toEqual({
      ok: true,
      text: '{"a":1}',
    });
  });
});
