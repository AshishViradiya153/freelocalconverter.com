import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { CsvViewerRow } from "@/lib/csv-import";
import {
  CSV_VIEWER_IDB_ROW_CHUNK_SIZE,
  clearCsvViewerSession,
  csvViewerPersistDebounceMs,
  loadCsvViewerSession,
  mergeAllCsvViewerIdbRowsWithDirty,
  mergeCsvViewerIdbRowChunks,
  readCsvViewerIdbRowWindow,
  saveCsvViewerSession,
  splitCsvViewerRowsForIdbChunks,
} from "@/lib/csv-viewer-idb";

function makeSession(rows: CsvViewerRow[]) {
  return {
    version: 2 as const,
    fileName: "t.csv",
    dir: "ltr" as const,
    columnKeys: ["c"],
    headerLabels: ["C"],
    columnKinds: ["short-text" as const],
    rows,
    cellMerges: undefined,
    truncated: false,
    rowCountBeforeCap: rows.length,
    importedRowCount: rows.length,
  };
}

describe("splitCsvViewerRowsForIdbChunks / mergeCsvViewerIdbRowChunks", () => {
  it("round-trips arbitrary lengths", () => {
    const rows: CsvViewerRow[] = Array.from({ length: 7 }, (_, i) => ({
      id: `r${i}`,
      c: String(i),
    }));
    const chunks = splitCsvViewerRowsForIdbChunks(rows, 3);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(3);
    expect(chunks[1]).toHaveLength(3);
    expect(chunks[2]).toHaveLength(1);
    expect(mergeCsvViewerIdbRowChunks(chunks)).toEqual(rows);
  });

  it("returns empty array of chunks for empty rows", () => {
    expect(
      splitCsvViewerRowsForIdbChunks([], CSV_VIEWER_IDB_ROW_CHUNK_SIZE),
    ).toEqual([]);
    expect(mergeCsvViewerIdbRowChunks([])).toEqual([]);
  });

  it("copies rows so later mutations do not affect chunk payloads", () => {
    const row: CsvViewerRow = { id: "r0", c: "before" };
    const chunks = splitCsvViewerRowsForIdbChunks([row], 10);
    row.c = "after";
    expect(chunks[0]?.[0]?.c).toBe("before");
  });
});

describe("csvViewerPersistDebounceMs", () => {
  it("scales debounce with row count", () => {
    expect(csvViewerPersistDebounceMs(100)).toBe(500);
    expect(csvViewerPersistDebounceMs(3_000)).toBe(1_200);
    expect(csvViewerPersistDebounceMs(10_000)).toBe(2_000);
    expect(csvViewerPersistDebounceMs(25_000)).toBe(3_000);
  });
});

describe("csv-viewer-idb (IndexedDB)", () => {
  it("saves and loads small sessions inline", async () => {
    await clearCsvViewerSession();
    const rows: CsvViewerRow[] = [{ id: "a", c: "1" }];
    const session = makeSession(rows);
    await saveCsvViewerSession(session, { rowChunkThreshold: 10 });
    const restored = await loadCsvViewerSession();
    expect(restored?.rows).toEqual(rows);
    expect(restored?.fileName).toBe("t.csv");
    await clearCsvViewerSession();
  });

  it("saves and loads large sessions in row chunks", async () => {
    await clearCsvViewerSession();
    const rows: CsvViewerRow[] = Array.from({ length: 5 }, (_, i) => ({
      id: `id-${i}`,
      c: String(i),
    }));
    const session = makeSession(rows);
    await saveCsvViewerSession(session, {
      rowChunkThreshold: 2,
      rowChunkSize: 2,
    });
    const restored = await loadCsvViewerSession();
    expect(restored?.rows).toEqual(rows);
    expect(restored?.importedRowCount).toBe(5);
    await clearCsvViewerSession();
  });

  it("windowed load reads first page only and range helper works", async () => {
    await clearCsvViewerSession();
    const rows: CsvViewerRow[] = Array.from({ length: 5 }, (_, i) => ({
      id: `id-${i}`,
      c: String(i),
    }));
    const session = makeSession(rows);
    await saveCsvViewerSession(session, {
      rowChunkThreshold: 2,
      rowChunkSize: 2,
    });
    const restored = await loadCsvViewerSession({
      windowed: true,
      initialPageSize: 2,
    });
    expect(restored?.rows).toHaveLength(2);
    expect(restored?.rows.map((r) => r.id)).toEqual(["id-0", "id-1"]);
    expect(restored?.windowedTotalRows).toBe(5);
    expect(restored?.windowedRowChunkCount).toBe(3);
    const nextPage = await readCsvViewerIdbRowWindow(restored!, 2, 4);
    expect(nextPage?.map((r) => r.c)).toEqual(["2", "3"]);
    const full = await mergeAllCsvViewerIdbRowsWithDirty(restored!);
    expect(full?.map((r) => r.c)).toEqual(["0", "1", "2", "3", "4"]);
    await clearCsvViewerSession();
  });
});
