import type { DragEndEvent } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { resolveVirtualizedRowOrderOnDragEnd } from "@/lib/data-grid-virtual-row-reorder";

function makeDragEndEvent(
  activeId: string,
  translated: { top: number; left?: number; width?: number; height: number },
): DragEndEvent {
  return {
    active: {
      id: activeId,
      data: { current: undefined },
      rect: {
        current: {
          initial: null,
          translated: {
            top: translated.top,
            left: translated.left ?? 0,
            width: translated.width ?? 100,
            height: translated.height,
            bottom: translated.top + translated.height,
            right: (translated.left ?? 0) + (translated.width ?? 100),
          },
        },
      },
    },
  } as unknown as DragEndEvent;
}

function mockScrollEl(
  viewportTop: number,
  viewportHeight: number,
  scrollTop: number,
): HTMLElement {
  const el = {
    scrollTop,
    getBoundingClientRect: () => ({
      top: viewportTop,
      left: 0,
      bottom: viewportTop + viewportHeight,
      right: 400,
      width: 400,
      height: viewportHeight,
      x: 0,
      y: viewportTop,
      toJSON: () => ({}),
    }),
  };
  return el as unknown as HTMLElement;
}

describe("resolveVirtualizedRowOrderOnDragEnd", () => {
  const rowIds = ["r0", "r1", "r2", "r3"];
  const headerHeight = 40;
  const rowHeightPx = 36;

  it("returns undefined when translated rect is missing", () => {
    const event = {
      active: {
        id: "r1",
        data: { current: undefined },
        rect: { current: { initial: null, translated: null } },
      },
    } as unknown as DragEndEvent;

    const scrollEl = mockScrollEl(0, 500, 0);
    expect(
      resolveVirtualizedRowOrderOnDragEnd(event, rowIds, {
        scrollEl,
        headerHeight,
        rowHeightPx,
      }),
    ).toBeUndefined();
  });

  it("returns undefined when drag center is outside scroll viewport", () => {
    const scrollEl = mockScrollEl(100, 200, 0);
    const event = makeDragEndEvent("r1", { top: 50, height: 36 });
    expect(
      resolveVirtualizedRowOrderOnDragEnd(event, rowIds, {
        scrollEl,
        headerHeight,
        rowHeightPx,
      }),
    ).toBeUndefined();
  });

  it("maps drop to row index from scroll content Y and arrayMoves", () => {
    const scrollEl = mockScrollEl(0, 400, 0);
    // contentY = 0 + centerY; want target index 2 -> row 2 band [header+72, header+108)
    // center contentY = header + 2*rowH + rowH/2 = 40 + 72 + 18 = 130
    const event = makeDragEndEvent("r1", { top: 130 - 18, height: 36 });
    const next = resolveVirtualizedRowOrderOnDragEnd(event, rowIds, {
      scrollEl,
      headerHeight,
      rowHeightPx,
    });
    expect(next).toEqual(["r0", "r2", "r1", "r3"]);
  });

  it("uses scrollTop when scrolled", () => {
    const scrollEl = mockScrollEl(0, 200, 72);
    // viewport row0 is scrolled out; first visible is old row2 at body y=0 in view
    // contentY = 72 + centerOffset; place center in first visible row slot (index 2)
    // Row 2 in content starts at header + 2*36 = 112; center 112+18=130 still in content coords
    // In viewport: 130 - 72 = 58 -> centerY = 58
    const event = makeDragEndEvent("r0", { top: 58 - 18, height: 36 });
    const next = resolveVirtualizedRowOrderOnDragEnd(event, rowIds, {
      scrollEl,
      headerHeight,
      rowHeightPx,
    });
    expect(next).toEqual(["r1", "r2", "r0", "r3"]);
  });

  it("returns same array reference when target equals active index", () => {
    const scrollEl = mockScrollEl(0, 400, 0);
    // Row 1 center in content: 40 + 36 + 18 = 94
    const event = makeDragEndEvent("r1", { top: 94 - 18, height: 36 });
    const next = resolveVirtualizedRowOrderOnDragEnd(event, rowIds, {
      scrollEl,
      headerHeight,
      rowHeightPx,
    });
    expect(next).toBe(rowIds);
  });

  it("clamps target to 0 when y is in header band", () => {
    const scrollEl = mockScrollEl(0, 400, 0);
    const event = makeDragEndEvent("r2", { top: 20, height: 20 });
    const next = resolveVirtualizedRowOrderOnDragEnd(event, rowIds, {
      scrollEl,
      headerHeight,
      rowHeightPx,
    });
    expect(next).toEqual(["r2", "r0", "r1", "r3"]);
  });
});
