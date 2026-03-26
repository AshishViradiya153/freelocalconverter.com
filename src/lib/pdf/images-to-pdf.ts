import { PDFDocument } from "pdf-lib";

export type ImagesToPdfPageSize = "auto" | "a4" | "letter";
export type ImagesToPdfFit = "contain" | "cover";

export interface ImagesToPdfOptions {
  pageSize: ImagesToPdfPageSize;
  fit: ImagesToPdfFit;
  marginPt: number;
  /** If true, converts unsupported image types (e.g. webp) to PNG via canvas. */
  allowRasterFallback: boolean;
}

export interface ImagesToPdfInputImage {
  file: File;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function getFixedPageSizePt(
  pageSize: Exclude<ImagesToPdfPageSize, "auto">,
): { width: number; height: number } {
  // Points (pt) at 72 DPI.
  if (pageSize === "letter") return { width: 612, height: 792 };
  // A4
  return { width: 595.28, height: 841.89 };
}

async function fileToBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

async function rasterizeToPngBytes(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG"))), "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function computePlacedRect(args: {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  imgWidth: number;
  imgHeight: number;
  fit: ImagesToPdfFit;
}): { x: number; y: number; width: number; height: number } {
  const margin = clamp(args.margin, 0, Math.min(args.pageWidth, args.pageHeight) / 2);
  const maxW = Math.max(1, args.pageWidth - margin * 2);
  const maxH = Math.max(1, args.pageHeight - margin * 2);

  const sx = maxW / args.imgWidth;
  const sy = maxH / args.imgHeight;
  const s = args.fit === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
  const w = args.imgWidth * s;
  const h = args.imgHeight * s;
  const x = (args.pageWidth - w) / 2;
  const y = (args.pageHeight - h) / 2;
  return { x, y, width: w, height: h };
}

async function embedImage(
  doc: PDFDocument,
  file: File,
  allowRasterFallback: boolean,
): Promise<{ image: Awaited<ReturnType<PDFDocument["embedPng"]>> | Awaited<ReturnType<PDFDocument["embedJpg"]>>; width: number; height: number }> {
  const type = file.type.toLowerCase();

  if (type === "image/png") {
    const bytes = await fileToBytes(file);
    const image = await doc.embedPng(bytes);
    return { image, width: image.width, height: image.height };
  }

  if (type === "image/jpeg" || type === "image/jpg") {
    const bytes = await fileToBytes(file);
    const image = await doc.embedJpg(bytes);
    return { image, width: image.width, height: image.height };
  }

  if (!allowRasterFallback) {
    throw new Error(`Unsupported image type: ${file.type || "unknown"}. Use PNG or JPG.`);
  }

  const pngBytes = await rasterizeToPngBytes(file);
  const image = await doc.embedPng(pngBytes);
  return { image, width: image.width, height: image.height };
}

export async function imagesToPdf(opts: {
  images: ImagesToPdfInputImage[];
  options: ImagesToPdfOptions;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const margin = clamp(opts.options.marginPt, 0, 200);

  for (const item of opts.images) {
    const { image, width: imgWidth, height: imgHeight } = await embedImage(
      doc,
      item.file,
      opts.options.allowRasterFallback,
    );

    const page = (() => {
      if (opts.options.pageSize === "auto") {
        return doc.addPage([imgWidth, imgHeight]);
      }
      const { width, height } = getFixedPageSizePt(opts.options.pageSize);
      return doc.addPage([width, height]);
    })();

    const rect =
      opts.options.pageSize === "auto"
        ? { x: 0, y: 0, width: imgWidth, height: imgHeight }
        : computePlacedRect({
          pageWidth: page.getWidth(),
          pageHeight: page.getHeight(),
          margin,
          imgWidth,
          imgHeight,
          fit: opts.options.fit,
        });

    page.drawImage(image, rect);
  }

  return await doc.save();
}

