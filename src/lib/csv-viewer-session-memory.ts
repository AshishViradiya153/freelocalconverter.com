import type { CsvViewerSession } from "@/lib/csv-viewer-session";

// In-memory cache so locale switches (which unmount/remount the page) can keep
// the already-parsed grid visible without waiting for IndexedDB writes.
let IN_MEMORY_SESSION: CsvViewerSession | null = null;

export function getInMemoryCsvViewerSession(): CsvViewerSession | null {
  return IN_MEMORY_SESSION;
}

export function setInMemoryCsvViewerSession(
  session: CsvViewerSession | null,
): void {
  IN_MEMORY_SESSION = session;
}

