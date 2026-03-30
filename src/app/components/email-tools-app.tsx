"use client";

import DOMPurify from "isomorphic-dompurify";
import { FileUp, Mail, Download, RotateCcw } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import * as React from "react";
import { toast } from "sonner";
import { toJpeg, toPng } from "html-to-image";
import PostalMime from "postal-mime";
import MsgReader from "@kenjiuno/msgreader";

import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
  ToolSectionHeading,
  ToolToolbar,
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type EmailToolsMode =
  | "msg-viewer"
  | "total-mail-converter"
  | "email-to-pdf"
  | "email-to-html"
  | "email-to-jpeg"
  | "email-to-text";

interface ParsedEmail {
  fileName: string;
  fileType: "msg" | "eml" | "unknown";
  subject?: string;
  date?: string;
  from?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  html?: string;
  text?: string;
  headers?: string;
}

function inferFileType(name: string): ParsedEmail["fileType"] {
  const n = name.toLowerCase();
  if (n.endsWith(".msg")) return "msg";
  if (n.endsWith(".eml")) return "eml";
  return "unknown";
}

function stripToText(rawHtml: string): string {
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");
  return (doc.body?.textContent ?? "").replace(/\r/g, "").trim();
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function addressesToLine(
  input:
    | undefined
    | string
    | { name?: string; address?: string }
    | Array<{ name?: string; address?: string }>,
): string | undefined {
  if (!input) return undefined;
  if (typeof input === "string") return input.trim() || undefined;
  const list = Array.isArray(input) ? input : [input];
  const out = list
    .map((a) => {
      const name = a.name?.trim();
      const addr = a.address?.trim();
      if (name && addr) return `${name} <${addr}>`;
      return (addr ?? name ?? "").trim();
    })
    .filter(Boolean);
  return out.length ? out.join(", ") : undefined;
}

async function parseMsg(file: File): Promise<ParsedEmail> {
  const ab = await file.arrayBuffer();
  const reader = new MsgReader(ab);
  const data = reader.getFileData();
  const anyData = data as unknown as Record<string, unknown>;
  const html = typeof data.body === "string" ? data.body : undefined;
  const text = typeof data.body === "string" ? stripToText(data.body) : undefined;

  return {
    fileName: file.name,
    fileType: "msg",
    subject: data.subject ?? undefined,
    date: data.messageDeliveryTime
      ? new Date(data.messageDeliveryTime).toISOString()
      : undefined,
    from: data.senderEmail ?? data.senderName ?? undefined,
    to: typeof anyData.displayTo === "string" ? anyData.displayTo : undefined,
    cc: typeof anyData.displayCc === "string" ? anyData.displayCc : undefined,
    bcc:
      typeof anyData.displayBcc === "string" ? anyData.displayBcc : undefined,
    html,
    text,
  };
}

async function parseEml(file: File): Promise<ParsedEmail> {
  const ab = await file.arrayBuffer();
  const parser = new PostalMime();
  const parsed = await parser.parse(ab);

  const html = typeof parsed.html === "string" ? parsed.html : undefined;
  const text =
    typeof parsed.text === "string"
      ? parsed.text.trim()
      : html
        ? stripToText(html)
        : undefined;

  return {
    fileName: file.name,
    fileType: "eml",
    subject: parsed.subject?.trim() || undefined,
    date: parsed.date ? new Date(parsed.date).toISOString() : undefined,
    from: addressesToLine(parsed.from),
    to: addressesToLine(parsed.to),
    cc: addressesToLine(parsed.cc),
    bcc: addressesToLine(parsed.bcc),
    html,
    text,
    headers:
      parsed.headers && typeof parsed.headers === "object"
        ? Array.from(parsed.headers.entries())
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join("\n")
        : undefined,
  };
}

function modeTitle(mode: EmailToolsMode): string {
  switch (mode) {
    case "msg-viewer":
      return "Online MSG Viewer";
    case "total-mail-converter":
      return "Total Mail Converter";
    case "email-to-pdf":
      return "Convert Email to PDF Free";
    case "email-to-html":
      return "Convert Email to HTML Free";
    case "email-to-jpeg":
      return "Convert Email to JPEG Free";
    case "email-to-text":
      return "Convert Email to Text Free";
  }
}

function modeDefaultOutputs(mode: EmailToolsMode): {
  pdf: boolean;
  html: boolean;
  jpeg: boolean;
  text: boolean;
} {
  if (mode === "msg-viewer" || mode === "total-mail-converter") {
    return { pdf: true, html: true, jpeg: true, text: true };
  }
  return {
    pdf: mode === "email-to-pdf",
    html: mode === "email-to-html",
    jpeg: mode === "email-to-jpeg",
    text: mode === "email-to-text",
  };
}

export function EmailToolsApp({ mode }: { mode: EmailToolsMode }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const previewRef = React.useRef<HTMLDivElement | null>(null);

  const [isReading, setIsReading] = React.useState(false);
  const [email, setEmail] = React.useState<ParsedEmail | null>(null);

  const { pdf: showPdf, html: showHtml, jpeg: showJpeg, text: showText } =
    React.useMemo(() => modeDefaultOutputs(mode), [mode]);

  const safeHtml = React.useMemo(() => {
    const raw = email?.html?.trim();
    if (!raw) return "";
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
    });
  }, [email?.html]);

  const plainText = React.useMemo(() => {
    const t = email?.text?.trim();
    if (t) return t;
    if (safeHtml) return stripToText(safeHtml);
    return "";
  }, [email?.text, safeHtml]);

  const onPickFile = React.useCallback(async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const ft = inferFileType(file.name);
    if (ft === "unknown") {
      toast.error("Upload a .msg (Outlook) or .eml file.");
      return;
    }

    setIsReading(true);
    try {
      const parsed = ft === "msg" ? await parseMsg(file) : await parseEml(file);
      setEmail(parsed);
      toast.success(`Loaded ${file.name}`);
    } catch (err) {
      console.error({ err });
      toast.error("Could not parse this email file.");
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  const onClear = React.useCallback(() => {
    setEmail(null);
    toast.message("Cleared");
  }, []);

  const onDownloadHtml = React.useCallback(() => {
    if (!safeHtml) {
      toast.error("No HTML body found in this email.");
      return;
    }
    downloadBlob(
      new Blob([safeHtml], { type: "text/html;charset=utf-8" }),
      `${email?.fileName ?? "email"}.html`.replace(/\.msg\.html$|\.eml\.html$/i, ".html"),
    );
  }, [email?.fileName, safeHtml]);

  const onDownloadText = React.useCallback(() => {
    if (!plainText.trim()) {
      toast.error("No text body found in this email.");
      return;
    }
    downloadBlob(
      new Blob([plainText], { type: "text/plain;charset=utf-8" }),
      `${email?.fileName ?? "email"}.txt`.replace(/\.msg\.txt$|\.eml\.txt$/i, ".txt"),
    );
  }, [email?.fileName, plainText]);

  const onDownloadJpeg = React.useCallback(async () => {
    const node = previewRef.current;
    if (!node) return;
    if (!safeHtml) {
      toast.error("No HTML body to render.");
      return;
    }
    try {
      const dataUrl = await toJpeg(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      downloadBlob(
        blob,
        `${email?.fileName ?? "email"}.jpeg`.replace(
          /\.msg\.jpeg$|\.eml\.jpeg$/i,
          ".jpeg",
        ),
      );
      toast.success("Downloaded JPEG");
    } catch (err) {
      console.error({ err });
      toast.error("Could not render JPEG.");
    }
  }, [email?.fileName, safeHtml]);

  const onDownloadPdf = React.useCallback(async () => {
    const node = previewRef.current;
    if (!node) return;
    if (!safeHtml) {
      toast.error("No HTML body to render.");
      return;
    }
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const bytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
      const pdf = await PDFDocument.create();
      const img = await pdf.embedPng(bytes);
      const page = pdf.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      const out = await pdf.save();
      downloadBlob(
        new Blob([new Uint8Array(out)], { type: "application/pdf" }),
        `${email?.fileName ?? "email"}.pdf`.replace(/\.msg\.pdf$|\.eml\.pdf$/i, ".pdf"),
      );
      toast.success("Downloaded PDF");
    } catch (err) {
      console.error({ err });
      toast.error("Could not generate PDF.");
    }
  }, [email?.fileName, safeHtml]);

  const heroDescription =
    mode === "msg-viewer"
      ? "Open Outlook .msg files locally in your browser and preview the email safely. Nothing is uploaded."
      : "Convert .msg and .eml emails locally in your browser. Export as PDF, HTML, JPEG, or plain text—nothing is uploaded.";

  return (
    <ToolPage>
      <ToolHero
        icon={<Mail className="size-8 md:size-9" aria-hidden />}
        title={modeTitle(mode)}
        description={heroDescription}
      />

      <ToolCard>
        <ToolToolbar className="flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <ToolPaneTitle>File</ToolPaneTitle>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Upload a <span className="font-medium text-foreground">.msg</span>{" "}
              (Outlook) or <span className="font-medium text-foreground">.eml</span>{" "}
              file. Processing happens in your browser.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isReading}
              >
                <FileUp className="size-4" aria-hidden />
                {isReading ? "Reading…" : "Choose email file"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClear}
                disabled={!email || isReading}
              >
                <RotateCcw className="size-4" aria-hidden />
                Clear
              </Button>
              {email ? (
                <span className="wrap-break-word text-muted-foreground text-xs">
                  {email.fileName}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {showPdf ? (
              <Button
                type="button"
                size="sm"
                onClick={() => void onDownloadPdf()}
                disabled={!email || isReading}
              >
                <Download className="size-4" aria-hidden />
                PDF
              </Button>
            ) : null}
            {showHtml ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onDownloadHtml}
                disabled={!email || isReading}
              >
                <Download className="size-4" aria-hidden />
                HTML
              </Button>
            ) : null}
            {showJpeg ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void onDownloadJpeg()}
                disabled={!email || isReading}
              >
                <Download className="size-4" aria-hidden />
                JPEG
              </Button>
            ) : null}
            {showText ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onDownloadText}
                disabled={!email || isReading}
              >
                <Download className="size-4" aria-hidden />
                Text
              </Button>
            ) : null}
          </div>
        </ToolToolbar>

        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          accept=".msg,.eml,message/rfc822,application/vnd.ms-outlook"
          onChange={(e) => void onPickFile(e.target.files)}
        />

        <Separator className="my-6" />

        <ToolSectionHeading>Preview</ToolSectionHeading>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
          HTML is sanitized before rendering. For PDFs and images, we render the
          sanitized preview and export it.
        </p>

        <div
          className={cn(
            "mt-4 overflow-hidden rounded-xl border border-border/80 bg-background",
          )}
        >
          <div className="border-border border-b bg-muted/20 px-4 py-3">
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <span className="text-muted-foreground">Subject</span>
                <div className="wrap-break-word font-medium">
                  {email?.subject ?? "—"}
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">Date</span>
                <div className="wrap-break-word font-medium">
                  {email?.date ? new Date(email.date).toLocaleString() : "—"}
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">From</span>
                <div className="wrap-break-word font-medium">
                  {email?.from ?? "—"}
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">To</span>
                <div className="wrap-break-word font-medium">
                  {email?.to ?? "—"}
                </div>
              </div>
              {email?.cc ? (
                <div className="min-w-0">
                  <span className="text-muted-foreground">CC</span>
                  <div className="wrap-break-word font-medium">{email.cc}</div>
                </div>
              ) : null}
              {email?.bcc ? (
                <div className="min-w-0">
                  <span className="text-muted-foreground">BCC</span>
                  <div className="wrap-break-word font-medium">{email.bcc}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div
            ref={previewRef}
            className="prose prose-sm max-w-none bg-white p-5 text-black sm:p-6"
          >
            {email ? (
              safeHtml ? (
                // biome-ignore lint/security/noDangerouslySetInnerHtml: DOMPurify sanitize runs on the HTML input.
                <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
              ) : plainText ? (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {plainText}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No body content found.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a file to preview its contents.
              </p>
            )}
          </div>
        </div>
      </ToolCard>

      <ToolPane>
        <ToolPaneTitle>Tips</ToolPaneTitle>
        <ul className="list-inside list-disc text-muted-foreground text-sm leading-relaxed">
          <li>
            For best fidelity, export from{" "}
            <strong className="text-foreground">HTML</strong> bodies (common in
            marketing emails).
          </li>
          <li>
            PDFs are generated by rendering the preview to an image and embedding
            it into a PDF (fast, offline, and consistent across platforms).
          </li>
          <li>
            If your email contains remote images, they may not load (privacy and
            CORS). Prefer emails with embedded images or inline assets.
          </li>
        </ul>
      </ToolPane>
    </ToolPage>
  );
}

