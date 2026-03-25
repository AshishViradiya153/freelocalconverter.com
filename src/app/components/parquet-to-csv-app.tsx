"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import {
  Copy,
  Download,
  Loader2,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { CsvSessionReadOnlyGrid } from "@/app/components/csv-session-read-only-grid";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { FileParquetGlyph } from "@/components/file-glyphs";
import {
  buildCsvExportString,
  downloadCsvExport,
  downloadXmlExport,
} from "@/lib/csv-export";
import {
  parseParquetFileToImportResult,
} from "@/lib/parquet-convert";
import { resultToSession, type CsvViewerSession } from "@/lib/csv-viewer-session";
import { PARQUET_READ_ROW_CAP } from "@/lib/parquet-convert";

function parquetLeafWithoutExtension(fileName: string): string {
  return fileName.replace(/\.(parquet)$/i, "");
}

export function ParquetToCsvApp() {
  const t = useTranslations("parquetToCsv");
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
        const { result, truncated } = await parseParquetFileToImportResult(file, {
          rowEnd: PARQUET_READ_ROW_CAP,
        });
        const next = resultToSession(file.name, result, "ltr");
        next.truncated = truncated;
        setSession(next);
        if (truncated) {
          toast.message(tl("largeFileTitle"), {
            description: tl("largeFileDescription", {
              shown: next.rows.length.toLocaleString(),
              total: next.rowCountBeforeCap.toLocaleString(),
            }),
          });
        }
      } catch (e) {
        fileRef.current = null;
        setSession(null);
        setLoadError(e instanceof Error ? e.message : tl("readError"));
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

  const csvOutput = React.useMemo(() => {
    if (!session) return "";
    return buildCsvExportString(
      session.rows,
      session.columnKeys,
      session.headerLabels,
    );
  }, [session]);

  const onCopyCsv = React.useCallback(() => {
    void navigator.clipboard.writeText(csvOutput).then(
      () => toast.success(t("copyCsvSuccess")),
      () => toast.error(t("copyCsvFailed")),
    );
  }, [csvOutput, t]);

  const onDownloadCsv = React.useCallback(() => {
    if (!session) return;
    const base = parquetLeafWithoutExtension(session.fileName);
    downloadCsvExport(
      session.rows,
      session.columnKeys,
      session.headerLabels,
      base,
    );
    toast.success(t("downloadStarted"));
  }, [session, t]);

  const onDownloadXml = React.useCallback(() => {
    if (!session) return;
    const base = parquetLeafWithoutExtension(session.fileName);
    downloadXmlExport(
      session.rows,
      session.columnKeys,
      session.headerLabels,
      base,
    );
    toast.success(t("downloadStarted"));
  }, [session, t]);

  return (
    <DirectionProvider dir="ltr">
      <div className="container flex flex-col gap-6 py-4">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FileParquetGlyph className="size-8 text-muted-foreground" aria-hidden />
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
            inputId="parquet-to-csv-file"
            accept=".parquet,application/octet-stream,application/x-parquet"
            onFiles={(files) => {
              const file = files?.[0];
              if (file) void onLoadFile(file);
            }}
            fileIcon={FileParquetGlyph}
            dropTitle={t("dropHint")}
            chooseLabel={t("chooseFile")}
            fileHint={t("fileHint", {
              maxRows: PARQUET_READ_ROW_CAP.toLocaleString(),
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCopyCsv}
                disabled={busy}
              >
                <Copy className="size-3.5" aria-hidden />
                {t("copyCsv")}
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onDownloadCsv}
                disabled={busy}
              >
                <Download className="size-3.5" aria-hidden />
                {t("downloadCsv")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDownloadXml}
                disabled={busy}
              >
                <Download className="size-3.5" aria-hidden />
                XML (.xml)
              </Button>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {t("csvPanel")}
                </p>
                <textarea
                  value={csvOutput}
                  readOnly
                  aria-label={t("csvAria")}
                  className="min-h-[280px] w-full rounded-md border bg-muted/20 p-3 font-mono text-xs leading-5 md:min-h-[360px]"
                />
                <p className="text-muted-foreground text-xs">{t("csvHint")}</p>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {t("previewPanel")}
                </p>
                <CsvSessionReadOnlyGrid
                  session={session}
                  onSessionChange={(next) => setSession(next)}
                  gridKey={`parquet-csv-preview-${session.rows.length}-${session.columnKeys.join(",")}`}
                />
                <p className="text-muted-foreground text-xs">{t("previewHint")}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

