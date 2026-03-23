import type { DragEndEvent } from "@dnd-kit/core";
import { moveArrayElement } from "@/lib/move-array-element";

export interface VirtualizedRowReorderContext {
  scrollEl: HTMLElement;
  headerHeight: number;
  rowHeightPx: number;
}

/**
 * Virtualized body: only visible rows mount as droppables. Map drop index from
 * the drag overlay rect and scroll offset. Returns `undefined` when `translated`
 * is missing (e.g. keyboard) or pointer maps outside the scroll container.
 */
export function resolveVirtualizedRowOrderOnDragEnd(
  event: DragEndEvent,
  rowIds: string[],
  context: VirtualizedRowReorderContext,
): string[] | undefined {
  const translated = event.active.rect.current.translated;
  if (!translated) {
    return undefined;
  }

  const centerY = translated.top + translated.height / 2;
  const { scrollEl, headerHeight, rowHeightPx } = context;
  if (rowHeightPx <= 0 || rowIds.length === 0) {
    return undefined;
  }
  const rect = scrollEl.getBoundingClientRect();
  if (centerY < rect.top || centerY > rect.bottom) {
    return undefined;
  }

  const contentY = scrollEl.scrollTop + (centerY - rect.top);
  const yRows = contentY - headerHeight;
  const targetIndex =
    yRows < 0
      ? 0
      : Math.min(
          rowIds.length - 1,
          Math.max(0, Math.floor(yRows / rowHeightPx)),
        );

  const activeIndex = rowIds.indexOf(String(event.active.id));
  if (activeIndex < 0) {
    return undefined;
  }

  if (targetIndex === activeIndex) {
    return rowIds;
  }

  return moveArrayElement(rowIds, activeIndex, targetIndex);
}
