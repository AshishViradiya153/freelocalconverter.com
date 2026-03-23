import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDataGridUndoRedo } from "@/hooks/use-data-grid-undo-redo";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

interface Row {
  id: string;
  v: number;
}

describe("useDataGridUndoRedo", () => {
  describe("trackColumnReorder", () => {
    it("flushes pending cell batch before pushing session entry (LIFO undo)", () => {
      const onDataChange = vi.fn();
      let rows: Row[] = [{ id: "1", v: 0 }];
      const sessionUndo = vi.fn();
      const { result, rerender } = renderHook(
        ({ data }) =>
          useDataGridUndoRedo({
            data,
            onDataChange,
            getRowId: (r) => r.id,
            enabled: true,
          }),
        { initialProps: { data: rows } },
      );

      act(() => {
        result.current.trackCellsUpdate([
          { rowId: "1", columnId: "v", previousValue: 0, newValue: 99 },
        ]);
      });
      act(() => {
        result.current.trackColumnReorder({
          undo: sessionUndo,
          redo: vi.fn(),
        });
      });

      rows = [{ id: "1", v: 99 }];
      rerender({ data: rows });

      act(() => {
        result.current.onUndo();
      });
      expect(sessionUndo).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onUndo();
      });
      expect(onDataChange).toHaveBeenCalledWith([{ id: "1", v: 0 }]);
    });

    it("runs undo and redo callbacks without touching row data", () => {
      const onDataChange = vi.fn();
      const data: Row[] = [{ id: "1", v: 1 }];
      const undo = vi.fn();
      const redo = vi.fn();

      const { result } = renderHook(() =>
        useDataGridUndoRedo({
          data,
          onDataChange,
          getRowId: (r) => r.id,
        }),
      );

      act(() => {
        result.current.trackColumnReorder({ undo, redo });
      });

      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.onUndo();
      });

      expect(undo).toHaveBeenCalledTimes(1);
      expect(onDataChange).not.toHaveBeenCalled();

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.onRedo();
      });

      expect(redo).toHaveBeenCalledTimes(1);
      expect(onDataChange).not.toHaveBeenCalled();
    });

    it("undoes session mutation before row-add when both are on the stack", () => {
      const onDataChange = vi.fn();
      let rows: Row[] = [{ id: "1", v: 1 }];
      const sessionUndo = vi.fn();
      const { result, rerender } = renderHook(
        ({ data }) =>
          useDataGridUndoRedo({
            data,
            onDataChange,
            getRowId: (r) => r.id,
            enabled: true,
          }),
        { initialProps: { data: rows } },
      );

      act(() => {
        result.current.trackRowsAdd([{ id: "2", v: 2 }]);
      });
      rows = [...rows, { id: "2", v: 2 }];
      rerender({ data: rows });

      act(() => {
        result.current.trackColumnReorder({
          undo: sessionUndo,
          redo: vi.fn(),
        });
      });

      act(() => {
        result.current.onUndo();
      });
      expect(sessionUndo).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onUndo();
      });
      expect(onDataChange).toHaveBeenLastCalledWith([{ id: "1", v: 1 }]);
    });
  });

  describe("trackRowReorder", () => {
    it("undo and redo call onDataChange with permuted rows", () => {
      const initial: Row[] = [
        { id: "a", v: 1 },
        { id: "b", v: 2 },
        { id: "c", v: 3 },
      ];
      const reordered: Row[] = [
        { id: "c", v: 3 },
        { id: "a", v: 1 },
        { id: "b", v: 2 },
      ];

      const onDataChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ data }) =>
          useDataGridUndoRedo({
            data,
            onDataChange,
            getRowId: (r) => r.id,
            enabled: true,
          }),
        { initialProps: { data: initial } },
      );

      act(() => {
        result.current.trackRowReorder(["a", "b", "c"], ["c", "a", "b"]);
      });

      rerender({ data: reordered });

      act(() => {
        result.current.onUndo();
      });

      expect(onDataChange).toHaveBeenCalledWith(initial);

      rerender({ data: initial });

      act(() => {
        result.current.onRedo();
      });

      expect(onDataChange).toHaveBeenLastCalledWith(reordered);
    });

    it("does not push history when order is unchanged", () => {
      const data: Row[] = [
        { id: "a", v: 1 },
        { id: "b", v: 2 },
      ];
      const onDataChange = vi.fn();

      const { result } = renderHook(() =>
        useDataGridUndoRedo({
          data,
          onDataChange,
          getRowId: (r) => r.id,
          enabled: true,
        }),
      );

      act(() => {
        result.current.trackRowReorder(["a", "b"], ["a", "b"]);
      });

      expect(result.current.canUndo).toBe(false);
    });
  });
});
