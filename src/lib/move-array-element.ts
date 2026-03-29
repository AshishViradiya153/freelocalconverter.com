function at<T>(arr: readonly T[], i: number, ctx: string): T {
  const v = arr[i];
  if (v === undefined) {
    throw new Error(`${ctx}: expected index ${i} (length ${arr.length})`);
  }
  return v;
}

/**
 * Move one element from `from` to `to` in O(n) with one allocation and linear
 * copies (avoids slice + two splices like typical arrayMove).
 */
export function moveArrayElement<T>(
  array: readonly T[],
  from: number,
  to: number,
): T[] {
  const n = array.length;
  if (n === 0) {
    return [];
  }
  if (from === to) {
    return array.slice();
  }
  if (from < 0 || from >= n || to < 0 || to >= n) {
    return array.slice();
  }

  const result = new Array<T>(n);
  const item = at(array, from, "moveArrayElement");

  if (from < to) {
    for (let i = 0; i < from; i++) {
      result[i] = at(array, i, "moveArrayElement");
    }
    for (let i = from; i < to; i++) {
      result[i] = at(array, i + 1, "moveArrayElement");
    }
    result[to] = item;
    for (let i = to + 1; i < n; i++) {
      result[i] = at(array, i, "moveArrayElement");
    }
  } else {
    for (let i = 0; i < to; i++) {
      result[i] = at(array, i, "moveArrayElement");
    }
    result[to] = item;
    for (let i = to + 1; i <= from; i++) {
      result[i] = at(array, i - 1, "moveArrayElement");
    }
    for (let i = from + 1; i < n; i++) {
      result[i] = at(array, i, "moveArrayElement");
    }
  }

  return result;
}
