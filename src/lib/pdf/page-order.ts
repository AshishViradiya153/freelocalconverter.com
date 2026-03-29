function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Validates and normalizes a 1-based page order array.
 *
 * - Removes non-finite values
 * - Floors numbers
 * - Clamps to [1, pageCount]
 * - Ensures all entries are unique
 *
 * Note: This intentionally allows exporting a subset of pages (after "remove page").
 * If you need "must include every page", compare result length to pageCount upstream.
 */
export function normalizePdfPageOrder(
  order: number[],
  pageCount: number,
): number[] {
  const safePageCount = Math.max(0, Math.floor(pageCount));
  if (safePageCount <= 0) return [];

  const normalized = order
    .map((n) => Math.floor(n))
    .filter((n) => Number.isFinite(n))
    .map((n) => clamp(n, 1, safePageCount));

  if (normalized.length === 0) return [];
  const unique = new Set(normalized);
  if (unique.size !== normalized.length) return [];
  return normalized;
}
