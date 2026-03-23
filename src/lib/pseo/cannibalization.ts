import type { PseoPageRecord } from "./types";

/**
 * Ensures each `primaryKeyword` maps to at most one page (case-insensitive).
 * Add CI coverage so new pages cannot steal another URL's intent.
 */
export function assertNoKeywordCannibalization(
  pages: readonly PseoPageRecord[],
) {
  const map = new Map<string, string>();
  for (const p of pages) {
    const key = p.primaryKeyword.trim().toLowerCase();
    const existing = map.get(key);
    if (existing && existing !== p.id) {
      throw new Error(
        `pSEO cannibalization: primaryKeyword "${p.primaryKeyword}" used by both id "${existing}" and "${p.id}"`,
      );
    }
    map.set(key, p.id);
  }
}
