import Papa from "papaparse";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { clamp } from "@/lib/clamp";
import type { CsvViewerRow } from "@/lib/csv-import";
import type { CsvCellMerge } from "@/lib/csv-viewer-session";
import type { FileCellData } from "@/types/data-grid";

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
  const withoutCsv = leaf.replace(/\.(csv|xlsx|json|xml|pdf)$/i, "");
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
  cellMerges: CsvCellMerge[] = [],
): string {
  const covered = getCoveredCsvCells({ rows, columnKeys, cellMerges });
  const data = rows.map((row, rowIndex) =>
    columnKeys.map((k, colIndex) => {
      if (covered.has(`${rowIndex}:${colIndex}`)) return "";
      const v = row[k];
      const s = serializeCellForDownload(v);
      return neutralizeCsvFormulaPrefix(s);
    }),
  );
  return Papa.unparse({ fields: headerLabels, data }, { header: true });
}

function isFileCellDataArray(value: unknown): value is FileCellData[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        v &&
        typeof v === "object" &&
        typeof (v as FileCellData).id === "string" &&
        typeof (v as FileCellData).name === "string" &&
        typeof (v as FileCellData).size === "number" &&
        typeof (v as FileCellData).type === "string",
    )
  );
}

export function serializeCellForDownload(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (isFileCellDataArray(value)) {
    const parts = value
      .map((f) => f.url ?? f.name)
      .filter((x): x is string => typeof x === "string" && x.trim() !== "");
    return parts.join(" | ");
  }
  return String(value);
}

/** One object per row; keys are header labels (aligned with `columnKeys`). */
export function buildLabelKeyedExportRows(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
  cellMerges: CsvCellMerge[] = [],
): Record<string, unknown>[] {
  const covered = getCoveredCsvCells({ rows, columnKeys, cellMerges });
  return rows.map((row, rowIndex) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columnKeys.length; i++) {
      const key = columnKeys[i];
      if (key === undefined) continue;
      const label = headerLabels[i] ?? key;
      if (covered.has(`${rowIndex}:${i}`)) {
        obj[label] = "";
        continue;
      }
      const v = row[key];
      if (v === null || v === undefined) obj[label] = "";
      else if (v instanceof Date) obj[label] = v.toISOString();
      else if (isFileCellDataArray(v)) obj[label] = serializeCellForDownload(v);
      else obj[label] = v;
    }
    return obj;
  });
}

function getCoveredCsvCells(params: {
  rows: CsvViewerRow[];
  columnKeys: string[];
  cellMerges: CsvCellMerge[];
}): Set<string> {
  const { rows, columnKeys, cellMerges } = params;
  const covered = new Set<string>();
  if (!cellMerges.length) return covered;

  const rowIndexById = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) {
    const id = rows[i]?.id;
    if (id) rowIndexById.set(id, i);
  }
  const colIndexById = new Map<string, number>();
  for (let i = 0; i < columnKeys.length; i++) {
    const id = columnKeys[i];
    if (id) colIndexById.set(id, i);
  }

  for (const m of cellMerges) {
    const aRow = rowIndexById.get(m.startRowId);
    const bRow = rowIndexById.get(m.endRowId);
    const aCol = colIndexById.get(m.startColumnId);
    const bCol = colIndexById.get(m.endColumnId);
    if (
      aRow === undefined ||
      bRow === undefined ||
      aCol === undefined ||
      bCol === undefined
    )
      continue;
    const rowMin = Math.min(aRow, bRow);
    const rowMax = Math.max(aRow, bRow);
    const colMin = Math.min(aCol, bCol);
    const colMax = Math.max(aCol, bCol);
    for (let r = rowMin; r <= rowMax; r++) {
      for (let c = colMin; c <= colMax; c++) {
        if (r === rowMin && c === colMin) continue;
        covered.add(`${r}:${c}`);
      }
    }
  }

  return covered;
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
  cellMerges: CsvCellMerge[] = [],
) {
  const csv = buildCsvExportString(rows, columnKeys, headerLabels, cellMerges);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const base = sanitizeCsvDownloadFileBaseName(fileBaseName);
  triggerBrowserDownload(blob, `${base}.csv`);
}

export function downloadJsonExport(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
  fileBaseName: string,
  cellMerges: CsvCellMerge[] = [],
) {
  const data = buildLabelKeyedExportRows(
    rows,
    columnKeys,
    headerLabels,
    cellMerges,
  );
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const base = sanitizeCsvDownloadFileBaseName(fileBaseName);
  triggerBrowserDownload(blob, `${base}.json`);
}

function escapeXmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cellValueForXml(value: unknown): string {
  const s = serializeCellForDownload(value);
  return neutralizeCsvFormulaPrefix(s);
}

export function buildXmlExportString(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
  cellMerges: CsvCellMerge[] = [],
  rootElementName = "data",
): string {
  const covered = getCoveredCsvCells({ rows, columnKeys, cellMerges });
  const colsXml = columnKeys
    .map((key, i) => {
      const label = headerLabels[i] ?? key;
      return `  <column name="${escapeXmlText(String(label))}"/>`;
    })
    .join("\n");

  const rowsXml = rows
    .map((row, rowIndex) => {
      const cellsXml = columnKeys
        .map((key, i) => {
          const label = headerLabels[i] ?? key;
          const v = covered.has(`${rowIndex}:${i}`)
            ? ""
            : cellValueForXml(row[key]);
          return `    <cell header="${escapeXmlText(String(label))}" colIndex="${
            i + 1
          }">${escapeXmlText(v)}</cell>`;
        })
        .join("\n");
      return `  <row index="${rowIndex + 1}">\n${cellsXml}\n  </row>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElementName}>\n  <columns>\n${colsXml}\n  </columns>\n  <rows>\n${rowsXml}\n  </rows>\n</${rootElementName}>\n`;
}

export function downloadXmlExport(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
  fileBaseName: string,
  cellMerges: CsvCellMerge[] = [],
): void {
  const xml = buildXmlExportString(rows, columnKeys, headerLabels, cellMerges);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const base = sanitizeCsvDownloadFileBaseName(fileBaseName);
  triggerBrowserDownload(blob, `${base}.xml`);
}

function cellValueForXlsx(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (isFileCellDataArray(value)) {
    return neutralizeCsvFormulaPrefix(serializeCellForDownload(value));
  }
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
  cellMerges: CsvCellMerge[] = [],
): Promise<void> {
  const XLSX = await import("xlsx");
  const covered = getCoveredCsvCells({ rows, columnKeys, cellMerges });

  const aoa: Array<Array<string | number | boolean>> = [];
  aoa.push(headerLabels.map((h, i) => String(h ?? columnKeys[i] ?? "")));
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const line = columnKeys.map((key, c) => {
      if (covered.has(`${r}:${c}`)) return "";
      return cellValueForXlsx(row?.[key]);
    });
    aoa.push(line);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const rowIndexById = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) {
    const id = rows[i]?.id;
    if (id) rowIndexById.set(id, i);
  }
  const colIndexById = new Map<string, number>();
  for (let i = 0; i < columnKeys.length; i++) {
    const id = columnKeys[i];
    if (id) colIndexById.set(id, i);
  }

  const mergesOut: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = [];
  for (const m of cellMerges) {
    const aRow = rowIndexById.get(m.startRowId);
    const bRow = rowIndexById.get(m.endRowId);
    const aCol = colIndexById.get(m.startColumnId);
    const bCol = colIndexById.get(m.endColumnId);
    if (
      aRow === undefined ||
      bRow === undefined ||
      aCol === undefined ||
      bCol === undefined
    )
      continue;
    const rowMin = Math.min(aRow, bRow);
    const rowMax = Math.max(aRow, bRow);
    const colMin = Math.min(aCol, bCol);
    const colMax = Math.max(aCol, bCol);
    if (rowMin === rowMax && colMin === colMax) continue;
    mergesOut.push({
      s: { r: rowMin + 1, c: colMin },
      e: { r: rowMax + 1, c: colMax },
    });
  }
  (ws as unknown as { "!merges"?: unknown })["!merges"] = mergesOut;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const base = sanitizeCsvDownloadFileBaseName(fileBaseName);
  XLSX.writeFile(wb, `${base}.xlsx`);
}

function ellipsize(value: string, maxChars: number): string {
  const s = value.trim();
  if (s.length <= maxChars) return s;
  return `${s.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function splitIntoLines(value: string, maxCharsPerLine: number): string[] {
  const s = value.replace(/\s+/g, " ").trim();
  if (!s) return [""];
  if (maxCharsPerLine <= 1) return [ellipsize(s, 1)];

  const words = s.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    if (!current) {
      current = w;
      continue;
    }
    const next = `${current} ${w}`;
    if (next.length <= maxCharsPerLine) {
      current = next;
      continue;
    }
    lines.push(current);
    current = w;
    if (lines.length > 50) break;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildPdfExportBytes(params: {
  rows: CsvViewerRow[];
  columnKeys: string[];
  headerLabels: string[];
  cellMerges?: CsvCellMerge[];
  title?: string;
}): Promise<Uint8Array> {
  const { rows, columnKeys, headerLabels, title } = params;
  const cellMerges = params.cellMerges ?? [];
  const covered = getCoveredCsvCells({ rows, columnKeys, cellMerges });

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Letter landscape: 11x8.5in at 72 DPI
  const pageSize = { width: 792, height: 612 };
  const margin = 36;
  const gapY = 6;
  const headerGapY = 10;
  const gridTopTitleHeight = title ? 20 : 0;

  const colCount = Math.max(1, columnKeys.length);
  const fontSize = clamp(10 - Math.floor(colCount / 3), 6, 10);
  const headerFontSize = clamp(fontSize + 1, 7, 12);
  const lineHeight = fontSize + 3;

  const usableWidth = pageSize.width - margin * 2;
  const cellWidth = usableWidth / colCount;
  const charsPerLine = Math.max(6, Math.floor(cellWidth / (fontSize * 0.55)));
  const maxLinesPerCell = 3;

  let page = doc.addPage([pageSize.width, pageSize.height]);
  let cursorY = page.getHeight() - margin;

  const drawPageHeader = () => {
    cursorY = page.getHeight() - margin;
    if (title) {
      page.drawText(ellipsize(title, 120), {
        x: margin,
        y: cursorY - headerFontSize,
        font: fontBold,
        size: headerFontSize,
      });
      cursorY -= gridTopTitleHeight;
    }

    // Column headers
    cursorY -= headerFontSize;
    for (let c = 0; c < colCount; c++) {
      const label = String(headerLabels[c] ?? columnKeys[c] ?? "");
      page.drawText(ellipsize(label, charsPerLine), {
        x: margin + c * cellWidth,
        y: cursorY,
        font: fontBold,
        size: headerFontSize,
      });
    }
    cursorY -= headerGapY;
  };

  const ensureSpace = (neededHeight: number) => {
    if (cursorY - neededHeight >= margin) return;
    page = doc.addPage([pageSize.width, pageSize.height]);
    drawPageHeader();
  };

  drawPageHeader();

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const rowLines: string[][] = [];
    for (let c = 0; c < colCount; c++) {
      if (covered.has(`${r}:${c}`)) {
        rowLines.push([""]);
        continue;
      }
      const key = columnKeys[c] ?? "";
      const raw = key ? row[key] : "";
      const value = ellipsize(serializeCellForDownload(raw), 400);
      const lines = splitIntoLines(value, charsPerLine).slice(0, maxLinesPerCell);
      rowLines.push(lines.length ? lines : [""]);
    }

    const rowHeight = Math.max(...rowLines.map((x) => x.length)) * lineHeight + gapY;
    ensureSpace(rowHeight);

    cursorY -= lineHeight;
    for (let c = 0; c < colCount; c++) {
      const lines = rowLines[c] ?? [""];
      for (let li = 0; li < lines.length; li++) {
        const text = lines[li] ?? "";
        page.drawText(text, {
          x: margin + c * cellWidth,
          y: cursorY - li * lineHeight,
          font,
          size: fontSize,
        });
      }
    }
    cursorY -= (Math.max(...rowLines.map((x) => x.length)) - 1) * lineHeight;
    cursorY -= gapY;
  }

  return await doc.save();
}

export async function downloadPdfExport(
  rows: CsvViewerRow[],
  columnKeys: string[],
  headerLabels: string[],
  fileBaseName: string,
  cellMerges: CsvCellMerge[] = [],
): Promise<void> {
  const bytes = await buildPdfExportBytes({
    rows,
    columnKeys,
    headerLabels,
    cellMerges,
    title: fileBaseName,
  });
  const blob = new Blob([bytes], { type: "application/pdf" });
  const base = sanitizeCsvDownloadFileBaseName(fileBaseName);
  triggerBrowserDownload(blob, `${base}.pdf`);
}
