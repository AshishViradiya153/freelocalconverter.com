"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { CsvGridPanel } from "@/app/components/csv-viewer-app";
import { FileParquetGlyph } from "@/components/file-glyphs";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import {
  clearCsvViewerSession,
  loadCsvViewerSession,
  saveCsvViewerSession,
} from "@/lib/csv-viewer-idb";
import {
  type CsvViewerSession,
  resultToSession,
} from "@/lib/csv-viewer-session";
import {
  getInMemoryCsvViewerSession,
  setInMemoryCsvViewerSession,
} from "@/lib/csv-viewer-session-memory";
import {
  PARQUET_READ_ROW_CAP,
  parquetCsvSessionToBuffer,
  parseParquetFileToImportResult,
} from "@/lib/parquet-convert";
import { downloadParquetExport } from "@/lib/parquet-export";

const PERSIST_DEBOUNCE_MS = 500;

function parquetLeafWithoutExtension(fileName: string): string {
  return fileName.replace(/\.(parquet)$/i, "");
}

export function ParquetViewerApp() {
  const t = useTranslations("parquetViewer");
  const tl = useTranslations("landing");

  const [hydrated, setHydrated] = React.useState(false);
  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const sessionRef = React.useRef<CsvViewerSession | null>(null);
  const [loadGeneration, setLoadGeneration] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const patchSession = React.useCallback(
    (fn: (s: CsvViewerSession) => CsvViewerSession) => {
      setSession((prev) => {
        const next = prev ? fn(prev) : prev;
        sessionRef.current = next;
        setInMemoryCsvViewerSession(next);
        return next;
      });
    },
    [],
  );

  React.useEffect(() => {
    let cancelled = false;
    const inMemory = getInMemoryCsvViewerSession();
    if (inMemory) {
      sessionRef.current = inMemory;
      setSession(inMemory);
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    void loadCsvViewerSession().then((restored) => {
      if (cancelled) return;
      if (restored) {
        sessionRef.current = restored;
        setInMemoryCsvViewerSession(restored);
        setSession(restored);
      }
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!hydrated || !session) return;
    const id = window.setTimeout(() => {
      void saveCsvViewerSession(session);
    }, PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [hydrated, session]);

  // If the user switches locale, this component unmounts/remounts.
  // Flush the latest snapshot so language switching has no “state reset” side-effect.
  React.useEffect(() => {
    return () => {
      const s = sessionRef.current;
      if (!s) return;
      void saveCsvViewerSession(s);
    };
  }, []);

  const onPickFiles = React.useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      setBusy(true);
      setError(null);

      try {
        const { result, truncated } = await parseParquetFileToImportResult(
          file,
          {
            rowEnd: PARQUET_READ_ROW_CAP,
          },
        );

        const next = resultToSession(file.name, result, "ltr");
        next.truncated = truncated;

        sessionRef.current = next;
        setInMemoryCsvViewerSession(next);
        setSession(next);
        setLoadGeneration((g) => g + 1);
      } catch (e) {
        sessionRef.current = null;
        setSession(null);
        setError(e instanceof Error ? e.message : tl("readError"));
      } finally {
        setBusy(false);
      }
    },
    [tl],
  );

  const onClear = React.useCallback(async () => {
    await clearCsvViewerSession();
    sessionRef.current = null;
    setInMemoryCsvViewerSession(null);
    setSession(null);
    setError(null);
  }, []);

  const onDownloadParquet = React.useCallback(async () => {
    if (!session) return;
    setExporting(true);
    try {
      const buffer = await parquetCsvSessionToBuffer(session);
      const base = parquetLeafWithoutExtension(session.fileName) || "export";
      downloadParquetExport(buffer, base);
      toast.success(t("downloadStarted"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tl("readError"));
    } finally {
      setExporting(false);
    }
  }, [session, tl, t]);

  return (
    <DirectionProvider dir="ltr">
      <div className="container flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className={toolHeroTitleClassName}>{t("heroTitle")}</h1>
            <p className="text-muted-foreground text-sm">{t("heroSubtitle")}</p>
          </header>

          {!hydrated ? (
            <div
              className="flex items-center gap-2 text-muted-foreground text-sm"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {tl("loadingSheet")}
            </div>
          ) : !session ? (
            <div className="flex flex-col gap-4">
              <FileDropZone
                disabled={false}
                busy={busy}
                size="lg"
                badgeSize="lg"
                inputId="parquet-viewer-file"
                accept=".parquet,application/octet-stream,application/x-parquet"
                onFiles={(files) => {
                  void onPickFiles(files);
                }}
                fileIcon={FileParquetGlyph}
                dropTitle={t("dropHint")}
                chooseLabel={t("chooseFile")}
                fileHint={t("fileHint", {
                  maxRows: PARQUET_READ_ROW_CAP.toLocaleString(),
                })}
                ariaLabel={t("chooseFile")}
              />

              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void onDownloadParquet()}
                  disabled={busy || exporting}
                >
                  {exporting ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Download className="size-3.5" aria-hidden />
                  )}
                  {t("downloadParquet")}
                </Button>
              </div>

              <CsvGridPanel
                key={loadGeneration}
                session={session}
                patchSession={patchSession}
                onClear={onClear}
              />

              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </DirectionProvider>
  );
}
