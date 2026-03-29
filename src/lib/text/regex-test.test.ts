import { describe, expect, it } from "vitest";

import {
  buildJsFlagString,
  collectPatternExplainNotes,
  REGEX_MAX_MATCHES,
  type RegexFlagState,
  runRegexTest,
} from "./regex-test";

const defaultFlags: RegexFlagState = {
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  sticky: false,
  hasIndices: false,
};

describe("buildJsFlagString", () => {
  it("orders flags d g i m s u y", () => {
    expect(
      buildJsFlagString({
        global: true,
        ignoreCase: true,
        multiline: true,
        dotAll: true,
        unicode: true,
        sticky: true,
        hasIndices: true,
      }),
    ).toBe("dgimsuy");
  });
});

describe("runRegexTest", () => {
  it("returns syntax error for invalid pattern", () => {
    const r = runRegexTest("(", "abc", defaultFlags);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.kind).toBe("syntax");
    expect(r.message.length).toBeGreaterThan(0);
  });

  it("finds all matches with global flag", () => {
    const r = runRegexTest("\\w+", "a bb ccc", defaultFlags);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.matches.map((m) => m.match)).toEqual(["a", "bb", "ccc"]);
  });

  it("respects multiline for ^ $", () => {
    const r = runRegexTest("^x$", "a\nx\nb", {
      ...defaultFlags,
      global: false,
      multiline: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.matchCount).toBe(1);
    expect(r.matches[0]?.match).toBe("x");
  });

  it("respects dotAll for dot across newlines", () => {
    const r = runRegexTest("a.c", "a\nc", {
      ...defaultFlags,
      global: false,
      dotAll: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.matchCount).toBe(1);
  });

  it("captures groups and named groups", () => {
    const r = runRegexTest("(?<y>\\d{4})-(?<m>\\d{2})", "2020-03-15", {
      ...defaultFlags,
      global: false,
      unicode: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.matches[0]?.named).toEqual({ y: "2020", m: "03" });
    expect(r.matches[0]?.captures).toEqual(["2020", "03"]);
  });

  it("truncates match list at REGEX_MAX_MATCHES", () => {
    const r = runRegexTest("a", "a".repeat(REGEX_MAX_MATCHES + 50), {
      ...defaultFlags,
      global: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.matches.length).toBe(REGEX_MAX_MATCHES);
    expect(r.matchesTruncated).toBe(true);
  });

  it("truncates long subject", () => {
    const long = "x".repeat(600_000);
    const r = runRegexTest("x", long, defaultFlags);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.subjectWasTruncated).toBe(true);
    expect(r.matchCount).toBeLessThanOrEqual(REGEX_MAX_MATCHES);
  });
});

describe("collectPatternExplainNotes", () => {
  it("warns when \\p is used without unicode flag", () => {
    const notes = collectPatternExplainNotes("\\p{L}+", {
      ...defaultFlags,
      unicode: false,
    });
    expect(notes.some((n) => n.includes("u (unicode)"))).toBe(true);
  });
});
