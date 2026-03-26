"use client";

import * as React from "react";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Packer, Paragraph, TextRun, Document, PageBreak, HeadingLevel } from "docx";

import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Separator } from "@/components/ui/separator";
import { downloadBlob } from "@/lib/download-blob";
import { getPdfJs } from "@/lib/pdf/pdfjs";

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.pdf$/i, "");
  return leaf || "document";
}

function normalizeText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

async function extractPdfTextByPage(file: File) {
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const lines: string[] = [];
    for (const item of content.items) {
      // pdfjs typing is intentionally broad here.
      const str = (item as { str?: string }).str ?? "";
      const t = normalizeText(str);
      if (t) lines.push(t);
    }

    pages.push(lines.join("\n"));
  }

  return pages;
}

async function buildDocxFromPages(args: { title: string; pages: string[] }) {
  const docChildren: Paragraph[] = [];

  docChildren.push(
    new Paragraph({
      text: args.title,
      heading: HeadingLevel.HEADING_1,
    }),
  );

  for (let i = 0; i < args.pages.length; i += 1) {
    const pageText = args.pages[i] ?? "";

    if (i > 0) {
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Page ${i + 1}`, bold: true }),
          ],
        }),
      );
    } else {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Page 1", bold: true }),
          ],
        }),
      );
    }

    const blocks = pageText.split(/\n{2,}/g).map((b) => b.trim()).filter(Boolean);
    if (blocks.length === 0) {
      docChildren.push(new Paragraph({ text: "" }));
      continue;
    }

    for (const block of blocks) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const paraText = lines.join(" ");
      docChildren.push(new Paragraph({ children: [new TextRun(paraText)] }));
    }
  }

  const doc = new Document({
    sections: [{ children: docChildren }],
  });

  const bytes = await Packer.toBuffer(doc);
  return new Uint8Array(bytes);
}

export function PdfToWordApp() {
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canConvert = Boolean(file) && !busy;

  async function onConvert() {
    if (!file) return;
    setBusy(true);
    setError(null);

    try {
      const pages = await extractPdfTextByPage(file);
      const baseName = baseNameFromFileName(file.name);
      const docxBytes = await buildDocxFromPages({ title: baseName, pages });

      const blob = new Blob([docxBytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      downloadBlob(blob, `${baseName}.docx`);
      toast.success("Downloaded DOCX");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Conversion failed";
      setError(msg);
      toast.error("Conversion failed");
    } finally {
      setBusy(false);
    }
  }

  function onClear() {
    setFile(null);
    setError(null);
    setBusy(false);
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FileText className="size-8 text-muted-foreground" aria-hidden />
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">PDF to Word</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Convert a PDF into a Word document (DOCX) locally in your browser. Best for text-based PDFs.
          Scanned PDFs need OCR.
        </p>
      </header>

      <FileDropZone
        disabled={false}
        busy={busy}
        inputId="pdf-to-word-input"
        accept="application/pdf,.pdf"
        multiple={false}
        onFiles={(files) => {
          const f = files?.[0] ?? null;
          if (!f) return;
          if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
            setError("Please choose a PDF file.");
            return;
          }
          setError(null);
          setFile(f);
        }}
        fileIcon={FileText}
        dropTitle={file ? "Drop another PDF or click to replace" : "Drop a PDF here or click to browse"}
        dropHint="DOCX download · local-only conversion"
        chooseLabel={file ? "Replace PDF" : "Choose PDF"}
        fileHint="Your file stays on this device."
      />

      {busy ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm" role="status" aria-live="polite">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>Converting…</span>
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {file ? (
        <div className="rounded-xl border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium text-sm">{file.name}</div>
              <div className="text-muted-foreground text-xs">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClear} disabled={busy}>
                <Trash2 className="size-4" aria-hidden />
                Clear
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" disabled={!canConvert} onClick={() => void onConvert()}>
              <Download className="size-4" aria-hidden />
              Convert & download DOCX
            </Button>
          </div>

          <div className="mt-4 rounded-lg border bg-muted/10 p-3 text-muted-foreground text-xs">
            Notes: This exports text content only (basic paragraphs). Complex layouts, forms, and scanned PDFs
            may not convert faithfully.
          </div>
        </div>
      ) : null}
    </div>
  );
}

