export interface PdfPageRange {
  /** 1-based, inclusive */
  start: number;
  /** 1-based, inclusive */
  end: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Parses a user page selection string like "1-3,5,7-9" into sorted, merged ranges.
 *
 * - 1-based page numbers
 * - clamps values to [1, pageCount]
 * - ignores invalid tokens (caller can treat empty result as invalid if input was non-empty)
 * - merges overlapping/adjacent ranges
 */
export function parsePdfPageSelection(input: string, pageCount: number): PdfPageRange[] {
  const safePageCount = Math.max(0, Math.floor(pageCount));
  if (safePageCount <= 0) return [];

  const text = input.trim();
  if (!text) return [];

  const ranges: PdfPageRange[] = [];
  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const a = Number.parseInt(m[1]!, 10);
    const b = Number.parseInt(m[2] ?? m[1]!, 10);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    const start = clamp(Math.min(a, b), 1, safePageCount);
    const end = clamp(Math.max(a, b), 1, safePageCount);
    ranges.push({ start, end });
  }

  const normalized = ranges
    .filter((r) => r.start >= 1 && r.end >= 1 && r.start <= safePageCount && r.end <= safePageCount)
    .sort((x, y) => x.start - y.start || x.end - y.end);

  if (normalized.length <= 1) return normalized;

  const merged: PdfPageRange[] = [];
  for (const r of normalized) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push({ ...r });
      continue;
    }
    if (r.start <= last.end + 1) {
      last.end = Math.max(last.end, r.end);
      continue;
    }
    merged.push({ ...r });
  }

  return merged;
}

