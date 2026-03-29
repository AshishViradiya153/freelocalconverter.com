export const PINNED_TOOLS_STORAGE_KEY = "tablecn:pinned-tool-hrefs-v1";

/** Normalizes parsed JSON: valid root-relative paths only, first occurrence wins. */
export function normalizePinnedToolHrefsList(parsed: unknown): string[] {
  if (!Array.isArray(parsed)) return [];
  const hrefs = parsed.filter(
    (x): x is string =>
      typeof x === "string" && x.startsWith("/") && !x.includes("//"),
  );
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const h of hrefs) {
    if (seen.has(h)) continue;
    seen.add(h);
    ordered.push(h);
  }
  return ordered;
}

export function readPinnedToolHrefsFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINNED_TOOLS_STORAGE_KEY);
    if (!raw) return [];
    return normalizePinnedToolHrefsList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writePinnedToolHrefsToStorage(hrefs: string[]) {
  localStorage.setItem(PINNED_TOOLS_STORAGE_KEY, JSON.stringify(hrefs));
}
