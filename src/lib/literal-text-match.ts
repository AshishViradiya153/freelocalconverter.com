/**
 * Case-insensitive literal find/replace (needle is plain text, not a pattern).
 *
 * Uses RegExp `u` for Unicode-aware case folding so search and replace stay
 * aligned. Needle is escaped so metacharacters are literal and matching stays
 * linear-time (no ReDoS from user input).
 *
 * @see https://unicode.org/reports/tr18/
 */

export function escapeRegExpLiteral(needle: string): string {
  return needle.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/** Single match test; no `g` flag so `lastIndex` does not advance between cells. */
export function compileInsensitiveLiteralFind(needle: string): RegExp {
  return new RegExp(escapeRegExpLiteral(needle), "iu");
}

/** Replace every occurrence in one string; reset `lastIndex` before each use when reusing. */
export function compileInsensitiveLiteralReplace(needle: string): RegExp {
  return new RegExp(escapeRegExpLiteral(needle), "giu");
}
