"use client";

import {
  ArrowRight,
  Circle,
  Download,
  ImagePlus,
  Loader2,
  MousePointer2,
  PenLine,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";
import { FilePdfGlyph } from "@/components/file-glyphs";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/download-blob";
import {
  estimateTextLayerHeight,
  exportEditedPdf,
  getAnnotationBounds,
  moveAnnotation,
  normalizeRect,
  type PdfEditorAnnotation,
  type PdfEditorArrowAnnotation,
  type PdfEditorDrawAnnotation,
  type PdfEditorEllipseAnnotation,
  type PdfEditorImageAnnotation,
  type PdfEditorPoint,
  type PdfEditorRectangleAnnotation,
  type PdfEditorTextAnnotation,
  type PdfEditorTool,
  resizeAnnotationFromBounds,
} from "@/lib/pdf/pdf-editor";
import { renderPdfPageToCanvas } from "@/lib/pdf/pdf-to-image";
import { getPdfJs } from "@/lib/pdf/pdfjs";
import { cn } from "@/lib/utils";

interface RenderedPdfPage {
  pageIndex: number;
  pageNumber: number;
  width: number;
  height: number;
  dataUrl: string;
}

interface DragState {
  annotationId: string;
  pageIndex: number;
  mode: "move" | "resize";
  resizeHandle?: ResizeHandle;
  pointerId: number;
  origin: PdfEditorPoint;
  initialAnnotation: PdfEditorAnnotation;
  initialBounds: { x: number; y: number; width: number; height: number };
}

interface CreationState {
  pageIndex: number;
  pointerId: number;
  start: PdfEditorPoint;
  current: PdfEditorPoint;
  drawAnnotationId?: string;
}

type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readableError(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  return "Something went wrong";
}

function acceptablePdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function acceptableImage(file: File) {
  return file.type === "image/png" || file.type === "image/jpeg";
}

function fileBaseName(name: string) {
  return name.replace(/\.pdf$/i, "") || "edited";
}

function autoFitTextLayer(annotation: PdfEditorTextAnnotation, text: string) {
  const longestToken = text
    .split(/\s+/)
    .reduce((max, token) => Math.max(max, token.length), 0);
  const preferredWidth = clamp(
    Math.max(
      annotation.width,
      annotation.fontSize * longestToken * 0.62 + 0.04,
    ),
    0.12,
    0.9 - annotation.x,
  );
  const maxHeight = Math.max(0.12, 0.96 - annotation.y);
  const estimatedHeight = estimateTextLayerHeight({
    text,
    width: preferredWidth,
    fontSize: annotation.fontSize,
  });
  const fittedFontSize =
    estimatedHeight > maxHeight
      ? clamp(annotation.fontSize * (maxHeight / estimatedHeight), 0.004, 0.18)
      : annotation.fontSize;

  return {
    ...annotation,
    text,
    width: preferredWidth,
    fontSize: fittedFontSize,
  };
}

async function readImageAsset(file: File) {
  const mimeType: "image/png" | "image/jpeg" | null =
    file.type === "image/png"
      ? "image/png"
      : file.type === "image/jpeg"
        ? "image/jpeg"
        : null;
  if (!mimeType) {
    throw new Error("Please use a PNG or JPG image.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const objectUrl = URL.createObjectURL(file);
  const dimensions = await new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      const image = document.createElement("img");
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
        URL.revokeObjectURL(objectUrl);
      };
      image.onerror = () => {
        reject(new Error("Could not read image."));
        URL.revokeObjectURL(objectUrl);
      };
      image.src = objectUrl;
    },
  );

  return {
    bytes,
    mimeType,
    dataUrl: await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Could not preview image."));
      reader.readAsDataURL(file);
    }),
    width: dimensions.width,
    height: dimensions.height,
    fileName: file.name,
  };
}

const TOOL_LABELS: Array<{
  value: PdfEditorTool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "select", label: "Select", icon: MousePointer2 },
  { value: "text", label: "Text", icon: Type },
  { value: "draw", label: "Draw", icon: PenLine },
  { value: "rectangle", label: "Rectangle", icon: Square },
  { value: "ellipse", label: "Ellipse", icon: Circle },
  { value: "arrow", label: "Arrow", icon: ArrowRight },
  { value: "image", label: "Image", icon: ImagePlus },
];

export function EditPdfApp() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = React.useState<ArrayBuffer | null>(null);
  const [pages, setPages] = React.useState<RenderedPdfPage[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [annotations, setAnnotations] = React.useState<PdfEditorAnnotation[]>(
    [],
  );
  const [selectedAnnotationId, setSelectedAnnotationId] = React.useState<
    string | null
  >(null);
  const [activeTool, setActiveTool] = React.useState<PdfEditorTool>("select");
  const [draftText, setDraftText] = React.useState("Add your note");
  const [draftColor, setDraftColor] = React.useState("#ff5c35");
  const [draftOpacity, setDraftOpacity] = React.useState(0.92);
  const [draftStrokeWidth, setDraftStrokeWidth] = React.useState(0.005);
  const [draftFontSize, setDraftFontSize] = React.useState(0.038);
  const [draftShapeStyle, setDraftShapeStyle] = React.useState<
    "fill" | "outline"
  >("outline");
  const [pendingImage, setPendingImage] = React.useState<null | {
    bytes: Uint8Array;
    mimeType: "image/png" | "image/jpeg";
    dataUrl: string;
    width: number;
    height: number;
    fileName: string;
  }>(null);
  const [renderPhase, setRenderPhase] = React.useState<string | null>(null);
  const [creationState, setCreationState] =
    React.useState<CreationState | null>(null);
  const [dragState, setDragState] = React.useState<DragState | null>(null);
  const [history, setHistory] = React.useState<PdfEditorAnnotation[][]>([]);
  const pageRefs = React.useRef(new Map<number, HTMLDivElement>());
  const interactionSnapshotRef = React.useRef<PdfEditorAnnotation[] | null>(
    null,
  );

  const selectedAnnotation = React.useMemo(
    () =>
      annotations.find(
        (annotation) => annotation.id === selectedAnnotationId,
      ) ?? null,
    [annotations, selectedAnnotationId],
  );

  const baseName = React.useMemo(
    () => (file ? fileBaseName(file.name) : "edited"),
    [file],
  );

  const canDownload =
    Boolean(pdfBytes) && annotations.length > 0 && !busy && !error;

  const commitAnnotations = React.useCallback(
    (
      updater:
        | PdfEditorAnnotation[]
        | ((prev: PdfEditorAnnotation[]) => PdfEditorAnnotation[]),
    ) => {
      setAnnotations((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (next === prev) return prev;
        setHistory((current) => [...current.slice(-39), prev]);
        return next;
      });
    },
    [],
  );

  function resetEditorState() {
    setPages([]);
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setPendingImage(null);
    setCreationState(null);
    setDragState(null);
    setHistory([]);
  }

  async function onPickPdf(files: FileList | null) {
    if (!files?.length) return;
    const nextFile = Array.from(files).find(acceptablePdf) ?? null;
    if (!nextFile) {
      setError("Please choose a PDF file.");
      return;
    }

    setFile(nextFile);
    setError(null);
    setBusy(true);
    resetEditorState();

    try {
      const sourceBuffer = await nextFile.arrayBuffer();
      const bytesForPdfJs = sourceBuffer.slice(0);
      setPdfBytes(sourceBuffer.slice(0));
      setRenderPhase("Loading PDF pages...");

      const pdfjs = await getPdfJs();
      const pdf = await pdfjs.getDocument({ data: bytesForPdfJs }).promise;

      const rendered: RenderedPdfPage[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setRenderPhase(`Rendering page ${pageNumber} of ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNumber);
        const canvas = await renderPdfPageToCanvas(page, {
          targetWidthPx: 1150,
        });
        rendered.push({
          pageIndex: pageNumber - 1,
          pageNumber,
          width: canvas.width,
          height: canvas.height,
          dataUrl: canvas.toDataURL("image/png"),
        });
      }

      setPages(rendered);
      setRenderPhase(null);
    } catch (nextError) {
      setError(readableError(nextError));
      setPdfBytes(null);
      setPages([]);
    } finally {
      setBusy(false);
      setRenderPhase(null);
    }
  }

  async function onPickImage(files: FileList | null) {
    if (!files?.length) return;
    const imageFile = Array.from(files).find(acceptableImage) ?? null;
    if (!imageFile) {
      toast.error("Use a PNG or JPG image.");
      return;
    }

    try {
      const asset = await readImageAsset(imageFile);
      setPendingImage(asset);
      setActiveTool("image");
      toast.success("Image ready. Click on a page to place it.");
    } catch (nextError) {
      toast.error(readableError(nextError));
    }
  }

  function normalizePoint(event: React.PointerEvent, pageIndex: number) {
    const pageElement = pageRefs.current.get(pageIndex);
    if (!pageElement) return null;

    const rect = pageElement.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    return { x, y };
  }

  function beginInteractionSnapshot() {
    if (!interactionSnapshotRef.current) {
      interactionSnapshotRef.current = annotations;
    }
  }

  function commitInteractionSnapshot() {
    const snapshot = interactionSnapshotRef.current;
    if (snapshot) {
      setHistory((prev) => [...prev.slice(-39), snapshot]);
    }
    interactionSnapshotRef.current = null;
  }

  function resetToSelectTool() {
    setActiveTool("select");
  }

  function startToolCreation(event: React.PointerEvent, pageIndex: number) {
    const point = normalizePoint(event, pageIndex);
    if (!point) return;

    if (activeTool === "text") {
      const nextAnnotation: PdfEditorTextAnnotation = {
        id: crypto.randomUUID(),
        type: "text",
        pageIndex,
        x: point.x,
        y: point.y,
        width: 0.26,
        text: draftText.trim() || "Text",
        fontSize: draftFontSize,
        color: draftColor,
        opacity: draftOpacity,
      };
      commitAnnotations((prev) => [...prev, nextAnnotation]);
      setSelectedAnnotationId(nextAnnotation.id);
      resetToSelectTool();
      return;
    }

    if (activeTool === "image") {
      if (!pendingImage) {
        toast.error("Choose an image first.");
        return;
      }
      const aspect = pendingImage.height / Math.max(1, pendingImage.width);
      const width = 0.24;
      const height = clamp(width * aspect, 0.06, 0.42);
      const nextAnnotation: PdfEditorImageAnnotation = {
        id: crypto.randomUUID(),
        type: "image",
        pageIndex,
        x: clamp(point.x - width / 2, 0, 1 - width),
        y: clamp(point.y - height / 2, 0, 1 - height),
        width,
        height,
        dataUrl: pendingImage.dataUrl,
        imageBytes: pendingImage.bytes,
        mimeType: pendingImage.mimeType,
        fileName: pendingImage.fileName,
        color: draftColor,
        opacity: draftOpacity,
      };
      commitAnnotations((prev) => [...prev, nextAnnotation]);
      setSelectedAnnotationId(nextAnnotation.id);
      resetToSelectTool();
      return;
    }

    setCreationState({
      pageIndex,
      pointerId: event.pointerId,
      start: point,
      current: point,
    });
  }

  function finishCreation(pageIndex: number) {
    if (!creationState || creationState.pageIndex !== pageIndex) return;
    const { start, current } = creationState;
    setCreationState(null);

    if (activeTool === "draw") {
      return;
    }

    if (activeTool === "rectangle") {
      const bounds = normalizeRect(start, current);
      if (bounds.width < 0.01 || bounds.height < 0.01) return;
      const nextAnnotation: PdfEditorRectangleAnnotation = {
        id: crypto.randomUUID(),
        type: "rectangle",
        pageIndex,
        ...bounds,
        color: draftColor,
        opacity: draftOpacity,
        style: draftShapeStyle,
        strokeWidth: draftStrokeWidth,
      };
      commitAnnotations((prev) => [...prev, nextAnnotation]);
      setSelectedAnnotationId(nextAnnotation.id);
      resetToSelectTool();
      return;
    }

    if (activeTool === "ellipse") {
      const bounds = normalizeRect(start, current);
      if (bounds.width < 0.01 || bounds.height < 0.01) return;
      const nextAnnotation: PdfEditorEllipseAnnotation = {
        id: crypto.randomUUID(),
        type: "ellipse",
        pageIndex,
        ...bounds,
        color: draftColor,
        opacity: draftOpacity,
        style: draftShapeStyle,
        strokeWidth: draftStrokeWidth,
      };
      commitAnnotations((prev) => [...prev, nextAnnotation]);
      setSelectedAnnotationId(nextAnnotation.id);
      resetToSelectTool();
      return;
    }

    if (activeTool === "arrow") {
      if (
        Math.abs(current.x - start.x) < 0.01 &&
        Math.abs(current.y - start.y) < 0.01
      ) {
        return;
      }
      const nextAnnotation: PdfEditorArrowAnnotation = {
        id: crypto.randomUUID(),
        type: "arrow",
        pageIndex,
        start,
        end: current,
        color: draftColor,
        opacity: draftOpacity,
        style: draftShapeStyle,
        strokeWidth: draftStrokeWidth,
      };
      commitAnnotations((prev) => [...prev, nextAnnotation]);
      setSelectedAnnotationId(nextAnnotation.id);
      resetToSelectTool();
    }
  }

  function beginFreehand(event: React.PointerEvent, pageIndex: number) {
    const point = normalizePoint(event, pageIndex);
    if (!point) return;

    beginInteractionSnapshot();
    const nextAnnotation: PdfEditorDrawAnnotation = {
      id: crypto.randomUUID(),
      type: "draw",
      pageIndex,
      points: [point],
      color: draftColor,
      opacity: draftOpacity,
      strokeWidth: draftStrokeWidth,
    };
    setAnnotations((prev) => [...prev, nextAnnotation]);
    setSelectedAnnotationId(nextAnnotation.id);
    setCreationState({
      pageIndex,
      pointerId: event.pointerId,
      start: point,
      current: point,
      drawAnnotationId: nextAnnotation.id,
    });
  }

  function extendFreehand(event: React.PointerEvent, pageIndex: number) {
    if (
      !creationState ||
      creationState.pageIndex !== pageIndex ||
      creationState.pointerId !== event.pointerId
    ) {
      return;
    }
    const point = normalizePoint(event, pageIndex);
    if (!point) return;

    setCreationState((prev) => (prev ? { ...prev, current: point } : prev));
    setAnnotations((prev) =>
      prev.map((annotation) => {
        if (
          annotation.id !== creationState.drawAnnotationId ||
          annotation.type !== "draw"
        ) {
          return annotation;
        }
        return {
          ...annotation,
          points: [...annotation.points, point],
        };
      }),
    );
  }

  function finishFreehand() {
    if (creationState) commitInteractionSnapshot();
    resetToSelectTool();
    setCreationState(null);
  }

  function onAnnotationPointerDown(
    event: React.PointerEvent,
    annotation: PdfEditorAnnotation,
    pageIndex: number,
    mode: "move" | "resize",
    resizeHandle?: ResizeHandle,
  ) {
    event.stopPropagation();
    if (activeTool !== "select") return;

    const point = normalizePoint(event, pageIndex);
    if (!point) return;
    const bounds = getAnnotationBounds(annotation);
    beginInteractionSnapshot();
    setSelectedAnnotationId(annotation.id);
    setDragState({
      annotationId: annotation.id,
      pageIndex,
      mode,
      resizeHandle,
      pointerId: event.pointerId,
      origin: point,
      initialAnnotation: annotation,
      initialBounds: bounds,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPagePointerMove(event: React.PointerEvent, pageIndex: number) {
    if (activeTool === "draw" && creationState) {
      extendFreehand(event, pageIndex);
      return;
    }

    if (
      creationState &&
      creationState.pageIndex === pageIndex &&
      creationState.pointerId === event.pointerId &&
      !dragState
    ) {
      const point = normalizePoint(event, pageIndex);
      if (!point) return;
      setCreationState((prev) => (prev ? { ...prev, current: point } : prev));
      return;
    }

    if (
      dragState &&
      dragState.pageIndex === pageIndex &&
      dragState.pointerId === event.pointerId
    ) {
      const point = normalizePoint(event, pageIndex);
      if (!point) return;
      const dx = point.x - dragState.origin.x;
      const dy = point.y - dragState.origin.y;

      setAnnotations((prev) =>
        prev.map((annotation) => {
          if (annotation.id !== dragState.annotationId) return annotation;
          if (dragState.mode === "move")
            return moveAnnotation(dragState.initialAnnotation, dx, dy);
          const handle = dragState.resizeHandle ?? "se";
          const right =
            dragState.initialBounds.x + dragState.initialBounds.width;
          const bottom =
            dragState.initialBounds.y + dragState.initialBounds.height;
          let nextX = dragState.initialBounds.x;
          let nextY = dragState.initialBounds.y;
          let nextRight = right;
          let nextBottom = bottom;

          if (handle.includes("w")) nextX = dragState.initialBounds.x + dx;
          if (handle.includes("e")) nextRight = right + dx;
          if (handle.includes("n")) nextY = dragState.initialBounds.y + dy;
          if (handle.includes("s")) nextBottom = bottom + dy;

          const minWidth =
            dragState.initialAnnotation.type === "arrow" ? 0.003 : 0.03;
          const minHeight =
            dragState.initialAnnotation.type === "arrow" ? 0.003 : 0.03;
          const normalizedX = Math.min(nextX, nextRight - minWidth);
          const normalizedY = Math.min(nextY, nextBottom - minHeight);
          const normalizedRight = Math.max(nextRight, normalizedX + minWidth);
          const normalizedBottom = Math.max(
            nextBottom,
            normalizedY + minHeight,
          );
          return resizeAnnotationFromBounds({
            annotation: dragState.initialAnnotation,
            initialBounds: dragState.initialBounds,
            nextBounds: {
              x: clamp(normalizedX, 0, 0.98),
              y: clamp(normalizedY, 0, 0.98),
              width: clamp(normalizedRight - normalizedX, minWidth, 1),
              height: clamp(normalizedBottom - normalizedY, minHeight, 1),
            },
          });
        }),
      );
    }
  }

  function onPagePointerUp(event: React.PointerEvent, pageIndex: number) {
    if (
      dragState &&
      dragState.pageIndex === pageIndex &&
      dragState.pointerId === event.pointerId
    ) {
      commitInteractionSnapshot();
      setDragState(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (
      !creationState ||
      creationState.pageIndex !== pageIndex ||
      creationState.pointerId !== event.pointerId
    ) {
      return;
    }
    if (activeTool === "draw") {
      finishFreehand();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }
    finishCreation(pageIndex);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onPagePointerDown(event: React.PointerEvent, pageIndex: number) {
    if (activeTool === "select") {
      setSelectedAnnotationId(null);
      return;
    }

    if (activeTool === "draw") {
      event.currentTarget.setPointerCapture(event.pointerId);
      beginFreehand(event, pageIndex);
      return;
    }

    if (
      activeTool === "rectangle" ||
      activeTool === "ellipse" ||
      activeTool === "arrow"
    ) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    startToolCreation(event, pageIndex);
  }

  function updateSelectedAnnotation(
    updater: (annotation: PdfEditorAnnotation) => PdfEditorAnnotation,
  ) {
    if (!selectedAnnotationId) return;
    commitAnnotations((prev) =>
      prev.map((annotation) =>
        annotation.id === selectedAnnotationId
          ? updater(annotation)
          : annotation,
      ),
    );
  }

  function removeSelected() {
    if (!selectedAnnotationId) return;
    commitAnnotations((prev) =>
      prev.filter((annotation) => annotation.id !== selectedAnnotationId),
    );
    setSelectedAnnotationId(null);
  }

  function undoLast() {
    setHistory((prev) => {
      const last = prev.at(-1);
      if (!last) return prev;
      setAnnotations(last);
      return prev.slice(0, -1);
    });
  }

  async function onDownload() {
    if (!pdfBytes || busy) return;
    setBusy(true);
    setError(null);
    try {
      const editedBytes = await exportEditedPdf({ pdfBytes, annotations });
      downloadBlob(
        new Blob([new Uint8Array(editedBytes)], { type: "application/pdf" }),
        `${baseName}-edited.pdf`,
      );
      toast.success("Edited PDF downloaded");
    } catch (nextError) {
      const message = readableError(nextError);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const selectedPageNumber =
    selectedAnnotation !== null ? selectedAnnotation.pageIndex + 1 : null;

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <FilePdfGlyph className="size-9 text-muted-foreground" />
          <h1 className={toolHeroTitleClassName}>Edit PDF</h1>
        </div>
        <p className="max-w-4xl text-muted-foreground text-sm leading-relaxed">
          Add text, images, filled or outline shapes, arrows, and freehand marks
          on any PDF page right in the browser. The left sidebar stays put while
          you scroll through pages, then you can export one edited PDF at the
          end.
        </p>
      </header>

      <FileDropZone
        disabled={busy}
        busy={busy}
        inputId="edit-pdf-input"
        accept="application/pdf,.pdf"
        multiple={false}
        onFiles={(files) => void onPickPdf(files)}
        fileIcon={FilePdfGlyph}
        dropTitle={
          file
            ? "Drop a different PDF or click to replace"
            : "Drop a PDF here or click to browse"
        }
        dropHint="Edit locally · annotate pages · download when ready"
        chooseLabel={file ? "Replace PDF" : "Choose PDF"}
        fileHint="Your PDF stays on this device."
      />

      {renderPhase ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-4 py-3 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span>{renderPhase}</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          {error}
        </div>
      ) : null}

      {pages.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Editor controls</p>
                <p className="text-muted-foreground text-xs">
                  Pick a tool, then click or drag on any page.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={history.length === 0 || busy}
                onClick={undoLast}
              >
                <Undo2 className="size-4" />
                Undo
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-2">
              {TOOL_LABELS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Button
                    key={tool.value}
                    type="button"
                    variant={activeTool === tool.value ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setActiveTool(tool.value)}
                  >
                    <Icon className="size-4" />
                    {tool.label}
                  </Button>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="editor-color">Default color (new layers)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="editor-color"
                    type="color"
                    value={draftColor}
                    onChange={(event) => setDraftColor(event.target.value)}
                    className="h-11 w-16 p-1"
                  />
                  <Input
                    value={draftColor}
                    onChange={(event) => setDraftColor(event.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Default opacity (new layers)</Label>
                <Slider
                  value={[draftOpacity]}
                  min={0.15}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => setDraftOpacity(value[0] ?? 0.92)}
                />
                <p className="text-muted-foreground text-xs">
                  {Math.round(draftOpacity * 100)}% visible for new layers
                </p>
              </div>

              {activeTool === "text" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="editor-text">Text</Label>
                    <Textarea
                      id="editor-text"
                      value={draftText}
                      onChange={(event) => setDraftText(event.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Text size</Label>
                    <Slider
                      value={[draftFontSize]}
                      min={0.004}
                      max={0.09}
                      step={0.002}
                      onValueChange={(value) =>
                        setDraftFontSize(value[0] ?? 0.038)
                      }
                    />
                  </div>
                </>
              ) : null}

              {activeTool === "draw" ||
              activeTool === "rectangle" ||
              activeTool === "ellipse" ||
              activeTool === "arrow" ? (
                <>
                  <div className="space-y-2">
                    <Label>Stroke size</Label>
                    <Slider
                      value={[draftStrokeWidth]}
                      min={0.002}
                      max={0.02}
                      step={0.001}
                      onValueChange={(value) =>
                        setDraftStrokeWidth(value[0] ?? 0.005)
                      }
                    />
                  </div>

                  {activeTool !== "draw" ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          draftShapeStyle === "outline" ? "default" : "outline"
                        }
                        className="flex-1"
                        onClick={() => setDraftShapeStyle("outline")}
                      >
                        Outline
                      </Button>
                      <Button
                        type="button"
                        variant={
                          draftShapeStyle === "fill" ? "default" : "outline"
                        }
                        className="flex-1"
                        onClick={() => setDraftShapeStyle("fill")}
                      >
                        Filled
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="edit-pdf-image-input">Place image</Label>
                <Input
                  id="edit-pdf-image-input"
                  type="file"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  onChange={(event) => void onPickImage(event.target.files)}
                />
                <p className="text-muted-foreground text-xs">
                  PNG and JPG are supported. Pick an image, then click a page to
                  place it.
                </p>
                {pendingImage ? (
                  <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
                    <div className="relative aspect-4/3 w-full bg-muted/30">
                      <Image
                        src={pendingImage.dataUrl}
                        alt=""
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="px-3 py-2 text-muted-foreground text-xs">
                      {pendingImage.fileName}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Selected layer</p>
                  <p className="text-muted-foreground text-xs">
                    {selectedAnnotation
                      ? `Page ${selectedPageNumber} · ${selectedAnnotation.type}`
                      : "Select an item on the page to edit it."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!selectedAnnotation}
                  onClick={removeSelected}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>

              {selectedAnnotation?.type === "text" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="selected-text">Text content</Label>
                    <Textarea
                      id="selected-text"
                      value={selectedAnnotation.text}
                      onChange={(event) =>
                        updateSelectedAnnotation((annotation) =>
                          annotation.type === "text"
                            ? autoFitTextLayer(annotation, event.target.value)
                            : annotation,
                        )
                      }
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Text size</Label>
                    <Slider
                      value={[selectedAnnotation.fontSize]}
                      min={0.004}
                      max={0.09}
                      step={0.002}
                      onValueChange={(value) =>
                        updateSelectedAnnotation((annotation) =>
                          annotation.type === "text"
                            ? {
                                ...annotation,
                                fontSize: value[0] ?? annotation.fontSize,
                              }
                            : annotation,
                        )
                      }
                    />
                  </div>
                </>
              ) : null}

              {selectedAnnotation &&
              selectedAnnotation.type !== "image" &&
              selectedAnnotation.type !== "text" ? (
                <div className="space-y-2">
                  <Label>Stroke size</Label>
                  <Slider
                    value={[selectedAnnotation.strokeWidth]}
                    min={0.002}
                    max={0.02}
                    step={0.001}
                    onValueChange={(value) =>
                      updateSelectedAnnotation((annotation) =>
                        "strokeWidth" in annotation
                          ? {
                              ...annotation,
                              strokeWidth: value[0] ?? annotation.strokeWidth,
                            }
                          : annotation,
                      )
                    }
                  />
                </div>
              ) : null}

              {selectedAnnotation &&
              (selectedAnnotation.type === "rectangle" ||
                selectedAnnotation.type === "ellipse" ||
                selectedAnnotation.type === "arrow") ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      selectedAnnotation.style === "outline"
                        ? "default"
                        : "outline"
                    }
                    className="flex-1"
                    onClick={() =>
                      updateSelectedAnnotation((annotation) =>
                        annotation.type === "rectangle" ||
                        annotation.type === "ellipse" ||
                        annotation.type === "arrow"
                          ? { ...annotation, style: "outline" }
                          : annotation,
                      )
                    }
                  >
                    Outline
                  </Button>
                  <Button
                    type="button"
                    variant={
                      selectedAnnotation.style === "fill"
                        ? "default"
                        : "outline"
                    }
                    className="flex-1"
                    onClick={() =>
                      updateSelectedAnnotation((annotation) =>
                        annotation.type === "rectangle" ||
                        annotation.type === "ellipse" ||
                        annotation.type === "arrow"
                          ? { ...annotation, style: "fill" }
                          : annotation,
                      )
                    }
                  >
                    Filled
                  </Button>
                </div>
              ) : null}

              {selectedAnnotation ? (
                <>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={selectedAnnotation.color}
                        onChange={(event) =>
                          updateSelectedAnnotation((annotation) => ({
                            ...annotation,
                            color: event.target.value,
                          }))
                        }
                        className="h-11 w-16 p-1"
                      />
                      <Input
                        value={selectedAnnotation.color}
                        onChange={(event) =>
                          updateSelectedAnnotation((annotation) => ({
                            ...annotation,
                            color: event.target.value,
                          }))
                        }
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Opacity</Label>
                    <Slider
                      value={[selectedAnnotation.opacity]}
                      min={0.15}
                      max={1}
                      step={0.01}
                      onValueChange={(value) =>
                        updateSelectedAnnotation((annotation) => ({
                          ...annotation,
                          opacity: value[0] ?? annotation.opacity,
                        }))
                      }
                    />
                  </div>
                </>
              ) : null}
            </div>

            <Separator className="my-4" />

            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!canDownload}
              onClick={() => void onDownload()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download edited PDF
            </Button>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            {pages.map((page) => {
              const pageAnnotations = annotations.filter(
                (annotation) => annotation.pageIndex === page.pageIndex,
              );
              const ghostBounds =
                creationState && creationState.pageIndex === page.pageIndex
                  ? normalizeRect(creationState.start, creationState.current)
                  : null;

              return (
                <section
                  key={page.pageIndex}
                  className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Page {page.pageNumber}</p>
                      <p className="text-muted-foreground text-xs">
                        {pageAnnotations.length} layer(s)
                      </p>
                    </div>
                    <span className="rounded-full border border-border/70 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                      {page.width} x {page.height}
                    </span>
                  </div>

                  <div
                    ref={(element) => {
                      if (element)
                        pageRefs.current.set(page.pageIndex, element);
                      else pageRefs.current.delete(page.pageIndex);
                    }}
                    className={cn(
                      "relative mx-auto w-full max-w-[920px] overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm",
                      activeTool !== "select" && "cursor-crosshair",
                    )}
                    style={{ aspectRatio: `${page.width} / ${page.height}` }}
                    onPointerDown={(event) =>
                      onPagePointerDown(event, page.pageIndex)
                    }
                    onPointerMove={(event) =>
                      onPagePointerMove(event, page.pageIndex)
                    }
                    onPointerUp={(event) =>
                      onPagePointerUp(event, page.pageIndex)
                    }
                    onPointerCancel={(event) =>
                      onPagePointerUp(event, page.pageIndex)
                    }
                  >
                    <Image
                      src={page.dataUrl}
                      alt={`PDF page ${page.pageNumber}`}
                      fill
                      className="pointer-events-none object-contain"
                      sizes="(min-width: 1280px) 920px, 100vw"
                    />

                    {pageAnnotations.map((annotation) => (
                      <AnnotationLayer
                        key={annotation.id}
                        annotation={annotation}
                        selected={annotation.id === selectedAnnotationId}
                        onSelect={() => setSelectedAnnotationId(annotation.id)}
                        onPointerDownMove={(event) =>
                          onAnnotationPointerDown(
                            event,
                            annotation,
                            page.pageIndex,
                            "move",
                          )
                        }
                        onPointerDownResize={(event, handle) =>
                          onAnnotationPointerDown(
                            event,
                            annotation,
                            page.pageIndex,
                            "resize",
                            handle,
                          )
                        }
                      />
                    ))}

                    {ghostBounds &&
                    activeTool !== "select" &&
                    activeTool !== "text" &&
                    activeTool !== "image" &&
                    activeTool !== "draw" ? (
                      <div
                        className="pointer-events-none absolute border-2 border-primary/70 border-dashed bg-primary/10"
                        style={{
                          left: `${ghostBounds.x * 100}%`,
                          top: `${ghostBounds.y * 100}%`,
                          width: `${ghostBounds.width * 100}%`,
                          height: `${ghostBounds.height * 100}%`,
                        }}
                      />
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnnotationLayer(props: {
  annotation: PdfEditorAnnotation;
  selected: boolean;
  onSelect: () => void;
  onPointerDownMove: (event: React.PointerEvent) => void;
  onPointerDownResize: (
    event: React.PointerEvent,
    handle: ResizeHandle,
  ) => void;
}) {
  const {
    annotation,
    selected,
    onSelect,
    onPointerDownMove,
    onPointerDownResize,
  } = props;

  const bounds = getAnnotationBounds(annotation);
  const commonStyle: React.CSSProperties = {
    left: `${bounds.x * 100}%`,
    top: `${bounds.y * 100}%`,
    width: `${bounds.width * 100}%`,
    height: `${bounds.height * 100}%`,
  };

  return (
    <div
      className={cn(
        "absolute",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-white",
      )}
      role="button"
      tabIndex={0}
      style={commonStyle}
      onPointerDown={onPointerDownMove}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
    >
      {annotation.type === "text" ? (
        <div
          className="h-full w-full whitespace-pre-wrap wrap-break-word p-1 font-medium leading-tight"
          style={{
            color: annotation.color,
            opacity: annotation.opacity,
            fontSize: `${Math.max(annotation.fontSize * 960, 4)}px`,
          }}
        >
          {annotation.text}
        </div>
      ) : null}

      {annotation.type === "image" ? (
        <Image
          src={annotation.dataUrl}
          alt=""
          fill
          className="object-contain"
          style={{ opacity: annotation.opacity }}
        />
      ) : null}

      {annotation.type === "rectangle" ? (
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill={
              annotation.style === "fill" ? annotation.color : "transparent"
            }
            fillOpacity={annotation.style === "fill" ? annotation.opacity : 0}
            stroke={annotation.color}
            strokeWidth={
              annotation.style === "outline"
                ? Math.max(1.5, annotation.strokeWidth * 1100)
                : 0
            }
            strokeOpacity={
              annotation.style === "outline" ? annotation.opacity : 0
            }
          />
        </svg>
      ) : null}

      {annotation.type === "ellipse" ? (
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <ellipse
            cx="50"
            cy="50"
            rx="48"
            ry="48"
            fill={
              annotation.style === "fill" ? annotation.color : "transparent"
            }
            fillOpacity={annotation.style === "fill" ? annotation.opacity : 0}
            stroke={annotation.color}
            strokeWidth={
              annotation.style === "outline"
                ? Math.max(1.5, annotation.strokeWidth * 1100)
                : 0
            }
            strokeOpacity={
              annotation.style === "outline" ? annotation.opacity : 0
            }
          />
        </svg>
      ) : null}

      {annotation.type === "arrow" ? (
        <svg className="absolute inset-0 h-full w-full overflow-visible">
          <ArrowPreview annotation={annotation} bounds={bounds} />
        </svg>
      ) : null}

      {annotation.type === "draw" ? (
        <svg className="absolute inset-0 h-full w-full overflow-visible">
          <polyline
            fill="none"
            stroke={annotation.color}
            strokeWidth={Math.max(2, annotation.strokeWidth * 1100)}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={annotation.opacity}
            points={annotation.points
              .map((point) => {
                const safeWidth = Math.max(bounds.width, 0.0001);
                const safeHeight = Math.max(bounds.height, 0.0001);
                return `${((point.x - bounds.x) / safeWidth) * 100},${((point.y - bounds.y) / safeHeight) * 100}`;
              })
              .join(" ")}
          />
        </svg>
      ) : null}

      {selected && annotation.type !== "draw" ? (
        <>
          {[
            {
              handle: "nw",
              className:
                "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
            },
            {
              handle: "n",
              className:
                "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
            },
            {
              handle: "ne",
              className:
                "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
            },
            {
              handle: "e",
              className:
                "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
            },
            {
              handle: "se",
              className:
                "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
            },
            {
              handle: "s",
              className:
                "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
            },
            {
              handle: "sw",
              className:
                "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
            },
            {
              handle: "w",
              className:
                "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
            },
          ].map((item) => (
            <button
              key={item.handle}
              type="button"
              className={cn(
                "absolute size-4 rounded-full border border-white bg-primary shadow",
                item.className,
              )}
              onPointerDown={(event) => {
                event.stopPropagation();
                onPointerDownResize(event, item.handle as ResizeHandle);
              }}
              aria-label={`Resize layer from ${item.handle}`}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}

function ArrowPreview(props: {
  annotation: Extract<PdfEditorAnnotation, { type: "arrow" }>;
  bounds: { x: number; y: number; width: number; height: number };
}) {
  const { annotation, bounds } = props;
  const safeWidth = Math.max(bounds.width, 0.0001);
  const safeHeight = Math.max(bounds.height, 0.0001);
  const startX = ((annotation.start.x - bounds.x) / safeWidth) * 100;
  const startY = ((annotation.start.y - bounds.y) / safeHeight) * 100;
  const endX = ((annotation.end.x - bounds.x) / safeWidth) * 100;
  const endY = ((annotation.end.y - bounds.y) / safeHeight) * 100;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.max(0.001, Math.hypot(dx, dy));
  const unitX = dx / length;
  const unitY = dy / length;
  const perpX = -unitY;
  const perpY = unitX;
  const headLength = Math.min(Math.max(length * 0.18, 10), 26);
  const headWidth = Math.min(Math.max(length * 0.13, 8), 22);
  const baseX = endX - unitX * headLength;
  const baseY = endY - unitY * headLength;
  const leftX = baseX + perpX * (headWidth / 2);
  const leftY = baseY + perpY * (headWidth / 2);
  const rightX = baseX - perpX * (headWidth / 2);
  const rightY = baseY - perpY * (headWidth / 2);
  const stroke = Math.max(2, annotation.strokeWidth * 1100);

  if (annotation.style === "fill") {
    return (
      <path
        d={`M ${startX} ${startY} L ${baseX} ${baseY} L ${leftX} ${leftY} L ${endX} ${endY} L ${rightX} ${rightY} L ${baseX} ${baseY}`}
        fill={annotation.color}
        fillOpacity={annotation.opacity}
      />
    );
  }

  return (
    <>
      <line
        x1={startX}
        y1={startY}
        x2={baseX}
        y2={baseY}
        stroke={annotation.color}
        strokeWidth={stroke}
        strokeOpacity={annotation.opacity}
        strokeLinecap="round"
      />
      <line
        x1={endX}
        y1={endY}
        x2={leftX}
        y2={leftY}
        stroke={annotation.color}
        strokeWidth={stroke}
        strokeOpacity={annotation.opacity}
        strokeLinecap="round"
      />
      <line
        x1={endX}
        y1={endY}
        x2={rightX}
        y2={rightY}
        stroke={annotation.color}
        strokeWidth={stroke}
        strokeOpacity={annotation.opacity}
        strokeLinecap="round"
      />
    </>
  );
}
