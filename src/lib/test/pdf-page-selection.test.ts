import { describe, expect, it } from "vitest";
import { parsePdfPageSelection } from "@/lib/pdf/page-selection";

describe("parsePdfPageSelection", () => {
  it("returns empty for empty input", () => {
    expect(parsePdfPageSelection("", 10)).toEqual([]);
    expect(parsePdfPageSelection("   ", 10)).toEqual([]);
  });

  it("parses single pages and ranges", () => {
    expect(parsePdfPageSelection("1,3-5", 10)).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 5 },
    ]);
  });

  it("merges overlapping and adjacent ranges", () => {
    expect(parsePdfPageSelection("1-3,3-6,7", 10)).toEqual([{ start: 1, end: 7 }]);
  });

  it("clamps to pageCount", () => {
    expect(parsePdfPageSelection("0-2,9-999", 10)).toEqual([
      { start: 1, end: 2 },
      { start: 9, end: 10 },
    ]);
  });

  it("handles reversed ranges", () => {
    expect(parsePdfPageSelection("5-3", 10)).toEqual([{ start: 3, end: 5 }]);
  });

  it("ignores invalid tokens (caller can treat empty as invalid)", () => {
    expect(parsePdfPageSelection("nope,1-x,2--3", 10)).toEqual([]);
    expect(parsePdfPageSelection("1-2,nope,4", 10)).toEqual([
      { start: 1, end: 2 },
      { start: 4, end: 4 },
    ]);
  });
});

