"use client";

import {
  Download,
  Expand,
  FileText,
  GripVertical,
  Loader2,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Separator } from "@/components/ui/separator";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { downloadBlob } from "@/lib/download-blob";
import { moveArrayElement } from "@/lib/move-array-element";
import { normalizePdfPageOrder } from "@/lib/pdf/page-order";
import {
  renderPdfPageToCanvas,
  renderPdfThumbnails,
} from "@/lib/pdf/pdf-to-image";
import { getPdfJs } from "@/lib/pdf/pdfjs";
import { cn } from "@/lib/utils";

function acceptablePdf(file: File) {
  if (file.type === "application/pdf") return true;
  return /\.pdf$/i.test(file.name);
}

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.pdf$/i, "");
  return leaf || "reordered";
}

async function reorderPdf(opts: { file: File; order: number[] }) {
  const { PDFDocument } = await import("pdf-lib");

  const buf = await opts.file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  if (bytes.byteLength === 0) throw new Error("empty_file");

  const src = await PDFDocument.load(bytes, { ignoreEncryption: false });
  if (src.isEncrypted) throw new Error("encrypted_pdf");
  const pageCount = src.getPageCount();
  if (pageCount === 0) throw new Error("no_pages");

  const safeOrder = normalizePdfPageOrder(opts.order, pageCount);
  if (safeOrder.length === 0) throw new Error("invalid_order");
  if (safeOrder.length !== opts.order.length) throw new Error("invalid_order");

  const out = await PDFDocument.create();
  const pageIndices = safeOrder.map((n) => n - 1);
  const pages = await out.copyPages(src, pageIndices);
  for (const p of pages) out.addPage(p);
  return await out.save();
}

interface OrderedPdfPage {
  id: string;
  pageNumber: number; // 1-based from original
}

interface PdfThumb {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export function ReorderPdfApp() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = React.useState<ArrayBuffer | null>(null);
  const [pages, setPages] = React.useState<OrderedPdfPage[] | null>(null);
  const [thumbs, setThumbs] = React.useState<PdfThumb[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewPageNumber, setPreviewPageNumber] = React.useState<
    number | null
  >(null);
  const [preview, setPreview] = React.useState<null | {
    src: string;
    width: number;
    height: number;
  }>(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);

  const canExport = Boolean(file) && Boolean(pages?.length) && !busy;
  const baseName = React.useMemo(
    () => (file ? baseNameFromFileName(file.name) : "reordered"),
    [file],
  );
  const thumbsByPage = React.useMemo(
    () => new Map(thumbs.map((thumb) => [thumb.pageNumber, thumb])),
    [thumbs],
  );

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    const first = Array.from(files).find(acceptablePdf) ?? null;
    if (!first) {
      setError("No valid PDF found. Please choose a PDF file.");
      return;
    }

    setFile(first);
    setPdfBytes(null);
    setError(null);
    setBusy(true);
    setPages(null);
    setThumbs([]);
    setPreviewPageNumber(null);
    setPreview(null);
    setPreviewError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const buf = await first.arrayBuffer();
      const bytes = new Uint8Array(buf);
      if (bytes.byteLength === 0) throw new Error("empty_file");

      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      if (doc.isEncrypted) throw new Error("encrypted_pdf");
      const pc = doc.getPageCount();
      if (pc === 0) throw new Error("no_pages");
      setPdfBytes(buf.slice(0));
      setPages(
        Array.from({ length: pc }, (_, i) => ({
          id: crypto.randomUUID(),
          pageNumber: i + 1,
        })),
      );

      try {
        const pdfjs = await getPdfJs();
        const pdf = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
        const renderedThumbs = await renderPdfThumbnails(pdf, {
          maxThumbPx: 110,
          pageLimit: pc,
        });
        setThumbs(renderedThumbs);
      } catch {
        setThumbs([]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not read PDF";
      if (msg === "empty_file") setError(`"${first.name}" is empty (0 bytes).`);
      else if (msg === "encrypted_pdf")
        setError(
          `"${first.name}" is password-protected. Please unlock it first, then try again.`,
        );
      else if (msg === "no_pages")
        setError(`"${first.name}" has no pages to reorder.`);
      else setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function onClear() {
    setFile(null);
    setPdfBytes(null);
    setPages(null);
    setThumbs([]);
    setBusy(false);
    setError(null);
    setPreviewPageNumber(null);
    setPreview(null);
    setPreviewError(null);
  }

  React.useEffect(() => {
    if (previewPageNumber === null || !pdfBytes) return;

    let cancelled = false;
    setPreview(null);
    setPreviewError(null);

    void (async () => {
      try {
        const targetWidthPx = (() => {
          if (typeof window === "undefined") return 1800;
          const w = window.innerWidth;
          const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
          return Math.round(Math.min(2800, Math.max(1400, w * dpr)));
        })();

        const pdfjs = await getPdfJs();
        const pdf = await pdfjs.getDocument({ data: pdfBytes.slice(0) }).promise;
        const page = await pdf.getPage(previewPageNumber);
        const canvas = await renderPdfPageToCanvas(page, { targetWidthPx });
        const dataUrl = canvas.toDataURL("image/png");
        if (cancelled) return;
        setPreview({
          src: dataUrl,
          width: canvas.width,
          height: canvas.height,
        });
      } catch (e) {
        if (cancelled) return;
        setPreviewError(e instanceof Error ? e.message : "Preview failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [previewPageNumber, pdfBytes]);

  async function onExport() {
    if (!file || !pages || busy) return;
    setBusy(true);
    setError(null);
    try {
      const order = pages.map((p) => p.pageNumber);
      const bytes = await reorderPdf({ file, order });
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });
      downloadBlob(blob, `${baseName}-reordered.pdf`);
      toast.success("Downloaded reordered PDF");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Reorder failed";
      if (msg === "empty_file") setError(`"${file.name}" is empty (0 bytes).`);
      else if (msg === "encrypted_pdf")
        setError(
          `"${file.name}" is password-protected. Please unlock it first, then try again.`,
        );
      else if (msg === "no_pages")
        setError(`"${file.name}" has no pages to reorder.`);
      else setError(msg);
      toast.error("Reorder failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FileText className="size-8 text-muted-foreground" aria-hidden />
          <h1 className={toolHeroTitleClassName}>Reorder PDF pages</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Reorder pages in a single PDF locally in your browser, no uploads.
          Drag pages to reorder, or use Up/Down for precise ordering, then
          download a new PDF.
        </p>
      </header>

      <FileDropZone
        disabled={busy}
        busy={busy}
        inputId="reorder-pdf-input"
        accept="application/pdf,.pdf"
        multiple={false}
        onFiles={(files) => void onPick(files)}
        fileIcon={FileText}
        dropTitle={
          file
            ? "Drop a different PDF or click to replace"
            : "Drop a PDF here or click to browse"
        }
        dropHint="Reorder pages · export locally · no uploads"
        chooseLabel={file ? "Replace PDF" : "Choose PDF"}
        fileHint="Your PDF stays on this device."
      />

      {busy && !pages ? (
        <div
          className="flex items-center gap-2 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>Reading PDF…</span>
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {file && pages ? (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="font-medium">Pages</div>
                <div className="text-muted-foreground text-xs">
                  Drag to reorder, or use Up/Down.
                </div>
              </div>
              <div className="text-muted-foreground text-sm">
                {pages.length} page(s)
              </div>
            </div>

            <Sortable
              value={pages}
              getItemValue={(p) => p.id}
              onValueChange={setPages}
              orientation="vertical"
              mouseActivationDistance={6}
            >
              <SortableContent
                className="divide-y overflow-hidden rounded-xl border bg-background"
                aria-label="Page order"
              >
                {pages.map((p, idx) => (
                  <SortableItem
                    key={p.id}
                    value={p.id}
                    className="flex items-center gap-3 bg-background p-3"
                  >
                    <button
                      type="button"
                      className="group relative flex w-20 shrink-0 overflow-hidden rounded-lg border bg-muted/10 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        const thumb = thumbsByPage.get(p.pageNumber);
                        if (!thumb) return;
                        setPreviewPageNumber(p.pageNumber);
                      }}
                      disabled={!thumbsByPage.has(p.pageNumber)}
                      aria-label={
                        thumbsByPage.has(p.pageNumber)
                          ? `Open preview for page ${p.pageNumber}`
                          : `Preview unavailable for page ${p.pageNumber}`
                      }
                      title={
                        thumbsByPage.has(p.pageNumber)
                          ? `Preview page ${p.pageNumber}`
                          : "Preview unavailable"
                      }
                    >
                      <div className="relative aspect-[3/4] w-full bg-muted/20">
                        {(() => {
                          const thumb = thumbsByPage.get(p.pageNumber);
                          if (!thumb) {
                            return (
                              <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-muted-foreground leading-tight">
                                Page {p.pageNumber}
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* biome-ignore lint/performance/noImgElement: data URL canvas export */}
                              <img
                                src={thumb.dataUrl}
                                alt=""
                                className="h-full w-full object-contain"
                                decoding="async"
                              />
                              <span className="absolute top-1.5 right-1.5 inline-flex rounded-md border bg-background/85 p-1 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                                <Expand className="size-3.5" aria-hidden />
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sm">
                        Page {p.pageNumber}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Position {idx + 1} in export
                      </div>
                    </div>

                    <SortableItemHandle
                      className="inline-flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-muted/30"
                      aria-label={`Drag to reorder page ${p.pageNumber}`}
                      title="Drag to reorder"
                      disabled={busy}
                    >
                      <GripVertical className="size-4" aria-hidden />
                    </SortableItemHandle>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || idx === 0}
                        onClick={() =>
                          setPages((prev) =>
                            prev ? moveArrayElement(prev, idx, idx - 1) : prev,
                          )
                        }
                      >
                        Up
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || idx === pages.length - 1}
                        onClick={() =>
                          setPages((prev) =>
                            prev ? moveArrayElement(prev, idx, idx + 1) : prev,
                          )
                        }
                      >
                        Down
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          setPages((prev) =>
                            prev ? prev.filter((x) => x.id !== p.id) : prev,
                          )
                        }
                        className={cn(
                          "text-destructive hover:text-destructive",
                        )}
                        aria-label={`Remove page ${p.pageNumber}`}
                        title="Remove"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </SortableItem>
                ))}
              </SortableContent>
            </Sortable>

            <p className="text-muted-foreground text-xs">
              Removing a page excludes it from the exported PDF.
            </p>
          </section>

          <aside className="rounded-xl border bg-background p-4">
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-medium">Export</div>
                <div className="text-muted-foreground text-xs">
                  Download a new PDF with pages in the order shown.
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClear}
                  disabled={busy}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Clear
                </Button>
              </div>

              <Button
                type="button"
                variant="default"
                disabled={!canExport}
                onClick={() => void onExport()}
              >
                <Download className="size-4" aria-hidden />
                Download reordered PDF
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      <Dialog
        open={previewPageNumber !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewPageNumber(null);
            setPreview(null);
            setPreviewError(null);
          }
        }}
      >
        <DialogContent className="h-dvh w-screen max-w-none rounded-none p-0 sm:max-w-none">
          <DialogHeader className="border-border/60 border-b p-4">
            <DialogTitle className="truncate">
              {previewPageNumber ? `Page ${previewPageNumber}` : "Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[calc(100dvh-64px)] overflow-auto bg-muted/10 p-4">
            {previewError ? (
              <div className="mx-auto max-w-xl rounded-md border border-destructive/30 bg-background p-4 text-destructive text-sm">
                {previewError}
              </div>
            ) : preview ? (
              // biome-ignore lint/performance/noImgElement: data URL preview
              <img
                src={preview.src}
                alt=""
                className="mx-auto h-auto w-full max-w-[1400px] rounded-md border bg-background object-contain"
                decoding="async"
              />
            ) : (
              <div
                className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                <span>Rendering sharp preview…</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
