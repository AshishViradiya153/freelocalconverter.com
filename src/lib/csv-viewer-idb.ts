import type { CsvViewerRow } from "@/lib/csv-import";
import {
  type CsvViewerSession,
  normalizeCsvViewerSessionForLoad,
} from "@/lib/csv-viewer-session";

const DB_NAME = "FreeLocalConverter-csv-viewer";
const DB_VERSION = 2;
const SNAPSHOT_STORE = "snapshot";
const ROW_CHUNKS_STORE = "rowChunks";
const RECORD_KEY = "session";

export const CSV_VIEWER_IDB_ROW_CHUNK_THRESHOLD = 3_000;

export const CSV_VIEWER_IDB_ROW_CHUNK_SIZE = 2_500;

export const CSV_VIEWER_WINDOWED_INITIAL_PAGE_SIZE = 100;

const ROW_CHUNK_KEY_PREFIX = "rows:";

function rowChunkKey(index: number): string {
  return `${ROW_CHUNK_KEY_PREFIX}${index}`;
}

export interface CsvViewerSessionChunkedStored {
  version: 2;
  rowsStorage: "chunked";
  rowChunkCount: number;
  rows: [];
  fileName: string;
  dir: CsvViewerSession["dir"];
  columnKeys: string[];
  headerLabels: string[];
  columnKinds: CsvViewerSession["columnKinds"];
  cellMerges?: CsvViewerSession["cellMerges"];
  truncated: boolean;
  rowCountBeforeCap: number;
  importedRowCount: number;
  /** Persisted row count per `rows:n` record; omitted on older saves. */
  idbRowChunkSize?: number;
}

function isChunkedSnapshot(raw: unknown): raw is CsvViewerSessionChunkedStored {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as { rowsStorage?: unknown; rowChunkCount?: unknown };
  return (
    o.rowsStorage === "chunked" &&
    typeof o.rowChunkCount === "number" &&
    o.rowChunkCount >= 1
  );
}

export function splitCsvViewerRowsForIdbChunks(
  rows: CsvViewerRow[],
  chunkSize: number = CSV_VIEWER_IDB_ROW_CHUNK_SIZE,
): CsvViewerRow[][] {
  if (rows.length === 0) return [];
  const out: CsvViewerRow[][] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    // Shallow row copies so IndexedDB snapshots are stable if the grid mutates rows in memory.
    out.push(slice.map((r) => ({ ...r })));
  }
  return out;
}

/** Debounce before writing the full session to IndexedDB (larger sheets = less frequent writes). */
export function csvViewerPersistDebounceMs(rowCount: number): number {
  if (rowCount >= 20_000) return 3_000;
  if (rowCount >= 10_000) return 2_000;
  if (rowCount >= 3_000) return 1_200;
  return 500;
}

export function mergeCsvViewerIdbRowChunks(
  chunks: CsvViewerRow[][],
): CsvViewerRow[] {
  return chunks.flat();
}

/** Read global row indices [start, endExclusive) from row chunk records (same transaction). */
function readGlobalRowSliceFromChunks(
  rowStore: IDBObjectStore,
  rowChunkCount: number,
  chunkSize: number,
  start: number,
  endExclusive: number,
  onDone: (rows: CsvViewerRow[] | null) => void,
  onError: (e: unknown) => void,
): void {
  if (start < 0 || endExclusive < start) {
    onDone([]);
    return;
  }
  const firstChunk = Math.floor(start / chunkSize);
  const lastChunk = Math.floor((endExclusive - 1) / chunkSize);
  if (firstChunk > lastChunk || lastChunk >= rowChunkCount || firstChunk < 0) {
    onDone(null);
    return;
  }

  const buffers: CsvViewerRow[][] = new Array(lastChunk - firstChunk + 1);
  let ci = firstChunk;

  const readOne = () => {
    if (ci > lastChunk) {
      const out: CsvViewerRow[] = [];
      for (let c = firstChunk; c <= lastChunk; c++) {
        const buf = buffers[c - firstChunk];
        if (!Array.isArray(buf)) {
          onDone(null);
          return;
        }
        const globalBase = c * chunkSize;
        const sliceStart = Math.max(start, globalBase) - globalBase;
        const sliceEnd =
          Math.min(endExclusive, globalBase + buf.length) - globalBase;
        for (let i = sliceStart; i < sliceEnd; i++) {
          const row = buf[i];
          if (row) out.push({ ...row });
        }
      }
      onDone(out);
      return;
    }

    const req = rowStore.get(rowChunkKey(ci));
    req.onsuccess = () => {
      const v = req.result as CsvViewerRow[] | undefined;
      if (!Array.isArray(v)) {
        onDone(null);
        return;
      }
      buffers[ci - firstChunk] = v;
      ci++;
      readOne();
    };
    req.onerror = () => onError(req.error);
  };

  readOne();
}

function chunkedSnapshotFromSession(
  session: CsvViewerSession,
  rowChunkCount: number,
  chunkSize: number,
): CsvViewerSessionChunkedStored {
  return {
    version: 2,
    rowsStorage: "chunked",
    rowChunkCount,
    rows: [],
    fileName: session.fileName,
    dir: session.dir,
    columnKeys: [...session.columnKeys],
    headerLabels: [...session.headerLabels],
    columnKinds: [...session.columnKinds],
    cellMerges: session.cellMerges?.map((m) => ({ ...m })),
    truncated: session.truncated,
    rowCountBeforeCap: session.rowCountBeforeCap,
    importedRowCount: session.importedRowCount,
    idbRowChunkSize: chunkSize,
  };
}

async function saveCsvViewerWindowedToIdb(
  session: CsvViewerSession,
  dirty: Map<number, CsvViewerRow> | undefined,
): Promise<void> {
  const chunkCount = session.windowedRowChunkCount;
  if (chunkCount == null || chunkCount < 1) return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(
        [SNAPSHOT_STORE, ROW_CHUNKS_STORE],
        "readwrite",
      );
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);

      const snapStore = tx.objectStore(SNAPSHOT_STORE);
      const rowStore = tx.objectStore(ROW_CHUNKS_STORE);
      const snapReq = snapStore.get(RECORD_KEY);
      snapReq.onsuccess = () => {
        const existing = snapReq.result;
        if (!isChunkedSnapshot(existing)) {
          reject(new Error("csv-viewer-idb: expected chunked snapshot"));
          return;
        }
        const chunkSize =
          existing.idbRowChunkSize ?? CSV_VIEWER_IDB_ROW_CHUNK_SIZE;

        if (!dirty || dirty.size === 0) {
          snapStore.put(
            chunkedSnapshotFromSession(session, chunkCount, chunkSize),
            RECORD_KEY,
          );
          return;
        }

        const dirtyByChunk = new Map<number, Map<number, CsvViewerRow>>();
        for (const [gi, row] of dirty) {
          const ci = Math.floor(gi / chunkSize);
          const li = gi - ci * chunkSize;
          if (!dirtyByChunk.has(ci)) dirtyByChunk.set(ci, new Map());
          dirtyByChunk.get(ci)!.set(li, { ...row });
        }

        const chunks: CsvViewerRow[][] = new Array(chunkCount);
        let idx = 0;

        const readNext = () => {
          if (idx >= chunkCount) {
            for (let i = 0; i < chunkCount; i++) {
              const base = (chunks[i] ?? []).map((r) => ({ ...r }));
              const local = dirtyByChunk.get(i);
              if (local) {
                for (const [li, row] of local) {
                  if (li >= 0 && li < base.length) base[li] = { ...row };
                }
              }
              rowStore.put(base, rowChunkKey(i));
            }
            snapStore.put(
              chunkedSnapshotFromSession(session, chunkCount, chunkSize),
              RECORD_KEY,
            );
            return;
          }

          const gr = rowStore.get(rowChunkKey(idx));
          gr.onsuccess = () => {
            const v = gr.result as CsvViewerRow[] | undefined;
            chunks[idx] = Array.isArray(v) ? v : [];
            idx++;
            readNext();
          };
          gr.onerror = () => reject(gr.error);
        };

        readNext();
      };
      snapReq.onerror = () => reject(snapReq.error);
    });
  } catch {
    // Quota, private mode, or missing chunked snapshot (non-fatal)
  }
}

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("indexedDB is not available"));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE);
      }
      if (!db.objectStoreNames.contains(ROW_CHUNKS_STORE)) {
        db.createObjectStore(ROW_CHUNKS_STORE);
      }
    };
  });
}

export interface SaveCsvViewerSessionOptions {
  /** For tests; default {@link CSV_VIEWER_IDB_ROW_CHUNK_THRESHOLD}. */
  rowChunkThreshold?: number;
  /** For tests; default {@link CSV_VIEWER_IDB_ROW_CHUNK_SIZE}. */
  rowChunkSize?: number;
  windowedDirty?: Map<number, CsvViewerRow>;
}

export async function saveCsvViewerSession(
  session: CsvViewerSession,
  options?: SaveCsvViewerSessionOptions,
): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  if (
    session.windowedTotalRows != null &&
    session.windowedRowChunkCount != null
  ) {
    await saveCsvViewerWindowedToIdb(session, options?.windowedDirty);
    return;
  }

  const threshold =
    options?.rowChunkThreshold ?? CSV_VIEWER_IDB_ROW_CHUNK_THRESHOLD;
  const chunkSize = options?.rowChunkSize ?? CSV_VIEWER_IDB_ROW_CHUNK_SIZE;

  let snapshot: CsvViewerSession | CsvViewerSessionChunkedStored;
  let chunks: CsvViewerRow[][] = [];
  try {
    if (session.rows.length >= threshold) {
      chunks = splitCsvViewerRowsForIdbChunks(session.rows, chunkSize);
      snapshot = {
        version: 2,
        rowsStorage: "chunked",
        rowChunkCount: chunks.length,
        rows: [],
        fileName: session.fileName,
        dir: session.dir,
        columnKeys: [...session.columnKeys],
        headerLabels: [...session.headerLabels],
        columnKinds: [...session.columnKinds],
        cellMerges: session.cellMerges?.map((m) => ({ ...m })),
        truncated: session.truncated,
        rowCountBeforeCap: session.rowCountBeforeCap,
        importedRowCount: session.importedRowCount,
        idbRowChunkSize: chunkSize,
      };
    } else {
      snapshot = structuredClone(session);
    }
  } catch {
    return;
  }

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(
        [SNAPSHOT_STORE, ROW_CHUNKS_STORE],
        "readwrite",
      );
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);

      const snapStore = tx.objectStore(SNAPSHOT_STORE);
      const rowStore = tx.objectStore(ROW_CHUNKS_STORE);
      const keysReq = rowStore.getAllKeys();
      keysReq.onerror = () => reject(keysReq.error);
      keysReq.onsuccess = () => {
        const keys = keysReq.result as IDBValidKey[];
        for (const k of keys) {
          rowStore.delete(k);
        }
        if (chunks.length > 0) {
          for (let i = 0; i < chunks.length; i++) {
            const part = chunks[i];
            if (part) rowStore.put(part, rowChunkKey(i));
          }
        }
        snapStore.put(snapshot, RECORD_KEY);
      };
    });
  } catch {
    // Quota, private mode, or disabled storage (non-fatal)
  }
}

function loadVersionOk(version: unknown): boolean {
  return version === 1 || version === 2;
}

export interface LoadCsvViewerSessionOptions {
  /**
   * When true, chunked sessions load only the first page of rows (no full merge).
   * Inline snapshots are unchanged.
   */
  windowed?: boolean;
  /** Visible row count for the first windowed page; default {@link CSV_VIEWER_WINDOWED_INITIAL_PAGE_SIZE}. */
  initialPageSize?: number;
}

export async function loadCsvViewerSession(
  options?: LoadCsvViewerSessionOptions,
): Promise<CsvViewerSession | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    return await new Promise<CsvViewerSession | null>((resolve, reject) => {
      const tx = db.transaction([SNAPSHOT_STORE, ROW_CHUNKS_STORE], "readonly");
      const req = tx.objectStore(SNAPSHOT_STORE).get(RECORD_KEY);
      req.onsuccess = () => {
        const rawUnknown = req.result as unknown;
        if (!rawUnknown || typeof rawUnknown !== "object") {
          resolve(null);
          return;
        }
        const raw = rawUnknown as Record<string, unknown>;
        if (!loadVersionOk(raw.version)) {
          resolve(null);
          return;
        }
        if (
          !Array.isArray(raw.columnKeys) ||
          !Array.isArray(raw.headerLabels) ||
          !Array.isArray(raw.columnKinds)
        ) {
          resolve(null);
          return;
        }

        if (isChunkedSnapshot(rawUnknown) && options?.windowed) {
          const rowStore = tx.objectStore(ROW_CHUNKS_STORE);
          const snap = rawUnknown as CsvViewerSessionChunkedStored;
          const chunkSize =
            snap.idbRowChunkSize ?? CSV_VIEWER_IDB_ROW_CHUNK_SIZE;
          const total =
            typeof snap.importedRowCount === "number" ? snap.importedRowCount : 0;
          const pageSize =
            options.initialPageSize ?? CSV_VIEWER_WINDOWED_INITIAL_PAGE_SIZE;
          const end = Math.min(pageSize, total);

          readGlobalRowSliceFromChunks(
            rowStore,
            snap.rowChunkCount,
            chunkSize,
            0,
            end,
            (slice) => {
              if (slice === null) {
                resolve(null);
                return;
              }
              if (total > 0 && slice.length === 0) {
                resolve(null);
                return;
              }
              const merges = snap.cellMerges;
              const assembled: CsvViewerSession = {
                version: 2,
                fileName: snap.fileName,
                dir: snap.dir === "rtl" ? "rtl" : "ltr",
                columnKeys: [...snap.columnKeys],
                headerLabels: [...snap.headerLabels],
                columnKinds: [...snap.columnKinds],
                rows: slice,
                cellMerges: Array.isArray(merges)
                  ? merges.map((m) => ({ ...m }))
                  : undefined,
                truncated: snap.truncated,
                rowCountBeforeCap: snap.rowCountBeforeCap,
                importedRowCount: snap.importedRowCount,
                windowedTotalRows: total,
                windowedRowChunkCount: snap.rowChunkCount,
                windowedIdbRowChunkSize: chunkSize,
              };
              const normalized = normalizeCsvViewerSessionForLoad(assembled);
              resolve(normalized);
            },
            reject,
          );
          return;
        }

        if (isChunkedSnapshot(rawUnknown)) {
          const rowStore = tx.objectStore(ROW_CHUNKS_STORE);
          const pending: CsvViewerRow[][] = [];
          let settled = false;
          let loaded = 0;

          const finish = (value: CsvViewerSession | null) => {
            if (settled) return;
            settled = true;
            resolve(value);
          };

          const tryFinish = () => {
            if (settled) return;
            if (loaded < rawUnknown.rowChunkCount) return;
            const merged = mergeCsvViewerIdbRowChunks(pending);
            if (merged.length === 0) {
              finish(null);
              return;
            }
            const merges = rawUnknown.cellMerges;
            const assembled: CsvViewerSession = {
              version: 2,
              fileName: rawUnknown.fileName,
              dir: rawUnknown.dir === "rtl" ? "rtl" : "ltr",
              columnKeys: [...rawUnknown.columnKeys],
              headerLabels: [...rawUnknown.headerLabels],
              columnKinds: [...rawUnknown.columnKinds],
              rows: merged,
              cellMerges: Array.isArray(merges)
                ? merges.map((m) => ({ ...m }))
                : undefined,
              truncated: rawUnknown.truncated,
              rowCountBeforeCap: rawUnknown.rowCountBeforeCap,
              importedRowCount: rawUnknown.importedRowCount,
            };
            const normalized = normalizeCsvViewerSessionForLoad(assembled);
            finish(normalized);
          };

          for (let i = 0; i < rawUnknown.rowChunkCount; i++) {
            const idx = i;
            const getReq = rowStore.get(rowChunkKey(i));
            getReq.onsuccess = () => {
              if (settled) return;
              const value = getReq.result as CsvViewerRow[] | undefined;
              if (!Array.isArray(value)) {
                finish(null);
                return;
              }
              pending[idx] = value;
              loaded++;
              tryFinish();
            };
            getReq.onerror = () => {
              if (settled) return;
              settled = true;
              reject(getReq.error);
            };
          }
          return;
        }

        if (!Array.isArray(raw.rows)) {
          resolve(null);
          return;
        }

        const normalized = normalizeCsvViewerSessionForLoad(
          rawUnknown as CsvViewerSession,
        );
        resolve(normalized);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

/** Load a global row range from chunked IDB storage, with optional dirty overlay. */
export async function readCsvViewerIdbRowWindow(
  session: CsvViewerSession,
  start: number,
  endExclusive: number,
  dirty?: Map<number, CsvViewerRow> | null,
): Promise<CsvViewerRow[] | null> {
  if (
    session.windowedTotalRows == null ||
    session.windowedRowChunkCount == null
  ) {
    return null;
  }
  try {
    const db = await openDb();
    return await new Promise<CsvViewerRow[] | null>((resolve, reject) => {
      const tx = db.transaction([SNAPSHOT_STORE, ROW_CHUNKS_STORE], "readonly");
      const snapStore = tx.objectStore(SNAPSHOT_STORE);
      const rowStore = tx.objectStore(ROW_CHUNKS_STORE);
      const sreq = snapStore.get(RECORD_KEY);
      sreq.onsuccess = () => {
        const snap = sreq.result;
        if (!isChunkedSnapshot(snap)) {
          resolve(null);
          return;
        }
        const chunkSize =
          snap.idbRowChunkSize ?? CSV_VIEWER_IDB_ROW_CHUNK_SIZE;
        readGlobalRowSliceFromChunks(
          rowStore,
          snap.rowChunkCount,
          chunkSize,
          start,
          endExclusive,
          (slice) => {
            if (slice === null) {
              resolve(null);
              return;
            }
            if (!dirty || dirty.size === 0) {
              resolve(slice);
              return;
            }
            for (let i = 0; i < slice.length; i++) {
              const g = start + i;
              const d = dirty.get(g);
              if (d) slice[i] = { ...d };
            }
            resolve(slice);
          },
          reject,
        );
      };
      sreq.onerror = () => reject(sreq.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

/** Full row array from IDB chunks plus dirty map (for export). */
export async function mergeAllCsvViewerIdbRowsWithDirty(
  session: CsvViewerSession,
  dirty?: Map<number, CsvViewerRow> | null,
): Promise<CsvViewerRow[] | null> {
  if (
    session.windowedTotalRows == null ||
    session.windowedRowChunkCount == null
  ) {
    return null;
  }
  try {
    const db = await openDb();
    return await new Promise<CsvViewerRow[] | null>((resolve, reject) => {
      const tx = db.transaction([SNAPSHOT_STORE, ROW_CHUNKS_STORE], "readonly");
      const snapStore = tx.objectStore(SNAPSHOT_STORE);
      const rowStore = tx.objectStore(ROW_CHUNKS_STORE);
      const sreq = snapStore.get(RECORD_KEY);
      sreq.onsuccess = () => {
        const snap = sreq.result;
        if (!isChunkedSnapshot(snap)) {
          resolve(null);
          return;
        }
        const n = snap.rowChunkCount;
        const chunks: CsvViewerRow[][] = new Array(n);
        let idx = 0;
        const readNext = () => {
          if (idx >= n) {
            const merged = mergeCsvViewerIdbRowChunks(chunks);
            if (dirty && dirty.size > 0) {
              for (const [gi, row] of dirty) {
                if (gi >= 0 && gi < merged.length) merged[gi] = { ...row };
              }
            }
            resolve(merged);
            return;
          }
          const gr = rowStore.get(rowChunkKey(idx));
          gr.onsuccess = () => {
            const v = gr.result as CsvViewerRow[] | undefined;
            chunks[idx] = Array.isArray(v) ? v : [];
            idx++;
            readNext();
          };
          gr.onerror = () => reject(gr.error);
        };
        readNext();
      };
      sreq.onerror = () => reject(sreq.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function clearCsvViewerSession(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(
        [SNAPSHOT_STORE, ROW_CHUNKS_STORE],
        "readwrite",
      );
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      const snapStore = tx.objectStore(SNAPSHOT_STORE);
      const rowStore = tx.objectStore(ROW_CHUNKS_STORE);
      const keysReq = rowStore.getAllKeys();
      keysReq.onerror = () => reject(keysReq.error);
      keysReq.onsuccess = () => {
        const keys = keysReq.result as IDBValidKey[];
        for (const k of keys) {
          rowStore.delete(k);
        }
        snapStore.delete(RECORD_KEY);
      };
    });
  } catch {
    // ignore
  }
}
