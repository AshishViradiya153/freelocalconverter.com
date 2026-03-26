import { describe, expect, it } from "vitest";
import { normalizePdfPageOrder } from "@/lib/pdf/page-order";

describe("normalizePdfPageOrder", () => {
  it("returns empty for invalid pageCount", () => {
    expect(normalizePdfPageOrder([1, 2], 0)).toEqual([]);
    expect(normalizePdfPageOrder([1, 2], -5)).toEqual([]);
  });

  it("floors and clamps values", () => {
    expect(normalizePdfPageOrder([1.9, 0, 999], 5)).toEqual([]);
  });

  it("drops non-finite values", () => {
    expect(normalizePdfPageOrder([1, Number.NaN, Number.POSITIVE_INFINITY, 2], 10)).toEqual([1, 2]);
  });

  it("returns empty when there are duplicates", () => {
    expect(normalizePdfPageOrder([1, 2, 2], 10)).toEqual([]);
  });

  it("allows subsets (removed pages) while remaining unique", () => {
    expect(normalizePdfPageOrder([3, 1], 5)).toEqual([3, 1]);
  });
});

