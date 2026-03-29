import type { CsvViewerSession } from "@/lib/csv-viewer-session";

export interface XlsViewerMemoryState {
  file: File | null;
  session: CsvViewerSession | null;
  sheetNames: string[];
  sheetIndex: number;
  headerRowInput: string;
}

let IN_MEMORY_XLS_VIEWER_STATE: XlsViewerMemoryState | null = null;

export function getInMemoryXlsViewerState(): XlsViewerMemoryState | null {
  return IN_MEMORY_XLS_VIEWER_STATE;
}

export function setInMemoryXlsViewerState(
  state: XlsViewerMemoryState | null,
): void {
  IN_MEMORY_XLS_VIEWER_STATE = state;
}
