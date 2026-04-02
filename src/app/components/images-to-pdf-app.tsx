"use client";

import { rectSortingStrategy } from "@dnd-kit/sortable";
import {
  Download,
  Expand,
  GripVertical,
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
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { downloadBlob } from "@/lib/download-blob";
import { moveArrayElement } from "@/lib/move-array-element";
import {
  type ImagesToPdfFit,
  type ImagesToPdfPageSize,
  imagesToPdf,
} from "@/lib/pdf/images-to-pdf";
import { cn } from "@/lib/utils";

interface QueuedImage {
  id: string;
  file: File;
  previewUrl: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function baseNameFromFirstFileName(name: string) {
  const leaf = name.replace(/\.(png|jpe?g|webp|gif|bmp|tiff?)$/i, "");
  return leaf || "images";
}

function acceptableImage(file: File) {
  if (!file.type) return true;
  return file.type.startsWith("image/");
}

export function ImagesToPdfApp() {
  const [items, setItems] = React.useState<QueuedImage[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<null | {
    title: string;
    src: string;
  }>(null);

  const [pageSize, setPageSize] = React.useState<ImagesToPdfPageSize>("auto");
  const [fit, setFit] = React.useState<ImagesToPdfFit>("contain");
  const [marginPt, setMarginPt] = React.useState(24);
  const [allowRasterFallback, setAllowRasterFallback] = React.useState(true);

  const baseName = React.useMemo(() => {
    if (items.length === 0) return "images";
    return baseNameFromFirstFileName(items[0]?.file.name);
  }, [items]);

  const canConvert = items.length > 0 && !busy;

  React.useEffect(() => {
    return () => {
      for (const it of items) URL.revokeObjectURL(it.previewUrl);
    };
  }, [items]);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const next: QueuedImage[] = [];
    for (const f of Array.from(files)) {
      if (!acceptableImage(f)) continue;
      next.push({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
      });
    }

    if (next.length === 0) {
      setError(
        "No valid images found. Please choose PNG/JPG/WebP (or other image formats).",
      );
      return;
    }

    setItems((prev) => prev.concat(next));
  }

  function onClear() {
    for (const it of items) URL.revokeObjectURL(it.previewUrl);
    setItems([]);
    setError(null);
    setBusy(false);
  }

  async function onConvert() {
    if (!canConvert) return;
    setBusy(true);
    setError(null);

    try {
      const bytes = await imagesToPdf({
        images: items.map((it) => ({ file: it.file })),
        options: {
          pageSize,
          fit,
          marginPt: clamp(marginPt, 0, 200),
          allowRasterFallback,
        },
      });

      const safeBytes = new Uint8Array(bytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      downloadBlob(blob, `${baseName}.pdf`);
      toast.success(`Downloaded PDF (${items.length} page(s))`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Conversion failed";
      setError(msg);
      toast.error("Conversion failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FilePdfGlyph className="size-8 text-muted-foreground" aria-hidden />
          <h1 className={toolHeroTitleClassName}>Images to PDF</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Add images, reorder them, and export a single PDF locally in your
          browser, no uploads.
        </p>
      </header>

      <FileDropZone
        disabled={false}
        busy={busy}
        inputId="images-to-pdf-input"
        accept="image/*"
        multiple
        onFiles={(files) => addFiles(files)}
        fileIcon={ImageIcon}
        dropTitle="Drop images here or click to browse"
        dropHint="Reorder pages · single PDF download · local-only conversion"
        chooseLabel="Choose images"
        chooseLabelWhenFileSelected="Add more images"
        fileHint="Your files stay on this device."
      />

      {busy ? (
        <div
          className="flex items-center gap-2 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>Building PDF…</span>
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="font-medium">Pages</div>
                <div className="text-muted-foreground text-xs">
                  Drag the grip to reorder, or use Up and Down.
                </div>
              </div>
              <div className="text-muted-foreground text-sm">
                {items.length} image(s)
              </div>
            </div>

            <Sortable
              value={items}
              getItemValue={(it) => it.id}
              onValueChange={setItems}
              orientation="mixed"
              strategy={rectSortingStrategy}
              mouseActivationDistance={6}
            >
              <SortableContent
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                role="list"
                aria-label="Image page order"
              >
                {items.map((it, idx) => (
                  <SortableItem
                    key={it.id}
                    value={it.id}
                    className="overflow-hidden rounded-lg border bg-background"
                  >
                    <div className="group relative aspect-3/4 w-full bg-muted/20">
                      {/* biome-ignore lint/performance/noImgElement: object URL preview */}
                      <img
                        src={it.previewUrl}
                        alt=""
                        className="h-full w-full object-contain"
                        decoding="async"
                      />
                      <button
                        type="button"
                        className={cn(
                          "absolute top-2 right-2 inline-flex items-center justify-center rounded-md border bg-background/80 p-2 text-foreground shadow-sm backdrop-blur-sm",
                          "hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                          "opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100",
                        )}
                        onClick={() =>
                          setPreview({
                            title: it.file.name,
                            src: it.previewUrl,
                          })
                        }
                        aria-label={`Preview ${it.file.name} full screen`}
                        title="Preview"
                      >
                        <Expand className="size-4" aria-hidden />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 font-medium text-xs">
                          <span className="text-muted-foreground">
                            #{idx + 1}
                          </span>{" "}
                          <span className="truncate">{it.file.name}</span>
                        </div>
                        <SortableItemHandle
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-muted/30"
                          aria-label={`Drag to reorder ${it.file.name}`}
                          title="Drag to reorder"
                          disabled={busy}
                        >
                          <GripVertical className="size-4" aria-hidden />
                        </SortableItemHandle>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || idx === 0}
                          onClick={() =>
                            setItems((prev) =>
                              moveArrayElement(prev, idx, idx - 1),
                            )
                          }
                        >
                          Up
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || idx === items.length - 1}
                          onClick={() =>
                            setItems((prev) =>
                              moveArrayElement(prev, idx, idx + 1),
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
                          onClick={() => {
                            setItems((prev) => {
                              const target = prev.find((x) => x.id === it.id);
                              if (target)
                                URL.revokeObjectURL(target.previewUrl);
                              return prev.filter((x) => x.id !== it.id);
                            });
                          }}
                          className={cn(
                            "text-destructive hover:text-destructive",
                          )}
                          aria-label={`Remove ${it.file.name}`}
                          title="Remove"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </SortableContent>
            </Sortable>
          </section>

          <aside className="rounded-xl border bg-background p-4">
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-medium">Export</div>
                <div className="text-muted-foreground text-xs">
                  Choose page sizing and margins.
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm">Page size</Label>
                <Select
                  value={pageSize}
                  onValueChange={(v) => setPageSize(v as ImagesToPdfPageSize)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Auto (match each image)
                    </SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pageSize !== "auto" ? (
                <div className="grid gap-2">
                  <Label className="text-sm">Fit</Label>
                  <Select
                    value={fit}
                    onValueChange={(v) => setFit(v as ImagesToPdfFit)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contain">
                        Contain (no cropping)
                      </SelectItem>
                      <SelectItem value="cover">Cover (may crop)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {pageSize !== "auto" ? (
                <div className="grid gap-2">
                  <Label className="text-sm">Margin (pt)</Label>
                  <Input
                    inputMode="numeric"
                    value={String(marginPt)}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setMarginPt(Number.isFinite(n) ? n : 24);
                    }}
                    placeholder="24"
                  />
                  <div className="text-muted-foreground text-xs">
                    Tip: 72pt = 1 inch.
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/10 p-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm">
                    Support WebP / others
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Converts unsupported formats to PNG locally.
                  </div>
                </div>
                <Button
                  type="button"
                  variant={allowRasterFallback ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setAllowRasterFallback((v) => !v)}
                  aria-pressed={allowRasterFallback}
                >
                  {allowRasterFallback ? "On" : "Off"}
                </Button>
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
                disabled={!canConvert}
                onClick={() => void onConvert()}
              >
                <Download className="size-4" aria-hidden />
                Convert & download PDF
              </Button>

              <div className="flex items-start gap-2 rounded-lg border bg-muted/10 p-3 text-muted-foreground text-xs">
                <ImageIcon className="mt-0.5 size-4" aria-hidden />
                <div className="min-w-0">
                  Everything runs locally in your browser. Your images are not
                  uploaded.
                </div>
              </div>
            </div>
          </aside>
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
              // biome-ignore lint/performance/noImgElement: object URL preview
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
