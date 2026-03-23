import type { CsvColumnKind, CsvViewerRow } from "@/lib/csv-import";
import {
  insertCsvSessionColumnWithDataAt,
  type CsvViewerSession,
} from "@/lib/csv-viewer-session";

export interface ColumnClipboardPayload {
  headerLabel: string;
  kind: CsvColumnKind;
  values: string[];
}

export function cellValueToPlainString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

/** Split clipboard text into lines and drop trailing blank lines (final newline). */
export function parseClipboardTextToColumnLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === "") {
    lines.pop();
  }
  return lines;
}

/**
 * Parse pasted text and, when it matches a prior column copy/cut payload, restore
 * header label and column kind.
 */
export function resolvePastedColumn(
  clipboardText: string,
  internal: ColumnClipboardPayload | null,
): {
  headerLabel: string;
  kind: CsvColumnKind;
  values: string[];
} {
  const values = parseClipboardTextToColumnLines(clipboardText);
  let headerLabel = "Pasted column";
  let kind: CsvColumnKind = "short-text";
  if (internal && clipboardText === internal.values.join("\n")) {
    headerLabel = internal.headerLabel;
    kind = internal.kind;
  }
  return { headerLabel, kind, values };
}

export function padColumnValuesToRowCount(
  values: string[],
  rowCount: number,
): string[] {
  return Array.from({ length: rowCount }, (_, i) => values[i] ?? "");
}

export function buildColumnClipboardPayload(
  session: CsvViewerSession,
  columnId: string,
): ColumnClipboardPayload | null {
  const ix = session.columnKeys.indexOf(columnId);
  if (ix < 0) return null;
  const values = session.rows.map((row) =>
    cellValueToPlainString(row[columnId]),
  );
  return {
    headerLabel: session.headerLabels[ix] ?? columnId,
    kind: session.columnKinds[ix] ?? "short-text",
    values,
  };
}

export function columnClipboardToTsv(payload: ColumnClipboardPayload): string {
  return payload.values.join("\n");
}

/**
 * Insert a new column after `afterColumnId` using clipboard text. Returns null if
 * the anchor column is missing or pasted content is empty.
 */
export function applyColumnPasteToSession(
  session: CsvViewerSession,
  options: {
    afterColumnId: string;
    newColumnKey: string;
    clipboardText: string;
    internal: ColumnClipboardPayload | null;
  },
): CsvViewerSession | null {
  const ix = session.columnKeys.indexOf(options.afterColumnId);
  if (ix < 0) return null;
  const insertAt = ix + 1;
  const { headerLabel, kind, values } = resolvePastedColumn(
    options.clipboardText,
    options.internal,
  );
  if (values.length === 0) return null;
  const padded = padColumnValuesToRowCount(values, session.rows.length);
  return insertCsvSessionColumnWithDataAt(session, insertAt, {
    key: options.newColumnKey,
    headerLabel,
    kind,
    cellValues: padded,
  });
}
