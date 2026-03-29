"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Download, Loader2, Play, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { FileExcelGlyph } from "@/components/file-glyphs";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Label } from "@/components/ui/label";
import { downloadCsvExport, downloadXmlExport } from "@/lib/csv-export";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  type CsvViewerRow,
  type ParseStringMatrixHeaderOptions,
} from "@/lib/csv-import";
import { resultToSession } from "@/lib/csv-viewer-session";
import { parseExcelFile } from "@/lib/excel-import";
import { cn } from "@/lib/utils";
import { xlsExportCsvBaseName } from "@/lib/xls-to-csv-utils";

interface XlsToCsvBatchEntry {
  id: string;
  file: File;
  status: "pending" | "converting" | "ready" | "error";
  error?: string;
  /** 1-based row number. Empty means auto-detect. */
  headerRowInput: string;
  payload?: {
    rows: CsvViewerRow[];
    columnKeys: string[];
    headerLabels: string[];
    fileName: string;
  };
}

export function XlsToCsvBatchApp() {
  const tBatch = useTranslations("xlsToCsvBatch");
  const tXls = useTranslations("xlsToCsv");
  const tl = useTranslations("landing");

  const [batchEntries, setBatchEntries] = React.useState<XlsToCsvBatchEntry[]>(
    [],
  );
  const [batchBusy, setBatchBusy] = React.useState(false);

  const fileInputId = "xls-to-csv-batch-input";
  const downloadOneXmlLabel = React.useMemo(() => {
    const base = tBatch("downloadOne");
    const replaced = base.replace(/\.csv\b/i, ".xml");
    return replaced === base ? "Download .xml" : replaced;
  }, [tBatch]);

  const buildMatrixHeaderFromInput = React.useCallback(
    (headerRowInput: string): ParseStringMatrixHeaderOptions => {
      const parsedLine = Number.parseInt(headerRowInput.trim(), 10);
      if (Number.isFinite(parsedLine) && parsedLine >= 1) {
        return {
          hasHeaderRow: true,
          headerRowIndex: parsedLine - 1,
          autoDetectHeaderRow: false,
        };
      }
      return { autoDetectHeaderRow: true };
    },
    [],
  );

  const onBatchAddFiles = React.useCallback((files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setBatchEntries((prev) => {
      const next = list.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        status: "pending" as const,
        headerRowInput: "",
      }));
      return [...prev, ...next];
    });
  }, []);

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
      toast.message(tBatch("nothingToConvert"));
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
        const matrixHeader = buildMatrixHeaderFromInput(current.headerRowInput);
        const { result } = await parseExcelFile(current.file, {
          sheetIndex: 0,
          matrixHeader,
        });

        const convertedSession = resultToSession(
          xlsExportCsvBaseName(current.file.name),
          result,
          "ltr",
        );

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
        if (convertedSession.truncated) {
          toast.message(tl("largeFileTitle"), {
            description: tl("largeFileDescription", {
              shown: convertedSession.rows.length.toLocaleString(),
              total: convertedSession.rowCountBeforeCap.toLocaleString(),
            }),
          });
        }
      } catch (e) {
        const message =
          e instanceof CsvImportError
            ? e.message
            : e instanceof Error
              ? e.message
              : tl("readError");

        setBatchEntries((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, status: "error", error: message } : x,
          ),
        );
      }
    }

    setBatchBusy(false);
    toast.message(
      tBatch("convertedSummary", {
        done: converted,
        total: pendingIds.length,
      }),
    );
  }, [batchEntries, buildMatrixHeaderFromInput, tBatch, tl]);

  const onBatchDownloadOne = React.useCallback(
    (entryId: string) => {
      const entry = batchEntries.find((e) => e.id === entryId);
      if (!entry?.payload) return;
      downloadCsvExport(
        entry.payload.rows,
        entry.payload.columnKeys,
        entry.payload.headerLabels,
        entry.payload.fileName,
      );
      toast.success(tl("downloadStarted"));
    },
    [batchEntries, tl],
  );

  const onBatchDownloadOneXml = React.useCallback(
    (entryId: string) => {
      const entry = batchEntries.find((e) => e.id === entryId);
      if (!entry?.payload) return;
      downloadXmlExport(
        entry.payload.rows,
        entry.payload.columnKeys,
        entry.payload.headerLabels,
        entry.payload.fileName,
      );
      toast.success(tl("downloadStarted"));
    },
    [batchEntries, tl],
  );

  return (
    <DirectionProvider dir="ltr">
      <div className="container flex flex-col gap-6 py-4">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FileExcelGlyph
              className="size-8 text-muted-foreground"
              aria-hidden
            />
            <h1 className={toolHeroTitleClassName}>{tBatch("heroTitle")}</h1>
          </div>
          <p className="max-w-3xl text-muted-foreground text-sm">
            {tBatch("heroSubtitle", {
              mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
              maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
            })}
          </p>
        </header>

        <FileDropZone
          disabled={batchBusy}
          busy={batchBusy}
          fullWidth
          inputId={fileInputId}
          accept=".xlsx,.xls,.xlsm,.xlsb,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          multiple
          onFiles={onDropZonePick}
          fileIcon={FileExcelGlyph}
          size="md"
          badgeSize="lg"
          dropTitle={tBatch("dropzoneTitle")}
          dropHint={tBatch("dropzoneHint", {
            mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
            maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
          })}
          chooseLabel={tBatch("addFiles")}
        />

        <div className="flex flex-wrap items-center gap-2">
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
            {tBatch("convertAll")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={batchBusy || batchEntries.length === 0}
            onClick={onBatchClearAll}
          >
            <Trash2 className="size-3.5" aria-hidden />
            {tBatch("clearList")}
          </Button>

          <p className="text-muted-foreground text-xs">
            {tBatch("count", { count: batchEntries.length })}
          </p>
        </div>

        {batchEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{tBatch("empty")}</p>
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
                <p className="min-w-0 flex-1 truncate text-sm">
                  {entry.file.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {entry.status === "pending"
                    ? tBatch("statusPending")
                    : entry.status === "converting"
                      ? tBatch("statusConverting")
                      : entry.status === "ready"
                        ? tBatch("statusReady")
                        : tBatch("statusError")}
                </p>

                {entry.error ? (
                  <p className="w-full text-destructive text-xs">
                    {entry.error}
                  </p>
                ) : null}

                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`xls-batch-header-row-${entry.id}`}
                    className="text-muted-foreground"
                  >
                    {tXls("headerRowLabel")}
                  </Label>
                  <input
                    id={`xls-batch-header-row-${entry.id}`}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={entry.headerRowInput}
                    onChange={(e) => {
                      const next = e.target.value;
                      setBatchEntries((prev) =>
                        prev.map((x) =>
                          x.id === entry.id
                            ? {
                                ...x,
                                headerRowInput: next,
                                status:
                                  x.status === "converting"
                                    ? x.status
                                    : "pending",
                                error: undefined,
                                payload: undefined,
                              }
                            : x,
                        ),
                      );
                    }}
                    placeholder="Auto"
                    className="h-9 w-28 rounded-md border bg-background px-3 text-sm"
                    disabled={batchBusy || entry.status === "converting"}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={entry.status !== "ready" || batchBusy}
                  onClick={() => onBatchDownloadOne(entry.id)}
                >
                  <Download className="size-3.5" aria-hidden />
                  {tBatch("downloadOne")}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={entry.status !== "ready" || batchBusy}
                  onClick={() => onBatchDownloadOneXml(entry.id)}
                >
                  <Download className="size-3.5" aria-hidden />
                  {downloadOneXmlLabel}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={batchBusy}
                  onClick={() => onBatchRemoveEntry(entry.id)}
                >
                  {tBatch("remove")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DirectionProvider>
  );
}
