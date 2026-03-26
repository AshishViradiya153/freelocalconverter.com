"use client";

import * as React from "react";
import { Download, FileText, GripVertical, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Separator } from "@/components/ui/separator";
import { downloadBlob } from "@/lib/download-blob";
import { cn } from "@/lib/utils";

interface QueuedPdf {
  id: string;
  file: File;
}

function moveItem<T>(arr: T[], from: number, to: number) {
  if (from === to) return arr;
  if (from < 0 || from >= arr.length) return arr;
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

function acceptablePdf(file: File) {
  if (file.type === "application/pdf") return true;
  return /\.pdf$/i.test(file.name);
}

function baseNameFromFirstFileName(name: string) {
  const leaf = name.replace(/\.pdf$/i, "");
  return leaf || "merged";
}

async function mergePdfs(files: File[]) {
  const { PDFDocument } = await import("pdf-lib");

  const out = await PDFDocument.create();

  for (const file of files) {
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      if (bytes.byteLength === 0) {
        throw new Error("empty_file");
      }

      // Prefer failing fast on encrypted PDFs so we can show a clear message.
      const src = await PDFDocument.load(bytes, { ignoreEncryption: false });
      if (src.isEncrypted) {
        throw new Error("encrypted_pdf");
      }

      const pageIndices = src.getPageIndices();
      if (pageIndices.length === 0) {
        throw new Error("no_pages");
      }

      const pages = await out.copyPages(src, pageIndices);
      for (const p of pages) out.addPage(p);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg === "empty_file") {
        throw new Error(`"${file.name}" is empty (0 bytes).`);
      }
      if (msg === "encrypted_pdf") {
        throw new Error(`"${file.name}" is password-protected. Please unlock it first, then try again.`);
      }
      if (msg === "no_pages") {
        throw new Error(`"${file.name}" has no pages to merge.`);
      }
      throw new Error(
        `Could not read "${file.name}". The PDF may be corrupted, not a real PDF, or unsupported by this tool.`,
      );
    }
  }

  return await out.save();
}

export function MergePdfApp() {
  const [items, setItems] = React.useState<QueuedPdf[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canMerge = items.length >= 2 && !busy;
  const baseName = React.useMemo(() => {
    if (items.length === 0) return "merged";
    return baseNameFromFirstFileName(items[0]!.file.name);
  }, [items]);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const next: QueuedPdf[] = [];
    for (const f of Array.from(files)) {
      if (!acceptablePdf(f)) continue;
      next.push({ id: crypto.randomUUID(), file: f });
    }

    if (next.length === 0) {
      setError("No valid PDFs found. Please choose PDF files.");
      return;
    }

    setItems((prev) => prev.concat(next));
  }

  function onClear() {
    setItems([]);
    setError(null);
    setBusy(false);
  }

  async function onMerge() {
    if (!canMerge) return;
    setBusy(true);
    setError(null);

    try {
      const bytes = await mergePdfs(items.map((it) => it.file));
      const safeBytes = new Uint8Array(bytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      downloadBlob(blob, `${baseName}-merged.pdf`);
      toast.success(`Downloaded merged PDF (${items.length} file(s))`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Merge failed";
      setError(msg);
      toast.error("Merge failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FileText className="size-8 text-muted-foreground" aria-hidden />
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">Merge PDF</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Add multiple PDFs, reorder them, and download one merged PDF locally in your browser — no uploads.
        </p>
      </header>

      <FileDropZone
        disabled={false}
        busy={busy}
        inputId="merge-pdf-input"
        accept="application/pdf,.pdf"
        multiple
        onFiles={(files) => addFiles(files)}
        fileIcon={FileText}
        dropTitle="Drop PDFs here or click to browse"
        dropHint="Reorder files · single PDF download · local-only merge"
        chooseLabel="Choose PDFs"
        chooseLabelWhenFileSelected="Add more PDFs"
        fileHint="Your PDFs stay on this device."
      />

      {busy ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm" role="status" aria-live="polite">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>Merging PDFs…</span>
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
                <div className="font-medium">Files</div>
                <div className="text-muted-foreground text-xs">
                  Drag is optional, use up/down for precise ordering.
                </div>
              </div>
              <div className="text-muted-foreground text-sm">{items.length} PDF(s)</div>
            </div>

            <ul className="divide-y overflow-hidden rounded-xl border bg-background">
              {items.map((it, idx) => (
                <li key={it.id} className="flex items-center gap-3 p-3">
                  <div className="grid size-10 place-items-center rounded-lg border bg-muted/10">
                    <span className="text-muted-foreground text-xs font-semibold">
                      {idx + 1}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm">{it.file.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {(it.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>

                  <GripVertical className="size-4 text-muted-foreground" aria-hidden />

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || idx === 0}
                      onClick={() => setItems((prev) => moveItem(prev, idx, idx - 1))}
                    >
                      Up
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || idx === items.length - 1}
                      onClick={() => setItems((prev) => moveItem(prev, idx, idx + 1))}
                    >
                      Down
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                      className={cn("text-destructive hover:text-destructive")}
                      aria-label={`Remove ${it.file.name}`}
                      title="Remove"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="rounded-xl border bg-background p-4">
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-medium">Export</div>
                <div className="text-muted-foreground text-xs">
                  The merged PDF preserves pages in the order shown.
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClear} disabled={busy}>
                  <Trash2 className="size-4" aria-hidden />
                  Clear
                </Button>
              </div>

              <Button type="button" variant="default" disabled={!canMerge} onClick={() => void onMerge()}>
                <Download className="size-4" aria-hidden />
                Merge & download PDF
              </Button>

              <div className="flex items-start gap-2 rounded-lg border bg-muted/10 p-3 text-xs text-muted-foreground">
                <FileText className="mt-0.5 size-4" aria-hidden />
                <div className="min-w-0">
                  Everything runs locally in your browser. Your PDFs are not uploaded.
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

