import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePinnedTools } from "@/hooks/use-pinned-tools";
import {
  PINNED_TOOLS_STORAGE_KEY,
  readPinnedToolHrefsFromStorage,
} from "@/lib/pinned-tool-hrefs";

describe("usePinnedTools", () => {
  afterEach(() => {
    localStorage.removeItem(PINNED_TOOLS_STORAGE_KEY);
  });

  it("starts empty when storage is empty", () => {
    const { result } = renderHook(() => usePinnedTools());
    expect(result.current.pinnedHrefs).toEqual([]);
    expect(result.current.isPinned("/x")).toBe(false);
  });

  it("loads initial hrefs from localStorage", () => {
    localStorage.setItem(
      PINNED_TOOLS_STORAGE_KEY,
      JSON.stringify(["/csv-viewer", "/json-formatter"]),
    );
    const { result } = renderHook(() => usePinnedTools());
    expect(result.current.pinnedHrefs).toEqual([
      "/csv-viewer",
      "/json-formatter",
    ]);
    expect(result.current.isPinned("/csv-viewer")).toBe(true);
    expect(result.current.isPinned("/other")).toBe(false);
  });

  it("togglePinned appends then removes and persists", () => {
    const { result } = renderHook(() => usePinnedTools());

    act(() => {
      result.current.togglePinned("/merge-pdf");
    });
    expect(result.current.pinnedHrefs).toEqual(["/merge-pdf"]);
    expect(readPinnedToolHrefsFromStorage()).toEqual(["/merge-pdf"]);

    act(() => {
      result.current.togglePinned("/split-pdf");
    });
    expect(result.current.pinnedHrefs).toEqual(["/merge-pdf", "/split-pdf"]);

    act(() => {
      result.current.togglePinned("/merge-pdf");
    });
    expect(result.current.pinnedHrefs).toEqual(["/split-pdf"]);
    expect(readPinnedToolHrefsFromStorage()).toEqual(["/split-pdf"]);
  });

  it("syncs from storage event (other tab)", () => {
    localStorage.setItem(PINNED_TOOLS_STORAGE_KEY, JSON.stringify(["/a"]));
    const { result } = renderHook(() => usePinnedTools());
    expect(result.current.pinnedHrefs).toEqual(["/a"]);

    localStorage.setItem(
      PINNED_TOOLS_STORAGE_KEY,
      JSON.stringify(["/b", "/c"]),
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: PINNED_TOOLS_STORAGE_KEY,
          newValue: JSON.stringify(["/b", "/c"]),
        }),
      );
    });

    expect(result.current.pinnedHrefs).toEqual(["/b", "/c"]);
  });

  it("ignores storage events for other keys", () => {
    const { result } = renderHook(() => usePinnedTools());
    act(() => {
      result.current.togglePinned("/x");
    });
    const before = result.current.pinnedHrefs;

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "other-key",
          newValue: "[]",
        }),
      );
    });

    expect(result.current.pinnedHrefs).toEqual(before);
  });
});
