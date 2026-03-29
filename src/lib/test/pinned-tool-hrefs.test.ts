import { afterEach, describe, expect, it } from "vitest";
import {
  normalizePinnedToolHrefsList,
  PINNED_TOOLS_STORAGE_KEY,
  readPinnedToolHrefsFromStorage,
  writePinnedToolHrefsToStorage,
} from "@/lib/pinned-tool-hrefs";

describe("normalizePinnedToolHrefsList", () => {
  it("returns empty for non-arrays", () => {
    expect(normalizePinnedToolHrefsList(null)).toEqual([]);
    expect(normalizePinnedToolHrefsList(undefined)).toEqual([]);
    expect(normalizePinnedToolHrefsList({})).toEqual([]);
    expect(normalizePinnedToolHrefsList("x")).toEqual([]);
  });

  it("keeps root-relative paths in order", () => {
    expect(normalizePinnedToolHrefsList(["/a", "/b", "/csv-viewer"])).toEqual([
      "/a",
      "/b",
      "/csv-viewer",
    ]);
  });

  it("dedupes preserving first occurrence", () => {
    expect(normalizePinnedToolHrefsList(["/x", "/y", "/x", "/z"])).toEqual([
      "/x",
      "/y",
      "/z",
    ]);
  });

  it("drops invalid entries", () => {
    expect(
      normalizePinnedToolHrefsList([
        "/ok",
        "",
        "no-leading-slash",
        "https://evil.test",
        "/also-ok",
        "//protocol-relative",
        1,
        null,
      ]),
    ).toEqual(["/ok", "/also-ok"]);
  });
});

describe("readPinnedToolHrefsFromStorage / writePinnedToolHrefsToStorage", () => {
  afterEach(() => {
    localStorage.removeItem(PINNED_TOOLS_STORAGE_KEY);
  });

  it("returns empty when missing", () => {
    expect(readPinnedToolHrefsFromStorage()).toEqual([]);
  });

  it("round-trips valid list", () => {
    writePinnedToolHrefsToStorage(["/a", "/b"]);
    expect(readPinnedToolHrefsFromStorage()).toEqual(["/a", "/b"]);
  });

  it("returns empty on invalid JSON", () => {
    localStorage.setItem(PINNED_TOOLS_STORAGE_KEY, "{not json");
    expect(readPinnedToolHrefsFromStorage()).toEqual([]);
  });

  it("normalizes malformed stored array", () => {
    localStorage.setItem(
      PINNED_TOOLS_STORAGE_KEY,
      JSON.stringify(["/keep", "bad", "/keep"]),
    );
    expect(readPinnedToolHrefsFromStorage()).toEqual(["/keep"]);
  });
});
