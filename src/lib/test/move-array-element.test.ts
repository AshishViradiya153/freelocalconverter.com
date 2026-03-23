import { arrayMove } from "@dnd-kit/sortable";
import { describe, expect, it } from "vitest";
import { moveArrayElement } from "@/lib/move-array-element";

describe("moveArrayElement", () => {
  it("returns a new array when from === to", () => {
    const a = [1, 2, 3];
    const b = moveArrayElement(a, 1, 1);
    expect(b).toEqual([1, 2, 3]);
    expect(b).not.toBe(a);
  });

  it("moves forward", () => {
    expect(moveArrayElement(["a", "b", "c", "d"], 1, 3)).toEqual([
      "a",
      "c",
      "d",
      "b",
    ]);
  });

  it("moves backward", () => {
    expect(moveArrayElement(["a", "b", "c", "d"], 3, 1)).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("moves adjacent down", () => {
    expect(moveArrayElement([0, 1, 2], 0, 1)).toEqual([1, 0, 2]);
  });

  it("moves adjacent up", () => {
    expect(moveArrayElement([0, 1, 2], 2, 1)).toEqual([0, 2, 1]);
  });

  it("matches dnd-kit arrayMove for random small permutations", () => {
    const base = ["x", "y", "z", "w", "v"];
    for (let from = 0; from < base.length; from++) {
      for (let to = 0; to < base.length; to++) {
        const a = [...base];
        expect(moveArrayElement(a, from, to)).toEqual(arrayMove(a, from, to));
      }
    }
  });
});
