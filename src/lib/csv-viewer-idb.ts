import {
  type CsvViewerSession,
  normalizeCsvViewerSessionForLoad,
} from "@/lib/csv-viewer-session";

const DB_NAME = "csvcn-csv-viewer";
const DB_VERSION = 1;
const STORE = "snapshot";
const RECORD_KEY = "session";

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
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export async function saveCsvViewerSession(
  session: CsvViewerSession,
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  let snapshot: CsvViewerSession;
  try {
    snapshot = structuredClone(session);
  } catch {
    return;
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put(snapshot, RECORD_KEY);
    });
  } catch {
    // Quota, private mode, or disabled storage (non-fatal)
  }
}

export async function loadCsvViewerSession(): Promise<CsvViewerSession | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    return await new Promise<CsvViewerSession | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(RECORD_KEY);
      req.onsuccess = () => {
        const raw = req.result as CsvViewerSession | undefined;
        if (
          !raw ||
          raw.version !== 1 ||
          !Array.isArray(raw.rows) ||
          !Array.isArray(raw.columnKeys) ||
          !Array.isArray(raw.headerLabels) ||
          !Array.isArray(raw.columnKinds)
        ) {
          resolve(null);
          return;
        }
        const normalized = normalizeCsvViewerSessionForLoad(raw);
        resolve(normalized);
      };
      req.onerror = () => reject(req.error);
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
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).delete(RECORD_KEY);
    });
  } catch {
    // ignore
  }
}
