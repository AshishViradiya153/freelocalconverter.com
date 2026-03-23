import Papa from "papaparse";
import type { CsvViewerRow } from "@/lib/csv-import";

/**
 * Reduce CSV/formula injection risk when the file is opened in Excel or
 * similar (cells starting with =, +, -, @, tab, or CR may be interpreted as
 * formulas). Prefix with a tab so the value is treated as text in common
 * spreadsheet apps.
 *
 * @see https://owasp.org/www-community/attacks/CSV_Injection
 */
export function neutralizeCsvFormulaPrefix(value: string): string {
  if (value.length === 0) return value;
  if (/^[=+\-@\t\r]/.test(value)) {
    return `\t${value}`;
  }
  return value;
}

/** Safe `download` attribute base name (no path segments or reserved characters). */
export function sanitizeCsvDownloadFileBaseName(fileBaseName: string): string {
  const leaf =
    fileBaseName.replace(/\\/g, "/").split("/").pop() ?? fileBaseName;
  const withoutCsv = leaf.replace(/\.(csv|xlsx|json)$/i, "");
  const base = [...withoutCsv]
    .filter((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      if (c < 32) return false;
      return !'<>:"|?*/\\'.includes(ch);
    })
    .join("")
    .trim()
    .slice(0, 180);
  return base.length > 0 ? base : "export";
}

export function buildCsvExportString(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
): string {
  const data = rows.map((row) =>
    columnKeys.map((k) => {
      const v = row[k];
      if (v === null || v === undefined) return "";
      if (v instanceof Date) return v.toISOString();
      const s = String(v);
      return neutralizeCsvFormulaPrefix(s);
    }),
  );
  return Papa.unparse({ fields: headerLabels, data }, { header: true });
}

/** One object per row; keys are header labels (aligned with `columnKeys`). */
export function buildLabelKeyedExportRows(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columnKeys.length; i++) {
      const key = columnKeys[i];
      if (key === undefined) continue;
      const label = headerLabels[i] ?? key;
      const v = row[key];
      if (v === null || v === undefined) obj[label] = "";
      else if (v instanceof Date) obj[label] = v.toISOString();
      else obj[label] = v;
    }
    return obj;
  });
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsvExport(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
  fileBaseName: string,
) {
  const csv = buildCsvExportString(rows, columnKeys, headerLabels);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const base = sanitizeCsvDownloadFileBaseName(fileBaseName);
  triggerBrowserDownload(blob, `${base}.csv`);
}

export function downloadJsonExport(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
  fileBaseName: string,
) {
  const data = buildLabelKeyedExportRows(rows, columnKeys, headerLabels);
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const base = sanitizeCsvDownloadFileBaseName(fileBaseName);
  triggerBrowserDownload(blob, `${base}.json`);
}

function cellValueForXlsx(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  const s = String(value);
  return neutralizeCsvFormulaPrefix(s);
}

/** Dynamic import keeps the xlsx chunk out of the main CSV viewer bundle until needed. */
export async function downloadXlsxExport(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
  fileBaseName: string,
): Promise<void> {
  const XLSX = await import("xlsx");
  const records = rows.map((row) => {
    const obj: Record<string, string | number | boolean> = {};
    for (let i = 0; i < columnKeys.length; i++) {
      const key = columnKeys[i];
      if (key === undefined) continue;
      const label = headerLabels[i] ?? key;
      obj[label] = cellValueForXlsx(row[key]);
    }
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const base = sanitizeCsvDownloadFileBaseName(fileBaseName);
  XLSX.writeFile(wb, `${base}.xlsx`);
}
