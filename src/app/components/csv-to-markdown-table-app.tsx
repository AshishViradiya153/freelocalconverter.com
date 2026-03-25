"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Copy, Loader2, Upload, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { CsvSessionReadOnlyGrid } from "@/app/components/csv-session-read-only-grid";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { FileSpreadsheetGlyph } from "@/components/file-glyphs";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  parseCsvFile,
} from "@/lib/csv-import";
import { csvSessionToMarkdownTable } from "@/lib/csv-to-markdown";
import { sanitizeCsvDownloadFileBaseName } from "@/lib/csv-export";
import { type CsvViewerSession, resultToSession } from "@/lib/csv-viewer-session";

function downloadTextFile(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function CsvToMarkdownTableApp() {
  const t = useTranslations("csvToMarkdownTable");
  const tl = useTranslations("landing");
  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const fileRef = React.useRef<File | null>(null);

  const onLoadFile = React.useCallback(
    async (file: File) => {
      setBusy(true);
      setLoadError(null);
      try {
        fileRef.current = file;
        const result = await parseCsvFile(file);
        const next = resultToSession(file.name, result, "ltr");
        setSession(next);
        if (result.truncated) {
          toast.message(tl("largeFileTitle"), {
            description: tl("largeFileDescription", {
              shown: result.rows.length.toLocaleString(),
              total: result.rowCountBeforeCap.toLocaleString(),
            }),
          });
        }
      } catch (e) {
        fileRef.current = null;
        setSession(null);
        if (e instanceof CsvImportError) setLoadError(e.message);
        else setLoadError(tl("readError"));
      } finally {
        setBusy(false);
      }
    },
    [tl],
  );

  const onClear = React.useCallback(() => {
    fileRef.current = null;
    setSession(null);
    setLoadError(null);
  }, []);

  const markdown = React.useMemo(() => {
    if (!session) return "";
    return csvSessionToMarkdownTable(session);
  }, [session]);

  const onCopy = React.useCallback(() => {
    void navigator.clipboard.writeText(markdown).then(
      () => toast.success(t("copySuccess")),
      () => toast.error(t("copyFailed")),
    );
  }, [markdown, t]);

  const onDownload = React.useCallback(() => {
    if (!session) return;
    const base = sanitizeCsvDownloadFileBaseName(session.fileName);
    downloadTextFile(markdown, `${base}.md`);
    toast.success(t("downloadStarted"));
  }, [markdown, session, t]);

  const previewKey = React.useMemo(() => {
    if (!session) return "";
    return `csv-markdown-${session.rows.length}-${session.columnKeys.join(",")}`;
  }, [session]);

  return (
    <DirectionProvider dir="ltr">
      <div className="container flex flex-col gap-6 py-4">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheetGlyph
              className="size-8 text-muted-foreground"
              aria-hidden
            />
            <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
              {t("heroTitle")}
            </h1>
          </div>
          <p className="max-w-3xl text-muted-foreground text-sm">{t("heroSubtitle")}</p>
        </header>

        {!session ? (
          <FileDropZone
            disabled={false}
            busy={busy}
            inputId="csv-to-markdown-table-file"
            accept=".csv,text/csv"
            onFiles={(files) => {
              const file = files?.[0];
              if (file) void onLoadFile(file);
            }}
            fileIcon={FileSpreadsheetGlyph}
            dropTitle={t("dropHint")}
            chooseLabel={t("chooseFile")}
            fileHint={t("fileHint", {
              mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
              maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
            })}
          />
        ) : null}

        {busy && !session ? (
          <div
            className="flex items-center gap-2 text-muted-foreground text-sm"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {tl("loadingSheet")}
          </div>
        ) : null}

        {loadError ? (
          <p className="text-destructive text-sm" role="alert">
            {loadError}
          </p>
        ) : null}

        {session ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClear}>
                {t("clearFile")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onCopy}>
                <Copy className="size-3.5" aria-hidden />
                {t("copyMarkdown")}
              </Button>
              <Button type="button" variant="default" size="sm" onClick={onDownload}>
                {t("downloadMarkdown")}
              </Button>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {t("markdownPanel")}
                </p>
                <textarea
                  value={markdown}
                  readOnly
                  aria-label={t("markdownAria")}
                  className="min-h-[280px] w-full rounded-md border bg-muted/20 p-3 font-mono text-xs leading-5 md:min-h-[360px]"
                />
                <p className="text-muted-foreground text-xs">{t("markdownHint")}</p>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {t("previewPanel")}
                </p>
                <CsvSessionReadOnlyGrid
                  session={session}
                  onSessionChange={(next) => setSession(next)}
                  gridKey={previewKey}
                />
                <p className="text-muted-foreground text-xs">{t("previewHint")}</p>
              </div>
            </div>
          </div>
        ) : null}

        {session ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={onClear}
            className="self-start"
          >
            <Trash2 className="size-3.5" aria-hidden />
            {t("clearFile")}
          </Button>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

