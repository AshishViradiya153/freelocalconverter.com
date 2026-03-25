"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Loader2, Upload, Download } from "lucide-react";
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
import { type CsvViewerSession, resultToSession } from "@/lib/csv-viewer-session";
import {
  PARQUET_READ_ROW_CAP,
  parquetCsvSessionToBuffer,
} from "@/lib/parquet-convert";
import { downloadParquetExport } from "@/lib/parquet-export";

export function CsvToParquetApp() {
  const t = useTranslations("csvToParquet");
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

  const csvOutputPreviewKey = React.useMemo(() => {
    if (!session) return "";
    return `csv-to-parquet-${session.rows.length}-${session.columnKeys.join(",")}`;
  }, [session]);

  const onDownloadParquet = React.useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setLoadError(null);
    try {
      const buffer = await parquetCsvSessionToBuffer(session);
      downloadParquetExport(buffer, session.fileName);
      toast.success(t("downloadStarted"));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : tl("readError"));
    } finally {
      setBusy(false);
    }
  }, [session, tl, t]);

  return (
    <DirectionProvider dir="ltr">
      <div className="container flex flex-col gap-6 py-4">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheetGlyph className="size-8 text-muted-foreground" aria-hidden />
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
            inputId="csv-to-parquet-file"
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
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={busy}
                onClick={() => void onDownloadParquet()}
              >
                <Download className="size-3.5" aria-hidden />
                {t("downloadParquet")}
              </Button>
              <p className="text-muted-foreground text-xs">
                {t("previewHint", {
                  cap: PARQUET_READ_ROW_CAP.toLocaleString(),
                })}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {t("previewPanel")}
              </p>
              <CsvSessionReadOnlyGrid
                session={session}
                onSessionChange={(next) => setSession(next)}
                gridKey={csvOutputPreviewKey}
              />
            </div>
          </div>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

