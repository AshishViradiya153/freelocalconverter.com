import { rgb, StandardFonts } from "pdf-lib";

export type PdfEditorTool =
  | "select"
  | "text"
  | "draw"
  | "rectangle"
  | "ellipse"
  | "arrow"
  | "image";

export interface PdfEditorPoint {
  x: number;
  y: number;
}

interface PdfEditorAnnotationBase {
  id: string;
  pageIndex: number;
  color: string;
  opacity: number;
}

export interface PdfEditorTextAnnotation extends PdfEditorAnnotationBase {
  type: "text";
  x: number;
  y: number;
  width: number;
  text: string;
  fontSize: number;
}

export interface PdfEditorImageAnnotation extends PdfEditorAnnotationBase {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  imageBytes: Uint8Array;
  mimeType: "image/png" | "image/jpeg";
  fileName: string;
}

export interface PdfEditorDrawAnnotation extends PdfEditorAnnotationBase {
  type: "draw";
  points: PdfEditorPoint[];
  strokeWidth: number;
}

export interface PdfEditorRectangleAnnotation extends PdfEditorAnnotationBase {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  style: "fill" | "outline";
  strokeWidth: number;
}

export interface PdfEditorEllipseAnnotation extends PdfEditorAnnotationBase {
  type: "ellipse";
  x: number;
  y: number;
  width: number;
  height: number;
  style: "fill" | "outline";
  strokeWidth: number;
}

export interface PdfEditorArrowAnnotation extends PdfEditorAnnotationBase {
  type: "arrow";
  start: PdfEditorPoint;
  end: PdfEditorPoint;
  style: "fill" | "outline";
  strokeWidth: number;
}

export type PdfEditorAnnotation =
  | PdfEditorTextAnnotation
  | PdfEditorImageAnnotation
  | PdfEditorDrawAnnotation
  | PdfEditorRectangleAnnotation
  | PdfEditorEllipseAnnotation
  | PdfEditorArrowAnnotation;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function estimateTextLayerHeight(opts: {
  text: string;
  width: number;
  fontSize: number;
}) {
  const normalizedCharWidth = Math.max(opts.fontSize * 0.56, 0.008);
  const lines = wrapTextForWidth({
    text: opts.text,
    maxWidth: Math.max(opts.width, 0.08),
    measure: (value) => value.length * normalizedCharWidth,
  });
  return Math.max(
    lines.length * opts.fontSize * 1.3 + 0.02,
    opts.fontSize * 1.7,
    0.06,
  );
}

export function parseEditorHexColor(hex: string) {
  const match = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match?.[1]) {
    return rgb(0.0667, 0.0941, 0.1529);
  }

  const parsed = Number.parseInt(match[1], 16);
  return rgb(
    ((parsed >> 16) & 255) / 255,
    ((parsed >> 8) & 255) / 255,
    (parsed & 255) / 255,
  );
}

export function normalizeRect(
  start: PdfEditorPoint,
  end: PdfEditorPoint,
): Pick<PdfEditorRectangleAnnotation, "x" | "y" | "width" | "height"> {
  const x = clamp(Math.min(start.x, end.x), 0, 1);
  const y = clamp(Math.min(start.y, end.y), 0, 1);
  const width = clamp(Math.abs(end.x - start.x), 0, 1);
  const height = clamp(Math.abs(end.y - start.y), 0, 1);

  return { x, y, width, height };
}

export function getAnnotationBounds(annotation: PdfEditorAnnotation) {
  switch (annotation.type) {
    case "text":
      return {
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: estimateTextLayerHeight({
          text: annotation.text,
          width: annotation.width,
          fontSize: annotation.fontSize,
        }),
      };
    case "image":
    case "rectangle":
    case "ellipse":
      return annotation;
    case "arrow": {
      const minSize = 0.003;
      const x = Math.min(annotation.start.x, annotation.end.x);
      const y = Math.min(annotation.start.y, annotation.end.y);
      const width = Math.max(
        Math.abs(annotation.end.x - annotation.start.x),
        minSize,
      );
      const height = Math.max(
        Math.abs(annotation.end.y - annotation.start.y),
        minSize,
      );
      return { x, y, width, height };
    }
    case "draw": {
      if (annotation.points.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (const point of annotation.points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }

      return {
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 0.001),
        height: Math.max(maxY - minY, 0.001),
      };
    }
  }
}

export function moveAnnotation(
  annotation: PdfEditorAnnotation,
  dx: number,
  dy: number,
): PdfEditorAnnotation {
  switch (annotation.type) {
    case "text":
    case "image":
    case "rectangle":
    case "ellipse":
      return {
        ...annotation,
        x: clamp(annotation.x + dx, 0, 1),
        y: clamp(annotation.y + dy, 0, 1),
      };
    case "arrow":
      return {
        ...annotation,
        start: {
          x: clamp(annotation.start.x + dx, 0, 1),
          y: clamp(annotation.start.y + dy, 0, 1),
        },
        end: {
          x: clamp(annotation.end.x + dx, 0, 1),
          y: clamp(annotation.end.y + dy, 0, 1),
        },
      };
    case "draw":
      return {
        ...annotation,
        points: annotation.points.map((point) => ({
          x: clamp(point.x + dx, 0, 1),
          y: clamp(point.y + dy, 0, 1),
        })),
      };
  }
}

export function resizeAnnotation(
  annotation: PdfEditorAnnotation,
  nextWidth: number,
  nextHeight: number,
): PdfEditorAnnotation {
  switch (annotation.type) {
    case "text": {
      const clampedWidth = clamp(nextWidth, 0.08, 0.98 - annotation.x);
      return {
        ...annotation,
        width: clampedWidth,
        fontSize: clamp(
          annotation.fontSize * (clampedWidth / annotation.width),
          0.004,
          0.18,
        ),
      };
    }
    case "image":
    case "rectangle":
    case "ellipse":
      return {
        ...annotation,
        width: clamp(nextWidth, 0.03, 0.98 - annotation.x),
        height: clamp(nextHeight, 0.03, 0.98 - annotation.y),
      };
    case "arrow":
      return {
        ...annotation,
        end: {
          x: clamp(annotation.start.x + nextWidth, 0, 1),
          y: clamp(annotation.start.y + nextHeight, 0, 1),
        },
      };
    case "draw":
      return annotation;
  }
}

export function resizeAnnotationFromBounds(opts: {
  annotation: PdfEditorAnnotation;
  initialBounds: { x: number; y: number; width: number; height: number };
  nextBounds: { x: number; y: number; width: number; height: number };
}): PdfEditorAnnotation {
  const { annotation, initialBounds, nextBounds } = opts;

  switch (annotation.type) {
    case "text": {
      const width = clamp(nextBounds.width, 0.08, 0.98 - nextBounds.x);
      const widthScale = width / Math.max(initialBounds.width, 0.001);
      return {
        ...annotation,
        x: clamp(nextBounds.x, 0, 0.98),
        y: clamp(nextBounds.y, 0, 0.98),
        width,
        fontSize: clamp(annotation.fontSize * widthScale, 0.004, 0.18),
      };
    }
    case "image":
    case "rectangle":
    case "ellipse":
      return {
        ...annotation,
        x: clamp(nextBounds.x, 0, 0.98),
        y: clamp(nextBounds.y, 0, 0.98),
        width: clamp(nextBounds.width, 0.03, 0.98 - nextBounds.x),
        height: clamp(nextBounds.height, 0.03, 0.98 - nextBounds.y),
      };
    case "arrow": {
      const safeInitialWidth = Math.max(initialBounds.width, 0.0001);
      const safeInitialHeight = Math.max(initialBounds.height, 0.0001);
      const nextX = clamp(nextBounds.x, 0, 0.98);
      const nextY = clamp(nextBounds.y, 0, 0.98);
      const nextWidth = clamp(nextBounds.width, 0.003, 1 - nextX);
      const nextHeight = clamp(nextBounds.height, 0.003, 1 - nextY);
      function mapPoint(point: PdfEditorPoint) {
        const tx = (point.x - initialBounds.x) / safeInitialWidth;
        const ty = (point.y - initialBounds.y) / safeInitialHeight;
        return {
          x: clamp(nextX + tx * nextWidth, 0, 1),
          y: clamp(nextY + ty * nextHeight, 0, 1),
        };
      }
      return {
        ...annotation,
        start: mapPoint(annotation.start),
        end: mapPoint(annotation.end),
      };
    }
    case "draw":
      return annotation;
  }
}

function toPdfY(yTop: number, height: number, pageHeight: number) {
  return pageHeight - yTop - height;
}

function drawArrowHeadPoints(opts: {
  start: PdfEditorPoint;
  end: PdfEditorPoint;
  headLength: number;
  headWidth: number;
}) {
  const { start, end, headLength, headWidth } = opts;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(0.0001, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;

  const base = {
    x: end.x - ux * headLength,
    y: end.y - uy * headLength,
  };

  return {
    left: {
      x: base.x + px * headWidth * 0.5,
      y: base.y + py * headWidth * 0.5,
    },
    tip: end,
    right: {
      x: base.x - px * headWidth * 0.5,
      y: base.y - py * headWidth * 0.5,
    },
    base,
  };
}

function wrapTextForWidth(opts: {
  text: string;
  maxWidth: number;
  measure: (text: string) => number;
}) {
  const { text, maxWidth, measure } = opts;
  const wrapped: string[] = [];
  const paragraphs = text.split(/\r?\n/);

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      wrapped.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }

      if (line) wrapped.push(line);

      if (measure(word) <= maxWidth) {
        line = word;
        continue;
      }

      let chunk = "";
      for (const character of word) {
        const nextChunk = `${chunk}${character}`;
        if (measure(nextChunk) <= maxWidth || chunk.length === 0) {
          chunk = nextChunk;
          continue;
        }
        wrapped.push(chunk);
        chunk = character;
      }
      line = chunk;
    }

    if (line) wrapped.push(line);
  }

  return wrapped;
}

export function buildArrowSvgPath(opts: {
  start: PdfEditorPoint;
  end: PdfEditorPoint;
  headLength: number;
  headWidth: number;
}) {
  const head = drawArrowHeadPoints(opts);
  return `M ${opts.start.x} ${opts.start.y} L ${head.base.x} ${head.base.y} L ${head.left.x} ${head.left.y} L ${head.tip.x} ${head.tip.y} L ${head.right.x} ${head.right.y} L ${head.base.x} ${head.base.y}`;
}

export async function exportEditedPdf(opts: {
  pdfBytes: ArrayBuffer;
  annotations: PdfEditorAnnotation[];
}): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.load(opts.pdfBytes.slice(0), {
    ignoreEncryption: false,
  });
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);

  for (const annotation of opts.annotations) {
    const page = pdf.getPage(annotation.pageIndex);
    if (!page) continue;

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const color = parseEditorHexColor(annotation.color);

    switch (annotation.type) {
      case "text": {
        const x = annotation.x * pageWidth;
        const width = annotation.width * pageWidth;
        const fontSize = clamp(annotation.fontSize * pageWidth, 4, 96);
        const lines = wrapTextForWidth({
          text: annotation.text,
          maxWidth: width,
          measure: (value) => helvetica.widthOfTextAtSize(value, fontSize),
        });
        const lineHeight = fontSize * 1.2;
        const blockHeight = Math.max(lineHeight, lineHeight * lines.length);
        let cursorY =
          toPdfY(annotation.y * pageHeight, blockHeight, pageHeight) +
          blockHeight -
          fontSize;

        for (const line of lines) {
          page.drawText(line, {
            x,
            y: cursorY,
            font: helvetica,
            size: fontSize,
            color,
            opacity: annotation.opacity,
            maxWidth: width,
            lineHeight,
          });
          cursorY -= lineHeight;
        }
        break;
      }
      case "image": {
        const image =
          annotation.mimeType === "image/png"
            ? await pdf.embedPng(annotation.imageBytes)
            : await pdf.embedJpg(annotation.imageBytes);
        const x = annotation.x * pageWidth;
        const width = annotation.width * pageWidth;
        const height = annotation.height * pageHeight;
        const y = toPdfY(annotation.y * pageHeight, height, pageHeight);
        page.drawImage(image, {
          x,
          y,
          width,
          height,
          opacity: annotation.opacity,
        });
        break;
      }
      case "rectangle": {
        const x = annotation.x * pageWidth;
        const width = annotation.width * pageWidth;
        const height = annotation.height * pageHeight;
        const y = toPdfY(annotation.y * pageHeight, height, pageHeight);
        page.drawRectangle({
          x,
          y,
          width,
          height,
          color: annotation.style === "fill" ? color : undefined,
          opacity: annotation.style === "fill" ? annotation.opacity : undefined,
          borderColor: color,
          borderWidth:
            annotation.style === "outline"
              ? clamp(annotation.strokeWidth * pageWidth, 1, 18)
              : undefined,
          borderOpacity:
            annotation.style === "outline" ? annotation.opacity : undefined,
        });
        break;
      }
      case "ellipse": {
        const centerX = (annotation.x + annotation.width / 2) * pageWidth;
        const centerY =
          pageHeight - (annotation.y + annotation.height / 2) * pageHeight;
        page.drawEllipse({
          x: centerX,
          y: centerY,
          xScale: (annotation.width * pageWidth) / 2,
          yScale: (annotation.height * pageHeight) / 2,
          color: annotation.style === "fill" ? color : undefined,
          opacity: annotation.style === "fill" ? annotation.opacity : undefined,
          borderColor: color,
          borderWidth:
            annotation.style === "outline"
              ? clamp(annotation.strokeWidth * pageWidth, 1, 18)
              : undefined,
          borderOpacity:
            annotation.style === "outline" ? annotation.opacity : undefined,
        });
        break;
      }
      case "arrow": {
        const start = {
          x: annotation.start.x * pageWidth,
          y: pageHeight - annotation.start.y * pageHeight,
        };
        const end = {
          x: annotation.end.x * pageWidth,
          y: pageHeight - annotation.end.y * pageHeight,
        };
        const strokeWidth = clamp(annotation.strokeWidth * pageWidth, 1, 18);
        const length = Math.max(
          1,
          Math.hypot(end.x - start.x, end.y - start.y),
        );
        const headLength = Math.max(
          strokeWidth * 3,
          Math.min(length * 0.22, 28),
        );
        const headWidth = Math.max(
          strokeWidth * 2.6,
          Math.min(length * 0.18, 22),
        );

        if (annotation.style === "fill") {
          const path = buildArrowSvgPath({
            start,
            end,
            headLength,
            headWidth,
          });
          page.drawSvgPath(path, {
            color,
            opacity: annotation.opacity,
          });
        } else {
          const head = drawArrowHeadPoints({
            start,
            end,
            headLength,
            headWidth,
          });

          page.drawLine({
            start,
            end: head.base,
            thickness: strokeWidth,
            color,
            opacity: annotation.opacity,
          });
          page.drawLine({
            start: end,
            end: head.left,
            thickness: strokeWidth,
            color,
            opacity: annotation.opacity,
          });
          page.drawLine({
            start: end,
            end: head.right,
            thickness: strokeWidth,
            color,
            opacity: annotation.opacity,
          });
        }
        break;
      }
      case "draw": {
        if (annotation.points.length < 2) break;
        const strokeWidth = clamp(annotation.strokeWidth * pageWidth, 1, 18);
        for (let i = 1; i < annotation.points.length; i++) {
          const prev = annotation.points[i - 1];
          const next = annotation.points[i];
          if (!prev || !next) continue;
          page.drawLine({
            start: {
              x: prev.x * pageWidth,
              y: pageHeight - prev.y * pageHeight,
            },
            end: {
              x: next.x * pageWidth,
              y: pageHeight - next.y * pageHeight,
            },
            thickness: strokeWidth,
            color,
            opacity: annotation.opacity,
          });
        }
        break;
      }
    }
  }

  return await pdf.save();
}
