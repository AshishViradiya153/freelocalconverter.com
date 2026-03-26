"use client";

import {
  Download,
  Expand,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { FilePdfGlyph } from "@/components/file-glyphs";
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
  renderPdfPageToCanvas,
  renderPdfThumbnails,
} from "@/lib/pdf/pdf-to-image";
import {
  addWatermarkToPdf,
  type PdfWatermarkOptions,
  type WatermarkPlacement,
  type WatermarkType,
} from "@/lib/pdf/pdf-watermark";
import { getPdfJs } from "@/lib/pdf/pdfjs";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type PageMode = "all" | "selected" | "range";
type PageFilter = "all" | "odd" | "even";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) return msg;
    return error.name || "Unknown error";
  }
  if (typeof error === "string" && error.trim()) return error.trim();
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function parsePageRange(input: string, pageCount: number): number[] {
  const cleaned = input.trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/[, ]+/).filter(Boolean);
  const out = new Set<number>();

  for (const p of parts) {
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const aStr = m[1];
      const bStr = m[2];
      if (!aStr || !bStr) continue;
      const a = Number.parseInt(aStr, 10);
      const b = Number.parseInt(bStr, 10);
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

async function readImageBytes(
  file: File,
): Promise<{ bytes: Uint8Array; mime: "image/png" | "image/jpeg" }> {
  const mime =
    file.type === "image/png"
      ? "image/png"
      : file.type === "image/jpeg"
        ? "image/jpeg"
        : null;
  if (!mime) throw new Error("unsupported_image_format");
  const buf = await file.arrayBuffer();
  return { bytes: new Uint8Array(buf), mime };
}

export function PdfWatermarkApp() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = React.useState<ArrayBuffer | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [fullScreenPageNumber, setFullScreenPageNumber] = React.useState<
    number | null
  >(null);
  const [fullScreenImage, setFullScreenImage] = React.useState<null | {
    dataUrl: string;
    width: number;
    height: number;
  }>(null);
  const [fullScreenError, setFullScreenError] = React.useState<string | null>(
    null,
  );
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

  const [watermarkType, setWatermarkType] =
    React.useState<WatermarkType>("text");
  const [placement, setPlacement] =
    React.useState<WatermarkPlacement>("center");
  const [rotateDeg, setRotateDeg] = React.useState(-35);
  const [opacity, setOpacity] = React.useState(0.18);
  const [tile, setTile] = React.useState(true);
  const [tileGapPx, setTileGapPx] = React.useState(120);

  // text watermark
  const [wmText, setWmText] = React.useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = React.useState(56);
  const [colorHex, setColorHex] = React.useState("#111827");

  // image watermark
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imageWidthPercent, setImageWidthPercent] = React.useState(35);

  const [progress, setProgress] = React.useState<null | { phase: string }>(
    null,
  );

  const effectiveBaseName = React.useMemo(() => {
    return file ? baseNameFromFileName(file.name) : "export";
  }, [file]);

  const effectivePageNumbers = React.useMemo(() => {
    if (pageCount <= 0) return [];
    if (pageMode === "all")
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (pageMode === "selected")
      return Array.from(selectedPages).sort((a, b) => a - b);
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

  const canApply =
    Boolean(pdfBytes) &&
    effectivePageNumbersFiltered.length > 0 &&
    !busy &&
    !loadError &&
    (watermarkType === "text" ? wmText.trim().length > 0 : Boolean(imageFile));

  React.useEffect(() => {
    if (fullScreenPageNumber === null || !pdfBytes) return;

    let cancelled = false;
    setFullScreenImage(null);
    setFullScreenError(null);

    void (async () => {
      try {
        const targetWidthPx = (() => {
          if (typeof window === "undefined") return 1800;
          const w = window.innerWidth;
          const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
          return Math.round(clamp(w * dpr, 1400, 2800));
        })();

        const pdfjs = await getPdfJs();
        const pdf = await pdfjs.getDocument({ data: pdfBytes.slice(0) })
          .promise;
        const page = await pdf.getPage(fullScreenPageNumber);
        const canvas = await renderPdfPageToCanvas(page, { targetWidthPx });
        const dataUrl = canvas.toDataURL("image/png");
        if (cancelled) return;
        setFullScreenImage({
          dataUrl,
          width: canvas.width,
          height: canvas.height,
        });
      } catch (e) {
        if (!cancelled) setFullScreenError(errorToMessage(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fullScreenPageNumber, pdfBytes]);

  async function onLoadPdf(nextFile: File) {
    setBusy(true);
    setLoadError(null);
    setProgress({ phase: "Loading PDF…" });
    setFile(nextFile);
    setPdfBytes(null);
    setThumbs([]);
    setSelectedPages(new Set());
    setPageMode("all");

    try {
      const buf = await nextFile.arrayBuffer();
      const bytesForWatermark = buf.slice(0);
      const bytesForPdfJs = buf.slice(0);
      setPdfBytes(bytesForWatermark);

      const pdfjs = await getPdfJs();
      const task = pdfjs.getDocument({ data: bytesForPdfJs });
      const pdf = await task.promise;
      setPageCount(pdf.numPages);

      const t = await renderPdfThumbnails(pdf, {
        maxThumbPx: 220,
        pageLimit: Math.min(24, pdf.numPages),
      });
      setThumbs(t);
    } catch (e) {
      setPageCount(0);
      setThumbs([]);
      setPdfBytes(null);
      setLoadError(e instanceof Error ? e.message : "Failed to load PDF");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function onClear() {
    setFile(null);
    setPdfBytes(null);
    setBusy(false);
    setLoadError(null);
    setPageCount(0);
    setThumbs([]);
    setSelectedPages(new Set());
    setProgress(null);
    setImageFile(null);
  }

  async function onApplyWatermark() {
    const bytes = pdfBytes;
    if (!bytes) return;

    setBusy(true);
    setLoadError(null);
    setProgress({ phase: "Applying watermark…" });

    try {
      const watermark: PdfWatermarkOptions =
        watermarkType === "text"
          ? {
              type: "text",
              text: wmText,
              fontSize,
              colorHex,
              opacity,
              rotateDeg,
              placement,
              tile,
              tileGapPx,
            }
          : (() => {
              const f = imageFile;
              if (!f) throw new Error("missing_watermark_image");
              return {
                type: "image",
                imageBytes: new Uint8Array(),
                imageMime: "image/png",
                opacity,
                rotateDeg,
                placement,
                widthPercent: imageWidthPercent,
                tile,
                tileGapPx,
              } satisfies PdfWatermarkOptions;
            })();

      const resolvedWatermark =
        watermark.type === "image"
          ? (() => {
              const f = imageFile;
              if (!f) throw new Error("missing_watermark_image");
              return readImageBytes(f).then((img) => {
                return {
                  ...watermark,
                  imageBytes: img.bytes,
                  imageMime: img.mime,
                } as const;
              });
            })()
          : Promise.resolve(watermark);

      const wm = await resolvedWatermark;
      const out = await addWatermarkToPdf({
        pdfBytes: bytes.slice(0),
        pageNumbers: effectivePageNumbersFiltered,
        watermark: wm,
      });

      const blob = new Blob([out.slice().buffer], { type: "application/pdf" });
      downloadBlob(blob, `${effectiveBaseName}-watermarked.pdf`);
      toast.success("Downloaded watermarked PDF");
    } catch (e) {
      const message = errorToMessage(e);
      console.error({ watermarkError: e });
      setLoadError(message);
      toast.error(message);
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
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
            PDF Watermark
          </h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Add a text or image watermark to a PDF locally in your browser.
          Control opacity, rotation, placement, and apply to specific pages, no
          uploads.{" "}
          <Link className="text-foreground underline" href="/bulk-pdf-watermark">
            Watermark many PDFs at once
          </Link>
          .
        </p>
      </header>

      {!file ? (
        <FileDropZone
          disabled={false}
          busy={busy}
          inputId="pdf-watermark-input"
          accept=".pdf,application/pdf"
          onFiles={(files) => {
            const f = files?.[0];
            if (f) void onLoadPdf(f);
          }}
          fileIcon={FilePdfGlyph}
          dropTitle="Drop a PDF here or click to browse"
          dropHint="Text or image watermark · page picker · local-only"
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
          <span>{progress?.phase ?? "Working…"}</span>
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
                    Apply to all pages, selected thumbnails, or a range.
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
                        "group relative overflow-hidden rounded-lg border bg-background text-left transition-colors hover:bg-muted/20",
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
                      aria-label={`Page ${t.pageNumber}${
                        selectable
                          ? isSelected
                            ? " selected"
                            : " not selected"
                          : ""
                      }`}
                      title={selectable ? "Click to select" : undefined}
                    >
                      <div className="relative aspect-3/4 w-full bg-muted/20">
                        <Image
                          src={t.dataUrl}
                          alt=""
                          className="h-full w-full object-contain"
                          width={t.width}
                          height={t.height}
                          unoptimized
                        />
                        <span className="absolute top-2 right-2 z-10 inline-flex">
                          <span
                            className={cn(
                              "inline-flex size-9 items-center justify-center rounded-md border bg-background/85 text-foreground shadow-sm backdrop-blur-sm",
                              "hover:bg-background",
                              "opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100",
                            )}
                            role="button"
                            tabIndex={0}
                            aria-label={`Open page ${t.pageNumber} fullscreen`}
                            title="Fullscreen"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFullScreenPageNumber(t.pageNumber);
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              e.stopPropagation();
                              setFullScreenPageNumber(t.pageNumber);
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
                <div className="grid gap-2">
                  <Label className="text-sm">Type</Label>
                  <Select
                    value={watermarkType}
                    onValueChange={(v) => setWatermarkType(v as WatermarkType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {watermarkType === "text" ? (
                  <div
                    key="watermark-text-fields"
                    className="grid gap-3 rounded-lg border bg-muted/10 p-3"
                  >
                    <div className="grid gap-2">
                      <Label className="text-sm">Text</Label>
                      <Input
                        value={wmText ?? ""}
                        onChange={(e) => setWmText(e.target.value)}
                        placeholder="e.g. CONFIDENTIAL"
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Font size</Label>
                        <span className="text-muted-foreground text-xs">
                          {fontSize}
                        </span>
                      </div>
                      <Slider
                        value={[fontSize]}
                        min={10}
                        max={140}
                        step={2}
                        onValueChange={(v) => setFontSize(v[0] ?? 56)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm">Color</Label>
                      <Input
                        type="color"
                        value={colorHex ?? "#000000"}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    key="watermark-image-fields"
                    className="grid gap-3 rounded-lg border bg-muted/10 p-3"
                  >
                    <div className="grid gap-2">
                      <Label className="text-sm">Image (PNG/JPG)</Label>
                      <Input
                        key="watermark-image-file"
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setImageFile(f);
                        }}
                      />
                      <div className="text-muted-foreground text-xs">
                        Tip: use a transparent PNG for best results.
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Width</Label>
                        <span className="text-muted-foreground text-xs">
                          {imageWidthPercent}%
                        </span>
                      </div>
                      <Slider
                        value={[imageWidthPercent]}
                        min={5}
                        max={90}
                        step={1}
                        onValueChange={(v) => setImageWidthPercent(v[0] ?? 35)}
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label className="text-sm">Placement</Label>
                  <Select
                    value={placement}
                    onValueChange={(v) => setPlacement(v as WatermarkPlacement)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="top-left">Top left</SelectItem>
                      <SelectItem value="top-right">Top right</SelectItem>
                      <SelectItem value="bottom-left">Bottom left</SelectItem>
                      <SelectItem value="bottom-right">Bottom right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Opacity</Label>
                    <span className="text-muted-foreground text-xs">
                      {Math.round(opacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[Math.round(opacity * 100)]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(v) =>
                      setOpacity(clamp((v[0] ?? 18) / 100, 0.01, 1))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Rotation</Label>
                    <span className="text-muted-foreground text-xs">
                      {rotateDeg}°
                    </span>
                  </div>
                  <Slider
                    value={[rotateDeg]}
                    min={-90}
                    max={90}
                    step={1}
                    onValueChange={(v) => setRotateDeg(v[0] ?? -35)}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/10 p-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">Tile</div>
                    <div className="text-muted-foreground text-xs">
                      Repeat the watermark across the page.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={tile ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setTile((v) => !v)}
                    aria-pressed={tile}
                  >
                    {tile ? "On" : "Off"}
                  </Button>
                </div>

                {tile ? (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm">Tile gap</Label>
                      <span className="text-muted-foreground text-xs">
                        {tileGapPx}px
                      </span>
                    </div>
                    <Slider
                      value={[tileGapPx]}
                      min={0}
                      max={400}
                      step={5}
                      onValueChange={(v) => setTileGapPx(v[0] ?? 120)}
                    />
                  </div>
                ) : null}

                <Separator />

                <Button
                  type="button"
                  variant="default"
                  disabled={!canApply}
                  onClick={() => void onApplyWatermark()}
                >
                  <Download className="size-4" aria-hidden />
                  Apply & download
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
        open={fullScreenPageNumber !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFullScreenPageNumber(null);
            setFullScreenImage(null);
            setFullScreenError(null);
          }
        }}
      >
        <DialogContent className="fixed inset-0 top-0 left-0 z-50 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-zinc-950 p-0 shadow-none sm:max-w-none sm:rounded-none dark:bg-black">
          <DialogHeader className="shrink-0 space-y-1 border-border/40 border-b bg-background/95 px-4 py-3 pr-14 backdrop-blur-sm">
            <DialogTitle className="text-left font-semibold text-base">
              {fullScreenPageNumber !== null
                ? `Page ${fullScreenPageNumber}`
                : "Preview"}
            </DialogTitle>
            <p className="text-left font-normal text-muted-foreground text-xs leading-snug">
              Sharp preview, re-rendered for your screen. Watermark is applied
              only after you download.
            </p>
          </DialogHeader>

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-auto px-3 py-6 sm:px-6 sm:py-8">
            {fullScreenError ? (
              <p className="max-w-md text-center text-red-400 text-sm">
                {fullScreenError}
              </p>
            ) : null}

            {fullScreenPageNumber !== null &&
            !fullScreenImage &&
            !fullScreenError ? (
              <div
                className="flex flex-col items-center gap-3 text-zinc-400"
                role="status"
                aria-live="polite"
              >
                <Loader2
                  className="size-9 animate-spin text-zinc-300"
                  aria-hidden
                />
                <span className="text-sm">Rendering sharp preview…</span>
              </div>
            ) : null}

            {fullScreenImage ? (
              <div className="flex w-full flex-1 items-center justify-center">
                <Image
                  src={fullScreenImage.dataUrl}
                  alt=""
                  className="max-h-[min(100%,calc(100dvh-6.5rem))] max-w-full rounded-sm object-contain shadow-2xl ring-1 ring-white/10"
                  width={fullScreenImage.width}
                  height={fullScreenImage.height}
                  unoptimized
                  priority
                />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
