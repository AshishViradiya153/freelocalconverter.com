/**
 * Reorder `rows` to match `orderedIds` (same multiset of ids). If any id is
 * missing or lengths differ, returns a shallow copy of `rows` (no reorder).
 */
export function reorderRowsByStableIds<T>(
  rows: readonly T[],
  getRowId: (row: T) => string,
  orderedIds: readonly string[],
): T[] {
  if (orderedIds.length !== rows.length || rows.length === 0) {
    return [...rows];
  }

  const map = new Map<string, T>();
  for (const row of rows) {
    map.set(getRowId(row), row);
  }

  const out: T[] = [];
  for (const id of orderedIds) {
    const row = map.get(id);
    if (row === undefined) {
      return [...rows];
    }
    out.push(row);
  }

  return out;
}
