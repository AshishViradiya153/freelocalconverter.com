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
  const item = array[from]!;

  if (from < to) {
    for (let i = 0; i < from; i++) {
      result[i] = array[i]!;
    }
    for (let i = from; i < to; i++) {
      result[i] = array[i + 1]!;
    }
    result[to] = item;
    for (let i = to + 1; i < n; i++) {
      result[i] = array[i]!;
    }
  } else {
    for (let i = 0; i < to; i++) {
      result[i] = array[i]!;
    }
    result[to] = item;
    for (let i = to + 1; i <= from; i++) {
      result[i] = array[i - 1]!;
    }
    for (let i = from + 1; i < n; i++) {
      result[i] = array[i]!;
    }
  }

  return result;
}
