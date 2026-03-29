import { describe, expect, it } from "vitest";

import {
  jsonStringToYaml,
  yamlStringToJson,
  yamlStringToMinifiedJson,
} from "./json-yaml-transform";

describe("jsonStringToYaml", () => {
  it("converts JSON object to YAML", () => {
    const r = jsonStringToYaml('{"a":1,"b":"x"}', 2);
    expect(r.ok).toBe(true);
    expect(r.text).toContain("a: 1");
    expect(r.text).toContain("b: x");
  });

  it("returns error for invalid JSON", () => {
    const r = jsonStringToYaml("{", 2);
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });
});

describe("yamlStringToJson", () => {
  it("converts YAML to pretty JSON", () => {
    const r = yamlStringToJson("a: 1\nb: x\n", 2);
    expect(r.ok).toBe(true);
    expect(r.text).toContain('"a"');
    expect(r.text).toContain('"b"');
  });

  it("minifies when spaces is 0", () => {
    const r = yamlStringToJson("x: 1", 0);
    expect(r.ok).toBe(true);
    expect(r.text).toBe('{"x":1}');
  });

  it("returns error for invalid YAML", () => {
    const r = yamlStringToJson("a: [", 2);
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });
});

describe("yamlStringToMinifiedJson", () => {
  it("outputs compact JSON", () => {
    const r = yamlStringToMinifiedJson("k: v");
    expect(r.ok).toBe(true);
    expect(r.text).toBe('{"k":"v"}');
  });
});
