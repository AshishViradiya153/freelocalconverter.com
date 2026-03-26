"use client";

import * as React from "react";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { zipSync } from "fflate";

import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { downloadBlob } from "@/lib/download-blob";
import { parsePdfPageSelection } from "@/lib/pdf/page-selection";

function acceptablePdf(file: File) {
  if (file.type === "application/pdf") return true;
  return /\.pdf$/i.test(file.name);
}

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.pdf$/i, "");
  return leaf || "document";
}

function sanitizeZipBaseName(name: string) {
  const s = name.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 80);
  return s || "document";
}

export function SplitPdfApp() {
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selection, setSelection] = React.useState("");

  const canSplit = Boolean(file) && !busy;

  function onPick(files: FileList | null) {
    if (!files?.length) return;
    const first = Array.from(files).find(acceptablePdf) ?? null;
    if (!first) {
      setError("No valid PDF found. Please choose a PDF file.");
      return;
    }
    setFile(first);
    setError(null);
  }

  function onClear() {
    setFile(null);
    setError(null);
    setSelection("");
    setBusy(false);
  }

  async function onSplit() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const base = baseNameFromFileName(file.name);

      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      if (bytes.byteLength === 0) throw new Error("empty_file");

      const src = await PDFDocument.load(bytes, { ignoreEncryption: false });
      if (src.isEncrypted) throw new Error("encrypted_pdf");
      const pageCount = src.getPageCount();
      if (pageCount === 0) throw new Error("no_pages");

      const ranges = selection.trim()
        ? parsePdfPageSelection(selection, pageCount).map((r) => [r.start, r.end] as [number, number])
        : Array.from({ length: pageCount }, (_, i) => [i + 1, i + 1] as [number, number]);
      if (selection.trim() && ranges.length === 0) {
        throw new Error("invalid_selection");
      }

      const outputs: Array<{ name: string; bytes: Uint8Array }> = [];
      for (let i = 0; i < ranges.length; i++) {
        const r = ranges[i]!;
        const out = await PDFDocument.create();
        const pageIndices = Array.from(
          { length: r[1] - r[0] + 1 },
          (_, k) => r[0] - 1 + k,
        );
        const pages = await out.copyPages(src, pageIndices);
        for (const p of pages) out.addPage(p);
        const outBytes = await out.save();
        outputs.push({
          name: `${String(i + 1).padStart(3, "0")}-pages-${r[0]}-${r[1]}.pdf`,
          bytes: new Uint8Array(outBytes),
        });
      }

      if (outputs.length === 1) {
        const blob = new Blob([outputs[0]!.bytes.slice().buffer], {
          type: "application/pdf",
        });
        const suffix = selection.trim() ? outputs[0]!.name.replace(/^\d+-/, "") : "page-1.pdf";
        downloadBlob(blob, `${base}-split-${suffix}`);
        toast.success("Downloaded split PDF");
        return;
      }

      const zipFiles: Record<string, Uint8Array> = {};
      for (const out of outputs) {
        zipFiles[out.name] = out.bytes;
      }
      const zipped = zipSync(zipFiles, { level: 6 });
      const zipBlob = new Blob([zipped.slice().buffer], { type: "application/zip" });
      downloadBlob(zipBlob, `${sanitizeZipBaseName(base)}-split.zip`);
      toast.success(`Downloaded ZIP with ${outputs.length} PDFs`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Split failed";
      if (msg === "empty_file") setError(`"${file.name}" is empty (0 bytes).`);
      else if (msg === "encrypted_pdf")
        setError(`"${file.name}" is password-protected. Please unlock it first, then try again.`);
      else if (msg === "no_pages") setError(`"${file.name}" has no pages to split.`);
      else if (msg === "invalid_selection")
        setError('Invalid page selection. Use formats like "1-3,5,7-9".');
      else setError(msg);
      toast.error("Split failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FileText className="size-8 text-muted-foreground" aria-hidden />
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">Split PDF</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Split one PDF into multiple PDFs locally in your browser — no uploads. Export each page as its own PDF, or
          choose ranges.
        </p>
      </header>

      <FileDropZone
        disabled={busy}
        busy={busy}
        inputId="split-pdf-input"
        accept="application/pdf,.pdf"
        multiple={false}
        onFiles={onPick}
        fileIcon={FileText}
        dropTitle={file ? "Drop a different PDF or click to replace" : "Drop a PDF here or click to browse"}
        dropHint="Split by page ranges · downloads locally · no uploads"
        chooseLabel={file ? "Replace PDF" : "Choose PDF"}
        fileHint="Your PDF stays on this device."
      />

      <section className="grid gap-3 rounded-xl border bg-background p-4">
        <div className="grid gap-2">
          <Label htmlFor="split-selection">Pages to export (optional)</Label>
          <Input
            id="split-selection"
            value={selection}
            disabled={!file || busy}
            onChange={(e) => setSelection(e.target.value)}
            placeholder='e.g. "1-3,5,7-9" (leave empty to split every page)'
          />
          <div className="text-muted-foreground text-xs">
            Tip: ranges are 1-based. Overlapping ranges are merged.
          </div>
        </div>

        <Separator />

        {busy ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm" role="status" aria-live="polite">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span>Splitting PDF…</span>
          </div>
        ) : null}

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClear} disabled={busy}>
            <Trash2 className="size-4" aria-hidden />
            Clear
          </Button>

          <Button type="button" variant="default" disabled={!canSplit} onClick={() => void onSplit()}>
            <Download className="size-4" aria-hidden />
            Split & download
          </Button>
        </div>
      </section>
    </div>
  );
}

