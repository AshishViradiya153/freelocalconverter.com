"use client";

import * as React from "react";

import {
  PINNED_TOOLS_STORAGE_KEY,
  readPinnedToolHrefsFromStorage,
  writePinnedToolHrefsToStorage,
} from "@/lib/pinned-tool-hrefs";

export { readPinnedToolHrefsFromStorage } from "@/lib/pinned-tool-hrefs";

export function usePinnedTools() {
  const [pinnedHrefs, setPinnedHrefs] = React.useState<string[]>([]);

  React.useLayoutEffect(() => {
    setPinnedHrefs(readPinnedToolHrefsFromStorage());
    function onStorage(event: StorageEvent) {
      if (event.key !== PINNED_TOOLS_STORAGE_KEY) return;
      setPinnedHrefs(readPinnedToolHrefsFromStorage());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const pinnedSet = React.useMemo(() => new Set(pinnedHrefs), [pinnedHrefs]);

  const togglePinned = React.useCallback((href: string) => {
    setPinnedHrefs((prev) => {
      const index = prev.indexOf(href);
      const next =
        index >= 0 ? prev.filter((_, i) => i !== index) : [...prev, href];
      writePinnedToolHrefsToStorage(next);
      return next;
    });
  }, []);

  const isPinned = React.useCallback(
    (href: string) => pinnedSet.has(href),
    [pinnedSet],
  );

  return { pinnedHrefs, pinnedSet, togglePinned, isPinned };
}
