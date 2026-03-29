"use client";

import {
  Download,
  Expand,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { FilePdfGlyph } from "@/components/file-glyphs";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { downloadBlob } from "@/lib/download-blob";
import {
  canvasToBlob,
  downloadPdfImagesAsZip,
  exportContactSheetFromCanvases,
  exportLongImageFromCanvases,
  exportPdfPagesToImages,
  renderPdfPageToCanvas,
  renderPdfThumbnails,
} from "@/lib/pdf/pdf-to-image";
import { getPdfJs } from "@/lib/pdf/pdfjs";
import { cn } from "@/lib/utils";

type OutputFormat = "png" | "jpeg" | "webp";
type PageMode = "all" | "selected" | "range";
type ExportMode = "pages" | "zip" | "long-image" | "contact-sheet";
type PageFilter = "all" | "odd" | "even";
type SizeMode = "dpi" | "width";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parsePageRange(input: string, pageCount: number): number[] {
  const cleaned = input.trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/[, ]+/).filter(Boolean);
  const out = new Set<number>();

  for (const p of parts) {
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const g1 = m[1];
      const g2 = m[2];
      if (g1 === undefined || g2 === undefined) continue;
      const a = Number.parseInt(g1, 10);
      const b = Number.parseInt(g2, 10);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const from = clamp(Math.min(a, b), 1, pageCount);
      const to = clamp(Math.max(a, b), 1, pageCount);
      for (let i = from; i <= to; i++) out.add(i);
      continue;
    }
    const n = Number.parseInt(p, 10);
    if (!Number.isFinite(n)) continue;
    const v = clamp(n, 1, pageCount);
    out.add(v);
  }

  return Array.from(out).sort((a, b) => a - b);
}

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.pdf$/i, "");
  return leaf || "export";
}

export function PdfToImageApp() {
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<null | {
    title: string;
    src: string;
  }>(null);

  const [pageCount, setPageCount] = React.useState(0);
  const [thumbs, setThumbs] = React.useState<
    Array<{
      pageNumber: number;
      dataUrl: string;
      width: number;
      height: number;
    }>
  >([]);
  const [selectedPages, setSelectedPages] = React.useState<Set<number>>(
    () => new Set(),
  );

  const [pageMode, setPageMode] = React.useState<PageMode>("all");
  const [rangeInput, setRangeInput] = React.useState("1-3");
  const [excludeInput, setExcludeInput] = React.useState("");
  const [pageFilter, setPageFilter] = React.useState<PageFilter>("all");

  const [format, setFormat] = React.useState<OutputFormat>("png");
  const [sizeMode, setSizeMode] = React.useState<SizeMode>("dpi");
  const [dpi, setDpi] = React.useState(150);
  const [targetWidthPx, setTargetWidthPx] = React.useState(1600);
  const [quality, setQuality] = React.useState(0.92);
  const [backgroundHex, setBackgroundHex] = React.useState("#ffffff");
  const [cropMargins, setCropMargins] = React.useState(false);

  const [exportMode, setExportMode] = React.useState<ExportMode>("zip");

  // stretch: combine outputs
  const [longDirection, setLongDirection] = React.useState<
    "vertical" | "horizontal"
  >("vertical");
  const [longGap, setLongGap] = React.useState(12);
  const [contactColumns, setContactColumns] = React.useState(3);
  const [contactPadding, setContactPadding] = React.useState(12);

  const [progress, setProgress] = React.useState<null | {
    done: number;
    total: number;
    pageNumber: number;
  }>(null);

  const pdfRef = React.useRef<import("pdfjs-dist").PDFDocumentProxy | null>(
    null,
  );

  const effectiveBaseName = React.useMemo(() => {
    return file ? baseNameFromFileName(file.name) : "export";
  }, [file]);

  const effectivePageNumbers = React.useMemo(() => {
    if (pageCount <= 0) return [];
    if (pageMode === "all") {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    if (pageMode === "selected") {
      return Array.from(selectedPages).sort((a, b) => a - b);
    }
    return parsePageRange(rangeInput, pageCount);
  }, [pageCount, pageMode, rangeInput, selectedPages]);

  const effectivePageNumbersFiltered = React.useMemo(() => {
    if (effectivePageNumbers.length === 0) return [];

    const excluded = excludeInput.trim()
      ? new Set(parsePageRange(excludeInput, pageCount))
      : new Set<number>();

    return effectivePageNumbers
      .filter((n) => {
        if (excluded.has(n)) return false;
        if (pageFilter === "odd") return n % 2 === 1;
        if (pageFilter === "even") return n % 2 === 0;
        return true;
      })
      .sort((a, b) => a - b);
  }, [effectivePageNumbers, excludeInput, pageCount, pageFilter]);

  const needsBackground = format === "jpeg" || format === "webp";

  const canConvert = Boolean(
    pdfRef.current &&
      effectivePageNumbersFiltered.length > 0 &&
      !busy &&
      !loadError,
  );

  async function onLoadPdf(nextFile: File) {
    setBusy(true);
    setLoadError(null);
    setProgress(null);
    setFile(nextFile);
    setThumbs([]);
    setSelectedPages(new Set());
    setPageMode("all");

    try {
      const pdfjs = await getPdfJs();
      const buf = await nextFile.arrayBuffer();
      const task = pdfjs.getDocument({ data: buf });
      const pdf = await task.promise;
      pdfRef.current = pdf;
      setPageCount(pdf.numPages);

      const t = await renderPdfThumbnails(pdf, {
        maxThumbPx: 220,
        pageLimit: Math.min(24, pdf.numPages),
      });
      setThumbs(t);
    } catch (e) {
      pdfRef.current = null;
      setPageCount(0);
      setThumbs([]);
      setLoadError(e instanceof Error ? e.message : "Failed to load PDF");
    } finally {
      setBusy(false);
    }
  }

  function onClear() {
    pdfRef.current = null;
    setFile(null);
    setBusy(false);
    setLoadError(null);
    setPageCount(0);
    setThumbs([]);
    setSelectedPages(new Set());
    setProgress(null);
  }

  async function onConvert() {
    const pdf = pdfRef.current;
    if (!pdf) return;
    if (effectivePageNumbersFiltered.length === 0) return;

    setBusy(true);
    setLoadError(null);
    setProgress({
      done: 0,
      total: effectivePageNumbersFiltered.length,
      pageNumber: 0,
    });

    try {
      const exportOptions = {
        format,
        dpi: sizeMode === "dpi" ? dpi : undefined,
        targetWidthPx: sizeMode === "width" ? targetWidthPx : undefined,
        quality,
        backgroundHex: needsBackground ? backgroundHex : undefined,
        crop: cropMargins,
      } as const;

      if (exportMode === "pages" || exportMode === "zip") {
        const images = await exportPdfPagesToImages({
          pdf,
          fileBaseName: effectiveBaseName,
          pageNumbers: effectivePageNumbersFiltered,
          exportOptions,
          onProgress: setProgress,
        });

        if (exportMode === "pages") {
          for (const img of images) downloadBlob(img.blob, img.filename);
          toast.success(`Downloaded ${images.length} image(s)`);
          return;
        }

        downloadPdfImagesAsZip(
          images.map((x) => ({ filename: x.filename, blob: x.blob })),
          `${effectiveBaseName}-${format}-pages.zip`,
        );
        toast.success(`Downloaded ZIP (${images.length} image(s))`);
        return;
      }

      // Stretch: render pages to canvases once, then combine.
      const canvases: HTMLCanvasElement[] = [];
      for (let i = 0; i < effectivePageNumbersFiltered.length; i++) {
        const pageNumber = effectivePageNumbersFiltered[i];
        if (pageNumber === undefined) continue;
        setProgress({
          done: i,
          total: effectivePageNumbersFiltered.length,
          pageNumber,
        });
        const page = await pdf.getPage(pageNumber);
        const canvas = await renderPdfPageToCanvas(page, {
          dpi: sizeMode === "dpi" ? dpi : undefined,
          targetWidthPx: sizeMode === "width" ? targetWidthPx : undefined,
          backgroundHex: needsBackground ? backgroundHex : undefined,
          crop: cropMargins,
        });
        canvases.push(canvas);
      }

      if (exportMode === "long-image") {
        const merged = await exportLongImageFromCanvases({
          canvases,
          direction: longDirection,
          gapPx: longGap,
          backgroundHex: needsBackground ? backgroundHex : "#ffffff",
        });
        const blob = await canvasToBlob(merged, exportOptions);
        const ext = format === "jpeg" ? "jpg" : format;
        downloadBlob(blob, `${effectiveBaseName}-long.${ext}`);
        toast.success("Downloaded merged image");
        return;
      }

      const sheet = await exportContactSheetFromCanvases({
        canvases,
        columns: contactColumns,
        cellPaddingPx: contactPadding,
        backgroundHex: needsBackground ? backgroundHex : "#ffffff",
      });
      const blob = await canvasToBlob(sheet, exportOptions);
      const ext = format === "jpeg" ? "jpg" : format;
      downloadBlob(blob, `${effectiveBaseName}-contact-sheet.${ext}`);
      toast.success("Downloaded contact sheet");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Conversion failed");
      toast.error("Conversion failed");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FilePdfGlyph className="size-8 text-muted-foreground" aria-hidden />
          <h1 className={toolHeroTitleClassName}>PDF to Image</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Convert PDF pages to PNG/JPG/WebP locally in your browser. Pick pages,
          resolution, quality, and download single images, a ZIP, or combined
          outputs.
        </p>
      </header>

      {!file ? (
        <FileDropZone
          disabled={false}
          busy={busy}
          inputId="pdf-to-image-input"
          accept=".pdf,application/pdf"
          onFiles={(files) => {
            const f = files?.[0];
            if (f) void onLoadPdf(f);
          }}
          fileIcon={FilePdfGlyph}
          dropTitle="Drop a PDF here or click to browse"
          dropHint="Local-only conversion · page picker · ZIP download · merge to one image"
          chooseLabel="Choose PDF"
          fileHint="Your PDF stays on this device."
        />
      ) : null}

      {busy ? (
        <div
          className="flex items-center gap-2 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {progress ? (
            <span>
              Rendering page {progress.pageNumber} ({progress.done}/
              {progress.total})
            </span>
          ) : (
            <span>Working…</span>
          )}
        </div>
      ) : null}

      {loadError ? (
        <p className="text-destructive text-sm" role="alert">
          {loadError}
        </p>
      ) : null}

      {file ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="size-4" aria-hidden />
              Clear
            </Button>
            <div className="text-muted-foreground text-sm">
              {file.name} · {pageCount} pages
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
            <section className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="font-medium">Pages</div>
                  <div className="text-muted-foreground text-xs">
                    Pick all pages, select thumbnails, or enter a range.
                  </div>
                </div>
                <div className="w-[220px]">
                  <Select
                    value={pageMode}
                    onValueChange={(v) => setPageMode(v as PageMode)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Page selection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All pages</SelectItem>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="range">Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-muted-foreground text-xs">Filter</div>
                <ToggleGroup
                  type="single"
                  value={pageFilter}
                  onValueChange={(v) =>
                    setPageFilter((v as PageFilter) || "all")
                  }
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="all">All</ToggleGroupItem>
                  <ToggleGroupItem value="odd">Odd</ToggleGroupItem>
                  <ToggleGroupItem value="even">Even</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {pageMode === "range" ? (
                <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
                  <Label className="text-sm">Range</Label>
                  <Input
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="1-3, 5, 8-10"
                  />
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
                <Label className="text-sm">Exclude</Label>
                <Input
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  placeholder="e.g. 1, 4-6"
                />
              </div>

              {pageMode === "selected" ? (
                <div className="text-muted-foreground text-xs">
                  Selected: {selectedPages.size}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {thumbs.map((t) => {
                  const isSelected = selectedPages.has(t.pageNumber);
                  const selectable = pageMode === "selected";
                  return (
                    <button
                      key={t.pageNumber}
                      type="button"
                      className={cn(
                        "group overflow-hidden rounded-lg border bg-background text-left transition-colors hover:bg-muted/20",
                        selectable && isSelected
                          ? "border-primary"
                          : "border-border",
                      )}
                      onClick={() => {
                        if (pageMode !== "selected") return;
                        setSelectedPages((prev) => {
                          const next = new Set(prev);
                          if (next.has(t.pageNumber)) next.delete(t.pageNumber);
                          else next.add(t.pageNumber);
                          return next;
                        });
                      }}
                      aria-pressed={selectable ? isSelected : undefined}
                      aria-label={`Page ${t.pageNumber}${selectable ? (isSelected ? " selected" : " not selected") : ""}`}
                      title={selectable ? "Click to select" : "Preview"}
                    >
                      <div className="group relative aspect-3/4 w-full bg-muted/20">
                        {/* biome-ignore lint/performance/noImgElement: data URL canvas export */}
                        <img
                          src={t.dataUrl}
                          alt=""
                          className="h-full w-full object-contain"
                          decoding="async"
                        />
                        <span className="absolute top-2 right-2 z-10 inline-flex">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-md border bg-background/80 p-2 text-foreground shadow-sm backdrop-blur-sm",
                              "hover:bg-background",
                              "opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100",
                            )}
                            role="button"
                            tabIndex={0}
                            aria-label={`Preview page ${t.pageNumber} full screen`}
                            title="Preview"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPreview({
                                title: `Page ${t.pageNumber}`,
                                src: t.dataUrl,
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              e.stopPropagation();
                              setPreview({
                                title: `Page ${t.pageNumber}`,
                                src: t.dataUrl,
                              });
                            }}
                          >
                            <Expand className="size-4" aria-hidden />
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2">
                        <div className="font-medium text-xs">
                          Page {t.pageNumber}
                        </div>
                        {selectable ? (
                          <div
                            className={cn(
                              "h-2.5 w-2.5 rounded-full border",
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40 bg-transparent",
                            )}
                            aria-hidden
                          />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {thumbs.length < pageCount ? (
                <div className="text-muted-foreground text-xs">
                  Showing previews for the first {thumbs.length} pages.
                </div>
              ) : null}
            </section>

            <aside className="rounded-xl border bg-background p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">Export</div>
                    <div className="text-muted-foreground text-xs">
                      Options appear based on your selections.
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm">Format</Label>
                  <Select
                    value={format}
                    onValueChange={(v) => setFormat(v as OutputFormat)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG (sharp)</SelectItem>
                      <SelectItem value="jpeg">JPG (small)</SelectItem>
                      <SelectItem value="webp">WebP (best balance)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm">Size</Label>
                  <Select
                    value={sizeMode}
                    onValueChange={(v) => setSizeMode(v as SizeMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dpi">DPI</SelectItem>
                      <SelectItem value="width">Target width (px)</SelectItem>
                    </SelectContent>
                  </Select>

                  {sizeMode === "dpi" ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Resolution (DPI)</Label>
                        <span className="text-muted-foreground text-xs">
                          {dpi}
                        </span>
                      </div>
                      <Slider
                        value={[dpi]}
                        min={72}
                        max={300}
                        step={6}
                        onValueChange={(v) => setDpi(v[0] ?? 150)}
                      />
                      <div className="text-muted-foreground text-xs">
                        Higher DPI = sharper images + bigger files.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Width (px)</Label>
                        <span className="text-muted-foreground text-xs">
                          {targetWidthPx}
                        </span>
                      </div>
                      <Slider
                        value={[targetWidthPx]}
                        min={600}
                        max={4000}
                        step={50}
                        onValueChange={(v) => setTargetWidthPx(v[0] ?? 1600)}
                      />
                      <div className="text-muted-foreground text-xs">
                        Useful for web sharing (consistent image widths).
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/10 p-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">Auto-crop margins</div>
                    <div className="text-muted-foreground text-xs">
                      Trims whitespace around page content.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={cropMargins ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setCropMargins((v) => !v)}
                    aria-pressed={cropMargins}
                  >
                    {cropMargins ? "On" : "Off"}
                  </Button>
                </div>

                {format !== "png" ? (
                  <>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Quality</Label>
                        <span className="text-muted-foreground text-xs">
                          {Math.round(quality * 100)}
                        </span>
                      </div>
                      <Slider
                        value={[Math.round(quality * 100)]}
                        min={50}
                        max={98}
                        step={1}
                        onValueChange={(v) =>
                          setQuality(clamp((v[0] ?? 92) / 100, 0.05, 1))
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-sm">Background</Label>
                      <Input
                        type="color"
                        value={backgroundHex}
                        onChange={(e) => setBackgroundHex(e.target.value)}
                        className="h-10"
                      />
                      <div className="text-muted-foreground text-xs">
                        JPG/WebP can’t keep transparency.
                      </div>
                    </div>
                  </>
                ) : null}

                <Separator />

                <div className="grid gap-2">
                  <Label className="text-sm">Download as</Label>
                  <Select
                    value={exportMode}
                    onValueChange={(v) => setExportMode(v as ExportMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zip">ZIP (one file)</SelectItem>
                      <SelectItem value="pages">Separate images</SelectItem>
                      <SelectItem value="long-image">
                        One long image (stretch)
                      </SelectItem>
                      <SelectItem value="contact-sheet">
                        Contact sheet (stretch)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportMode === "long-image" ? (
                  <div className="grid gap-3 rounded-lg border bg-muted/10 p-3">
                    <div className="grid gap-2">
                      <Label className="text-sm">Direction</Label>
                      <Select
                        value={longDirection}
                        onValueChange={(v) =>
                          setLongDirection(v as "vertical" | "horizontal")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vertical">Vertical</SelectItem>
                          <SelectItem value="horizontal">Horizontal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Gap</Label>
                        <span className="text-muted-foreground text-xs">
                          {longGap}px
                        </span>
                      </div>
                      <Slider
                        value={[longGap]}
                        min={0}
                        max={48}
                        step={2}
                        onValueChange={(v) => setLongGap(v[0] ?? 12)}
                      />
                    </div>
                  </div>
                ) : null}

                {exportMode === "contact-sheet" ? (
                  <div className="grid gap-3 rounded-lg border bg-muted/10 p-3">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Columns</Label>
                        <span className="text-muted-foreground text-xs">
                          {contactColumns}
                        </span>
                      </div>
                      <Slider
                        value={[contactColumns]}
                        min={1}
                        max={6}
                        step={1}
                        onValueChange={(v) => setContactColumns(v[0] ?? 3)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Padding</Label>
                        <span className="text-muted-foreground text-xs">
                          {contactPadding}px
                        </span>
                      </div>
                      <Slider
                        value={[contactPadding]}
                        min={0}
                        max={32}
                        step={2}
                        onValueChange={(v) => setContactPadding(v[0] ?? 12)}
                      />
                    </div>
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="default"
                  disabled={!canConvert}
                  onClick={() => void onConvert()}
                >
                  <Download className="size-4" aria-hidden />
                  Convert & download
                </Button>

                <div className="flex items-start gap-2 rounded-lg border bg-muted/10 p-3 text-muted-foreground text-xs">
                  <ImageIcon className="mt-0.5 size-4" aria-hidden />
                  <div className="min-w-0">
                    Everything runs locally in your browser. Your PDF is not
                    uploaded.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : null}

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="h-dvh w-screen max-w-none rounded-none p-0 sm:max-w-none">
          <DialogHeader className="border-border/60 border-b p-4">
            <DialogTitle className="truncate">
              {preview?.title ?? "Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[calc(100dvh-64px)] overflow-auto bg-muted/10 p-4">
            {preview ? (
              // biome-ignore lint/performance/noImgElement: data/object URL preview
              <img
                src={preview.src}
                alt=""
                className="mx-auto h-auto w-full max-w-[1400px] rounded-md border bg-background object-contain"
                decoding="async"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
