import { strToU8, zipSync } from "fflate";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { downloadBlob } from "@/lib/download-blob";

export interface PdfRenderOptions {
  /** DPI, where 72 is the PDF default scale=1 */
  dpi?: number;
  /** Alternative sizing: render to match a target pixel width. */
  targetWidthPx?: number;
  /** When exporting JPEG/WebP, background should be solid. */
  backgroundHex?: string;
  /** Trim whitespace/margins around rendered content. */
  crop?: boolean;
}

export interface PdfImageExportOptions extends PdfRenderOptions {
  format: "png" | "jpeg" | "webp";
  quality?: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseHexColor(
  hex: string,
): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const hex6 = m[1];
  if (hex6 === undefined) return null;
  const v = Number.parseInt(hex6, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function cropCanvasToContent(opts: {
  canvas: HTMLCanvasElement;
  backgroundHex?: string;
  paddingPx: number;
}): HTMLCanvasElement {
  const { canvas, backgroundHex, paddingPx } = opts;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  if (w <= 2 || h <= 2) return canvas;

  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;

  const bg = backgroundHex ? parseHexColor(backgroundHex) : null;
  const pad = Math.max(0, Math.floor(paddingPx));

  function isContentPixel(i: number): boolean {
    const a = data[i + 3] ?? 0;
    if (a > 10) return true;
    if (!bg) return false;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const dist = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
    return dist > 12;
  }

  let top = 0;
  let bottom = h - 1;
  let left = 0;
  let right = w - 1;

  // top
  scanTop: for (; top < h; top++) {
    for (let x = 0; x < w; x++) {
      const idx = (top * w + x) * 4;
      if (isContentPixel(idx)) break scanTop;
    }
  }
  // bottom
  scanBottom: for (; bottom >= top; bottom--) {
    for (let x = 0; x < w; x++) {
      const idx = (bottom * w + x) * 4;
      if (isContentPixel(idx)) break scanBottom;
    }
  }
  // left
  scanLeft: for (; left < w; left++) {
    for (let y = top; y <= bottom; y++) {
      const idx = (y * w + left) * 4;
      if (isContentPixel(idx)) break scanLeft;
    }
  }
  // right
  scanRight: for (; right >= left; right--) {
    for (let y = top; y <= bottom; y++) {
      const idx = (y * w + right) * 4;
      if (isContentPixel(idx)) break scanRight;
    }
  }

  if (top >= bottom || left >= right) return canvas;

  const cropLeft = clamp(left - pad, 0, w - 1);
  const cropTop = clamp(top - pad, 0, h - 1);
  const cropRight = clamp(right + pad, 0, w - 1);
  const cropBottom = clamp(bottom + pad, 0, h - 1);

  const cw = Math.max(1, cropRight - cropLeft + 1);
  const ch = Math.max(1, cropBottom - cropTop + 1);
  if (cw === w && ch === h) return canvas;

  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const outCtx = out.getContext("2d", { alpha: true });
  if (!outCtx) return canvas;
  outCtx.drawImage(canvas, cropLeft, cropTop, cw, ch, 0, 0, cw, ch);
  return out;
}

export async function renderPdfPageToCanvas(
  page: PDFPageProxy,
  opts: PdfRenderOptions,
): Promise<HTMLCanvasElement> {
  const scale = (() => {
    if (typeof opts.dpi === "number") {
      return clamp(opts.dpi / 72, 0.5, 8);
    }
    if (typeof opts.targetWidthPx === "number") {
      const base = page.getViewport({ scale: 1 });
      const target = clamp(opts.targetWidthPx, 64, 12000);
      const s = target / Math.max(1, base.width);
      return clamp(s, 0.15, 8);
    }
    return 1;
  })();
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("canvas_context_unavailable");

  if (opts.backgroundHex) {
    ctx.save();
    ctx.fillStyle = opts.backgroundHex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  const task = page.render({
    canvasContext: ctx,
    viewport,
    background: opts.backgroundHex ? opts.backgroundHex : undefined,
    canvas,
  } as unknown as Parameters<PDFPageProxy["render"]>[0]);
  await task.promise;

  if (opts.crop) {
    return cropCanvasToContent({
      canvas,
      backgroundHex: opts.backgroundHex,
      paddingPx: 6,
    });
  }

  return canvas;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  opts: PdfImageExportOptions,
): Promise<Blob> {
  const mime =
    opts.format === "png"
      ? "image/png"
      : opts.format === "jpeg"
        ? "image/jpeg"
        : "image/webp";

  const quality =
    opts.format === "png"
      ? undefined
      : Math.max(0.05, Math.min(1, opts.quality ?? 0.92));

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error("toBlob_failed"));
        else resolve(b);
      },
      mime,
      quality,
    );
  });
}

export async function readPdfBasicInfo(pdf: PDFDocumentProxy): Promise<{
  pageCount: number;
}> {
  return { pageCount: pdf.numPages };
}

export async function renderPdfThumbnails(
  pdf: PDFDocumentProxy,
  opts: { maxThumbPx: number; pageLimit?: number },
): Promise<
  Array<{ pageNumber: number; dataUrl: string; width: number; height: number }>
> {
  const pageCount = pdf.numPages;
  const limit = Math.max(1, Math.min(pageCount, opts.pageLimit ?? pageCount));
  const out: Array<{
    pageNumber: number;
    dataUrl: string;
    width: number;
    height: number;
  }> = [];

  for (let i = 1; i <= limit; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.max(
      0.1,
      Math.min(2.5, opts.maxThumbPx / Math.max(1, viewport.width)),
    );
    const canvas = await renderPdfPageToCanvas(page, { dpi: 72 * scale });
    // Thumbnails are fine as data URLs.
    out.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    });
  }

  return out;
}

export async function exportPdfPagesToImages(opts: {
  pdf: PDFDocumentProxy;
  fileBaseName: string;
  pageNumbers: number[]; // 1-based
  exportOptions: PdfImageExportOptions;
  onProgress?: (p: { done: number; total: number; pageNumber: number }) => void;
}): Promise<Array<{ pageNumber: number; filename: string; blob: Blob }>> {
  const { pdf, fileBaseName, pageNumbers, exportOptions, onProgress } = opts;
  const total = pageNumbers.length;
  const out: Array<{ pageNumber: number; filename: string; blob: Blob }> = [];

  for (let idx = 0; idx < pageNumbers.length; idx++) {
    const pageNumber = pageNumbers[idx];
    if (pageNumber === undefined) continue;
    const page = await pdf.getPage(pageNumber);
    const needsBg =
      exportOptions.format === "jpeg" || exportOptions.format === "webp";
    const canvas = await renderPdfPageToCanvas(page, {
      dpi: exportOptions.dpi,
      targetWidthPx: exportOptions.targetWidthPx,
      backgroundHex: needsBg
        ? (exportOptions.backgroundHex ?? "#ffffff")
        : exportOptions.backgroundHex,
      crop: exportOptions.crop,
    });
    const blob = await canvasToBlob(canvas, exportOptions);
    const filename = `${fileBaseName}-page-${String(pageNumber).padStart(3, "0")}.${exportOptions.format === "jpeg" ? "jpg" : exportOptions.format}`;
    out.push({ pageNumber, filename, blob });
    onProgress?.({ done: idx + 1, total, pageNumber });
  }

  return out;
}

export function downloadPdfImagesAsZip(
  entries: Array<{ filename: string; blob: Blob }>,
  zipName: string,
) {
  void (async () => {
    const files: Record<string, Uint8Array> = {};
    for (const e of entries) {
      const buf = await e.blob.arrayBuffer();
      files[e.filename] = new Uint8Array(buf);
    }
    const zipped = zipSync(files, { level: 6 });
    // TS can consider Uint8Array.buffer as SharedArrayBuffer in some lib.dom versions.
    // Wrapping in ArrayBuffer makes BlobPart typing happy.
    const zipBlob = new Blob([zipped.slice().buffer], {
      type: "application/zip",
    });
    downloadBlob(
      zipBlob,
      zipName.endsWith(".zip") ? zipName : `${zipName}.zip`,
    );
  })();
}

export async function exportLongImageFromCanvases(opts: {
  canvases: HTMLCanvasElement[];
  direction: "vertical" | "horizontal";
  gapPx: number;
  backgroundHex: string;
}): Promise<HTMLCanvasElement> {
  const { canvases, direction, gapPx, backgroundHex } = opts;
  const gap = Math.max(0, Math.floor(gapPx));
  if (canvases.length === 0) throw new Error("no_canvases");

  const widths = canvases.map((c) => c.width);
  const heights = canvases.map((c) => c.height);

  const width =
    direction === "vertical"
      ? Math.max(...widths)
      : widths.reduce((a, b) => a + b, 0) + gap * (canvases.length - 1);
  const height =
    direction === "vertical"
      ? heights.reduce((a, b) => a + b, 0) + gap * (canvases.length - 1)
      : Math.max(...heights);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width));
  canvas.height = Math.max(1, Math.floor(height));
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("canvas_context_unavailable");

  ctx.fillStyle = backgroundHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x = 0;
  let y = 0;
  for (let i = 0; i < canvases.length; i++) {
    const c = canvases[i];
    if (c === undefined) continue;
    ctx.drawImage(c, x, y);
    if (direction === "vertical") y += c.height + gap;
    else x += c.width + gap;
  }

  return canvas;
}

export async function exportContactSheetFromCanvases(opts: {
  canvases: HTMLCanvasElement[];
  columns: number;
  cellPaddingPx: number;
  backgroundHex: string;
}): Promise<HTMLCanvasElement> {
  const { canvases, columns, cellPaddingPx, backgroundHex } = opts;
  if (canvases.length === 0) throw new Error("no_canvases");

  const cols = Math.max(1, Math.min(12, Math.floor(columns)));
  const pad = Math.max(0, Math.floor(cellPaddingPx));
  const rows = Math.ceil(canvases.length / cols);

  const maxW = Math.max(...canvases.map((c) => c.width));
  const maxH = Math.max(...canvases.map((c) => c.height));

  const width = cols * maxW + pad * (cols + 1);
  const height = rows * maxH + pad * (rows + 1);

  const sheet = document.createElement("canvas");
  sheet.width = Math.max(1, Math.floor(width));
  sheet.height = Math.max(1, Math.floor(height));
  const ctx = sheet.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("canvas_context_unavailable");

  ctx.fillStyle = backgroundHex;
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  for (let i = 0; i < canvases.length; i++) {
    const c = canvases[i];
    if (c === undefined) continue;
    const r = Math.floor(i / cols);
    const col = i % cols;
    const x = pad + col * (maxW + pad);
    const y = pad + r * (maxH + pad);
    ctx.drawImage(c, x, y);
  }

  return sheet;
}
