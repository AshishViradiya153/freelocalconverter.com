"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Download, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { CsvSessionReadOnlyGrid } from "@/app/components/csv-session-read-only-grid";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  jsonRecordsToImportResult,
} from "@/lib/csv-import";
import { type CsvViewerSession, resultToSession } from "@/lib/csv-viewer-session";
import { parquetCsvSessionToBuffer } from "@/lib/parquet-convert";
import { downloadParquetExport } from "@/lib/parquet-export";
import type { Direction } from "@/types/data-grid";
import { FileJsonGlyph } from "@/components/file-glyphs";

export function JsonToParquetApp() {
  const t = useTranslations("jsonToParquet");
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

        const text = await file.text();
        const textBytes = new TextEncoder().encode(text).byteLength;
        if (textBytes > CSV_IMPORT_MAX_FILE_BYTES) {
          throw new CsvImportError(
            "file_too_large",
            `File is too large (max ${Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024))} MB).`,
          );
        }

        const parsed = JSON.parse(text) as unknown;
        const result = jsonRecordsToImportResult(parsed);
        const next = resultToSession(file.name, result, "ltr" as Direction);
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
        else if (e instanceof SyntaxError) setLoadError(t("jsonInvalid"));
        else setLoadError(tl("readError"));
      } finally {
        setBusy(false);
      }
    },
    [tl, t],
  );

  const onClear = React.useCallback(() => {
    fileRef.current = null;
    setSession(null);
    setLoadError(null);
  }, []);

  const previewKey = React.useMemo(() => {
    if (!session) return "";
    return `json-to-parquet-${session.rows.length}-${session.columnKeys.join(",")}`;
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
            <FileJsonGlyph
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
            inputId="json-to-parquet-file"
            accept=".json,application/json,text/json,text/plain"
            onFiles={(files) => {
              const file = files?.[0];
              if (file) void onLoadFile(file);
            }}
            fileIcon={FileJsonGlyph}
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
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {t("previewPanel")}
              </p>
              <CsvSessionReadOnlyGrid
                session={session}
                onSessionChange={(next) => setSession(next)}
                gridKey={previewKey}
              />
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

