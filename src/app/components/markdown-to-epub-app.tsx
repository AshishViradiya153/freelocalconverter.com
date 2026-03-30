"use client";

import { Book, Download, FileText, Loader2, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/download-blob";
import { markdownToEpubBytes } from "@/lib/epub/markdown-to-epub";

function guessTitleFromMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const h1 = lines.find((l) => l.trim().startsWith("# "));
  if (h1) return h1.replace(/^#\s+/, "").trim();
  return "Untitled";
}

export function MarkdownToEpubApp() {
  const [title, setTitle] = React.useState("Untitled");
  const [author, setAuthor] = React.useState("");
  const [language, setLanguage] = React.useState("en");
  const [markdown, setMarkdown] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const [out, setOut] = React.useState<null | {
    filename: string;
    blob: Blob;
    bytes: number;
  }>(null);

  const onFiles = React.useCallback(async (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (!file) return;
    const nameOk = /\.(md|markdown|txt)$/i.test(file.name);
    if (!nameOk && file.type && !file.type.startsWith("text/")) {
      toast.error("Upload a Markdown file (.md) or paste Markdown text.");
      return;
    }

    const text = await file.text();
    setMarkdown(text);
    const nextTitle = guessTitleFromMarkdown(text);
    setTitle(nextTitle);
    toast.success(`Loaded: ${file.name}`);
  }, []);

  const onClear = React.useCallback(() => {
    setMarkdown("");
    setOut(null);
  }, []);

  const onBuild = React.useCallback(async () => {
    const md = markdown.trim();
    if (!md) {
      toast.error("Paste Markdown or upload a .md file.");
      return;
    }
    setBusy(true);
    setOut(null);
    try {
      const res = markdownToEpubBytes(md, {
        title: title.trim() || "Untitled",
        author: author.trim() || undefined,
        language: language.trim() || "en",
      });
      const blob = new Blob([new Uint8Array(res.epubBytes)], {
        type: "application/epub+zip",
      });
      setOut({ filename: res.filename, blob, bytes: blob.size });
      toast.success("ePub is ready.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not build ePub";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }, [author, language, markdown, title]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <Book className="size-5" aria-hidden />
          </div>
          <h1 className={toolHeroTitleClassName}>Markdown to ePub</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Turn Markdown into an EPUB ebook locally in your browser. No uploads
          to our servers.
        </p>
      </header>

      <div className="grid gap-4 rounded-xl border bg-background p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <Label className="text-sm">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm">Author</Label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm">Language</Label>
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="en"
            />
          </div>
        </div>

        <FileDropZone
          inputId="markdown-to-epub-input"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          multiple={false}
          disabled={busy}
          busy={busy}
          onFiles={onFiles}
          fileIcon={({ className, "aria-hidden": ariaHidden }) => (
            <FileText className={className} aria-hidden={ariaHidden} />
          )}
          dropTitle="Drop a Markdown file here or click to browse"
          dropHint="Local-only EPUB build"
          chooseLabel="Choose .md"
          fileHint="We convert on-device; nothing is uploaded."
          size="sm"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <section className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm">Markdown</Label>
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="size-4" aria-hidden />
              Clear
            </Button>
          </div>
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={18}
            placeholder={"# Title\n\nWrite your Markdown here…"}
            spellCheck={false}
          />
        </section>

        <aside className="rounded-xl border bg-background p-4">
          <div className="flex flex-col gap-4">
            <Button type="button" disabled={busy} onClick={() => void onBuild()}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Building…
                </>
              ) : (
                "Build EPUB"
              )}
            </Button>

            {out ? (
              <div className="grid gap-2 rounded-lg border bg-muted/10 p-3">
                <div className="truncate font-medium text-sm">{out.filename}</div>
                <div className="text-muted-foreground text-xs">
                  Size: {Math.round(out.bytes / 1024)} KB
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => downloadBlob(out.blob, out.filename)}
                >
                  <Download className="size-4" aria-hidden />
                  Download
                </Button>
              </div>
            ) : null}

            <div className="text-muted-foreground text-xs">
              This generates a minimal EPUB 3 with a single chapter. For complex
              books (multiple files, images, fonts), we can extend the packager.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

