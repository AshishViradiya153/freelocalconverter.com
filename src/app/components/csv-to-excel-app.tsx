"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Download, Loader2, Play, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadXlsxExport } from "@/lib/csv-export";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  type CsvViewerRow,
  parseCsvFile,
} from "@/lib/csv-import";
import { resultToSession } from "@/lib/csv-viewer-session";
import { cn } from "@/lib/utils";
import { FileSpreadsheetGlyph } from "@/components/file-glyphs";
import { FileDropZone } from "@/components/ui/file-drop-zone";

interface CsvToXlsxBatchEntry {
  id: string;
  file: File;
  status: "pending" | "converting" | "ready" | "error";
  error?: string;
  payload?: {
    rows: CsvViewerRow[];
    columnKeys: string[];
    headerLabels: string[];
    fileName: string;
  };
}

export function CsvToExcelApp() {
  const t = useTranslations("csvToExcel");
  const tl = useTranslations("landing");
  const [batchEntries, setBatchEntries] = React.useState<CsvToXlsxBatchEntry[]>(
    [],
  );
  const [batchBusy, setBatchBusy] = React.useState(false);

  const onBatchAddFiles = React.useCallback(
    (files: FileList | null) => {
      const list = files ? Array.from(files) : [];
      if (list.length === 0) return;
      setBatchEntries((prev) => {
        const next = list.map((file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
          status: "pending" as const,
        }));
        return [...prev, ...next];
      });
    },
    [],
  );

  const onDropZonePick = React.useCallback(
    (files: FileList | null) => {
      onBatchAddFiles(files);
    },
    [onBatchAddFiles],
  );

  const onBatchRemoveEntry = React.useCallback((id: string) => {
    setBatchEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const onBatchClearAll = React.useCallback(() => {
    setBatchEntries([]);
  }, []);

  const onBatchConvertAll = React.useCallback(async () => {
    const pendingIds = batchEntries
      .filter((e) => e.status === "pending" || e.status === "error")
      .map((e) => e.id);
    if (pendingIds.length === 0) {
      toast.message(t("nothingToConvert"));
      return;
    }

    setBatchBusy(true);
    let converted = 0;
    for (const id of pendingIds) {
      const current = batchEntries.find((e) => e.id === id);
      if (!current) continue;

      setBatchEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, status: "converting", error: undefined } : e,
        ),
      );

      try {
        const result = await parseCsvFile(current.file);
        const convertedSession = resultToSession(current.file.name, result, "ltr");
        setBatchEntries((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: "ready",
                  payload: {
                    rows: convertedSession.rows,
                    columnKeys: convertedSession.columnKeys,
                    headerLabels: convertedSession.headerLabels,
                    fileName: convertedSession.fileName,
                  },
                }
              : e,
          ),
        );
        converted += 1;
        if (result.truncated) {
          toast.message(tl("largeFileTitle"), {
            description: tl("largeFileDescription", {
              shown: result.rows.length.toLocaleString(),
              total: result.rowCountBeforeCap.toLocaleString(),
            }),
          });
        }
      } catch (e) {
        const message = e instanceof CsvImportError ? e.message : tl("readError");
        setBatchEntries((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, status: "error", error: message } : x,
          ),
        );
      }
    }

    setBatchBusy(false);
    toast.message(
      t("convertedSummary", {
        done: converted,
        total: pendingIds.length,
      }),
    );
  }, [batchEntries, t, tl]);

  const onBatchDownloadOne = React.useCallback(
    async (entryId: string) => {
      const entry = batchEntries.find((e) => e.id === entryId);
      if (!entry?.payload) return;
      try {
        await downloadXlsxExport(
          entry.payload.rows,
          entry.payload.columnKeys,
          entry.payload.headerLabels,
          entry.payload.fileName,
        );
        toast.success(tl("downloadStarted"));
      } catch {
        toast.error(tl("excelError"));
      }
    },
    [batchEntries, tl],
  );

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
          <p className="max-w-3xl text-muted-foreground text-sm">
            {t("heroSubtitle", {
              mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
              maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
            })}
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <FileDropZone
            disabled={batchBusy}
            busy={batchBusy}
            fullWidth
            wrapperClassName="w-full"
            inputId="csv-to-xlsx-batch-input"
            accept=".csv,text/csv"
            multiple
            onFiles={onDropZonePick}
            fileIcon={FileSpreadsheetGlyph}
            dropTitle={t("dropzoneTitle")}
            dropHint={t("dropzoneHint", {
              mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
              maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
            })}
            chooseLabel={t("addFiles")}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={batchBusy}
            onClick={() => document.getElementById("csv-to-xlsx-batch-input")?.click()}
          >
            <Upload className="size-3.5" aria-hidden />
            {t("addFiles")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={batchBusy || batchEntries.length === 0}
            onClick={() => void onBatchConvertAll()}
          >
            {batchBusy ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Play className="size-3.5" aria-hidden />
            )}
            {t("convertAll")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={batchBusy || batchEntries.length === 0}
            onClick={onBatchClearAll}
          >
            <Trash2 className="size-3.5" aria-hidden />
            {t("clearList")}
          </Button>
          <p className="text-muted-foreground text-xs">
            {t("count", {
              count: batchEntries.length,
            })}
          </p>
        </div>

        {batchEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {batchEntries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/10 px-3 py-2",
                  entry.status === "error" && "border-destructive/40",
                )}
              >
                <p className="min-w-0 flex-1 truncate text-sm">{entry.file.name}</p>
                <p className="text-muted-foreground text-xs">
                  {entry.status === "pending"
                    ? t("statusPending")
                    : entry.status === "converting"
                      ? t("statusConverting")
                      : entry.status === "ready"
                        ? t("statusReady")
                        : t("statusError")}
                </p>
                {entry.error ? (
                  <p className="w-full text-destructive text-xs">{entry.error}</p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={entry.status !== "ready" || batchBusy}
                  onClick={() => void onBatchDownloadOne(entry.id)}
                >
                  <Download className="size-3.5" aria-hidden />
                  {t("downloadOne")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={batchBusy}
                  onClick={() => onBatchRemoveEntry(entry.id)}
                >
                  {t("remove")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DirectionProvider>
  );
}

