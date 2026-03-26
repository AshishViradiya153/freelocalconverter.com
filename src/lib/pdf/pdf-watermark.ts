import {
  degrees,
  PDFDocument,
  type PDFFont,
  type PDFImage,
  rgb,
  StandardFonts,
} from "pdf-lib";

export type WatermarkType = "text" | "image";
export type WatermarkPlacement =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface PdfWatermarkTextOptions {
  type: "text";
  text: string;
  fontSize: number;
  colorHex: string; // "#RRGGBB"
  opacity: number; // 0..1
  rotateDeg: number;
  placement: WatermarkPlacement;
  tile: boolean;
  tileGapPx: number;
}

export interface PdfWatermarkImageOptions {
  type: "image";
  imageBytes: Uint8Array;
  imageMime: "image/png" | "image/jpeg";
  opacity: number; // 0..1
  rotateDeg: number;
  placement: WatermarkPlacement;
  widthPercent: number; // 1..100
  tile: boolean;
  tileGapPx: number;
}

export type PdfWatermarkOptions =
  | PdfWatermarkTextOptions
  | PdfWatermarkImageOptions;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const part = m[1];
  if (!part) return null;
  const v = Number.parseInt(part, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function placementToAnchor(opts: {
  placement: WatermarkPlacement;
  pageWidth: number;
  pageHeight: number;
  markWidth: number;
  markHeight: number;
}): { x: number; y: number } {
  const { placement, pageWidth, pageHeight, markWidth, markHeight } = opts;
  const margin = 24;

  if (placement === "top-left")
    return { x: margin, y: pageHeight - margin - markHeight };
  if (placement === "top-right")
    return {
      x: pageWidth - margin - markWidth,
      y: pageHeight - margin - markHeight,
    };
  if (placement === "bottom-left") return { x: margin, y: margin };
  if (placement === "bottom-right")
    return { x: pageWidth - margin - markWidth, y: margin };
  return { x: (pageWidth - markWidth) / 2, y: (pageHeight - markHeight) / 2 };
}

async function ensureFont(doc: PDFDocument): Promise<PDFFont> {
  return await doc.embedFont(StandardFonts.Helvetica);
}

async function ensureImage(
  doc: PDFDocument,
  opts: PdfWatermarkImageOptions,
): Promise<PDFImage> {
  if (opts.imageMime === "image/png") {
    return await doc.embedPng(opts.imageBytes);
  }
  return await doc.embedJpg(opts.imageBytes);
}

function drawTextWatermarkOnPage(args: {
  page: ReturnType<PDFDocument["getPage"]>;
  font: PDFFont;
  options: PdfWatermarkTextOptions;
}) {
  const { page, font, options } = args;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  const safeOpacity = clamp(options.opacity, 0, 1);
  const safeFontSize = clamp(options.fontSize, 6, 256);
  const rotate = degrees(options.rotateDeg);

  const color = (() => {
    const c = parseHexRgb(options.colorHex);
    if (!c) return rgb(0, 0, 0);
    return rgb(c.r / 255, c.g / 255, c.b / 255);
  })();

  const label = options.text.trim();
  if (!label) return;

  const markWidth = font.widthOfTextAtSize(label, safeFontSize);
  const markHeight = safeFontSize;
  const anchor = placementToAnchor({
    placement: options.placement,
    pageWidth,
    pageHeight,
    markWidth,
    markHeight,
  });

  const drawAt = (x: number, y: number) => {
    page.drawText(label, {
      x,
      y,
      size: safeFontSize,
      font,
      color,
      opacity: safeOpacity,
      rotate,
    });
  };

  if (!options.tile) {
    drawAt(anchor.x, anchor.y);
    return;
  }

  const gap = clamp(options.tileGapPx, 0, 600);
  const stepX = Math.max(1, Math.floor(markWidth + gap));
  const stepY = Math.max(1, Math.floor(markHeight + gap));

  for (let y = -pageHeight; y <= pageHeight * 2; y += stepY) {
    for (let x = -pageWidth; x <= pageWidth * 2; x += stepX) {
      drawAt(x, y);
    }
  }
}

function drawImageWatermarkOnPage(args: {
  page: ReturnType<PDFDocument["getPage"]>;
  image: PDFImage;
  options: PdfWatermarkImageOptions;
}) {
  const { page, image, options } = args;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  const safeOpacity = clamp(options.opacity, 0, 1);
  const rotate = degrees(options.rotateDeg);
  const widthPct = clamp(options.widthPercent, 1, 100);
  const targetWidth = (pageWidth * widthPct) / 100;
  const scaled = image.scale(targetWidth / image.width);

  const anchor = placementToAnchor({
    placement: options.placement,
    pageWidth,
    pageHeight,
    markWidth: scaled.width,
    markHeight: scaled.height,
  });

  const drawAt = (x: number, y: number) => {
    page.drawImage(image, {
      x,
      y,
      width: scaled.width,
      height: scaled.height,
      opacity: safeOpacity,
      rotate,
    });
  };

  if (!options.tile) {
    drawAt(anchor.x, anchor.y);
    return;
  }

  const gap = clamp(options.tileGapPx, 0, 1200);
  const stepX = Math.max(1, Math.floor(scaled.width + gap));
  const stepY = Math.max(1, Math.floor(scaled.height + gap));

  for (let y = -pageHeight; y <= pageHeight * 2; y += stepY) {
    for (let x = -pageWidth; x <= pageWidth * 2; x += stepX) {
      drawAt(x, y);
    }
  }
}

export async function addWatermarkToPdf(opts: {
  pdfBytes: ArrayBuffer;
  pageNumbers: number[]; // 1-based
  watermark: PdfWatermarkOptions;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.load(opts.pdfBytes, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  const pagesToEdit = new Set(
    opts.pageNumbers
      .map((n) => Math.floor(n))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= pageCount),
  );

  if (pagesToEdit.size === 0) {
    return await doc.save();
  }

  if (opts.watermark.type === "text") {
    const font = await ensureFont(doc);
    for (let i = 0; i < pageCount; i++) {
      const pageNumber = i + 1;
      if (!pagesToEdit.has(pageNumber)) continue;
      const page = doc.getPage(i);
      drawTextWatermarkOnPage({
        page,
        font,
        options: opts.watermark,
      });
    }
  } else {
    const image = await ensureImage(doc, opts.watermark);
    for (let i = 0; i < pageCount; i++) {
      const pageNumber = i + 1;
      if (!pagesToEdit.has(pageNumber)) continue;
      const page = doc.getPage(i);
      drawImageWatermarkOnPage({
        page,
        image,
        options: opts.watermark,
      });
    }
  }

  return await doc.save();
}
