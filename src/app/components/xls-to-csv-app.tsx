"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Copy, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { CsvSessionReadOnlyGrid } from "@/app/components/csv-session-read-only-grid";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildCsvExportString,
  downloadCsvExport,
  downloadXmlExport,
} from "@/lib/csv-export";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  type ParseStringMatrixHeaderOptions,
} from "@/lib/csv-import";
import { parseExcelFile } from "@/lib/excel-import";
import { type CsvViewerSession, resultToSession } from "@/lib/csv-viewer-session";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { FileExcelGlyph } from "@/components/file-glyphs";

function exportCsvBaseName(excelName: string): string {
  const leaf = excelName.replace(/\.(xlsx|xlsm|xlsb|xls)$/i, "");
  return leaf ? `${leaf}.csv` : "export.csv";
}

export function XlsToCsvApp() {
  const t = useTranslations("xlsToCsv");
  const tl = useTranslations("landing");
  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const [sheetNames, setSheetNames] = React.useState<string[]>([]);
  const [sheetIndex, setSheetIndex] = React.useState(0);
  const [headerRowInput, setHeaderRowInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const fileRef = React.useRef<File | null>(null);

  const reloadParsed = React.useCallback(
    async (file: File, index: number, headerLineInput: string) => {
      const parsedLine = Number.parseInt(headerLineInput.trim(), 10);
      const matrixHeader: ParseStringMatrixHeaderOptions =
        Number.isFinite(parsedLine) && parsedLine >= 1
          ? { hasHeaderRow: true, headerRowIndex: parsedLine - 1, autoDetectHeaderRow: false }
          : { autoDetectHeaderRow: true };
      const { result, sheetNames: names, sheetIndex: resolvedIndex } =
        await parseExcelFile(file, { sheetIndex: index, matrixHeader });
      const csvName = exportCsvBaseName(file.name);
      setSession(resultToSession(csvName, result, "ltr"));
      setSheetNames(names);
      setSheetIndex(resolvedIndex);
      setLoadError(null);
      if (result.truncated) {
        toast.message(tl("largeFileTitle"), {
          description: tl("largeFileDescription", {
            shown: result.rows.length.toLocaleString(),
            total: result.rowCountBeforeCap.toLocaleString(),
          }),
        });
      }
    },
    [tl],
  );

  const onLoadFile = React.useCallback(
    async (file: File) => {
      setBusy(true);
      setLoadError(null);
      try {
        fileRef.current = file;
        await reloadParsed(file, 0, headerRowInput);
      } catch (e) {
        fileRef.current = null;
        setSession(null);
        setSheetNames([]);
        if (e instanceof CsvImportError) {
          setLoadError(e.message);
        } else {
          setLoadError(tl("readError"));
        }
      } finally {
        setBusy(false);
      }
    },
    [headerRowInput, reloadParsed, tl],
  );

  const onSheetSelect = React.useCallback(
    async (value: string) => {
      const file = fileRef.current;
      if (!file) return;
      const nextIndex = Number.parseInt(value, 10);
      if (Number.isNaN(nextIndex)) return;
      setBusy(true);
      setLoadError(null);
      try {
        await reloadParsed(file, nextIndex, headerRowInput);
      } catch (e) {
        if (e instanceof CsvImportError) {
          setLoadError(e.message);
        } else {
          setLoadError(tl("readError"));
        }
      } finally {
        setBusy(false);
      }
    },
    [headerRowInput, reloadParsed, tl],
  );

  const onApplyHeaderRow = React.useCallback(() => {
    const file = fileRef.current;
    if (!file) return;
    setBusy(true);
    setLoadError(null);
    void reloadParsed(file, sheetIndex, headerRowInput)
      .catch((e) => {
        if (e instanceof CsvImportError) {
          setLoadError(e.message);
        } else {
          setLoadError(tl("readError"));
        }
      })
      .finally(() => {
        setBusy(false);
      });
  }, [headerRowInput, reloadParsed, sheetIndex, tl]);

  const onCopyCsv = React.useCallback(() => {
    if (!session) return;
    const csv = buildCsvExportString(
      session.rows,
      session.columnKeys,
      session.headerLabels,
    );
    void navigator.clipboard.writeText(csv).then(
      () => toast.success(t("copyCsvSuccess")),
      () => toast.error(t("copyCsvFailed")),
    );
  }, [session, t]);

  const onDownloadCsv = React.useCallback(() => {
    if (!session) return;
    downloadCsvExport(
      session.rows,
      session.columnKeys,
      session.headerLabels,
      session.fileName,
    );
    toast.success(tl("downloadStarted"));
  }, [session, tl]);

  const onDownloadXml = React.useCallback(() => {
    if (!session) return;
    downloadXmlExport(
      session.rows,
      session.columnKeys,
      session.headerLabels,
      session.fileName,
    );
    toast.success(tl("downloadStarted"));
  }, [session, tl]);

  const downloadXmlLabel = React.useMemo(() => {
    const base = t("downloadCsv");
    const replaced = base.replace(/\.csv\b/i, ".xml");
    return replaced === base ? "Download .xml" : replaced;
  }, [t]);

  const onClear = React.useCallback(() => {
    fileRef.current = null;
    setSession(null);
    setSheetNames([]);
    setSheetIndex(0);
    setHeaderRowInput("");
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

  return (
    <DirectionProvider dir="ltr">
      <div className="container flex flex-col gap-6 py-4">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FileExcelGlyph className="size-8 text-muted-foreground" aria-hidden />
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

        {!session ? (
          <FileDropZone
            disabled={false}
            busy={busy}
            inputId="xls-to-csv-file"
            accept=".xlsx,.xls,.xlsm,.xlsb,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onFiles={(files) => {
              const file = files?.[0];
              if (file) void onLoadFile(file);
            }}
            fileIcon={FileExcelGlyph}
            dropTitle={t("dropHint")}
            chooseLabel={t("chooseFile")}
            fileHint={t("fileHint")}
          />
        ) : null}

        {busy ? (
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
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={onClear}>
                {t("clearFile")}
              </Button>
              {sheetNames.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-sm">{t("sheetLabel")}</span>
                  <Select
                    value={String(sheetIndex)}
                    onValueChange={(v) => void onSheetSelect(v)}
                    disabled={busy}
                  >
                    <SelectTrigger className="w-[min(100%,240px)]" aria-label={t("sheetLabel")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetNames.map((name, i) => (
                        <SelectItem key={`${name}-${i}`} value={String(i)}>
                          {name.trim() !== ""
                            ? name
                            : t("unnamedSheet", { index: i + 1 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="xls-header-row-number" className="text-muted-foreground">
                  {t("headerRowLabel")}
                </Label>
                <input
                  id="xls-header-row-number"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={headerRowInput}
                  onChange={(e) => setHeaderRowInput(e.target.value)}
                  placeholder="Auto"
                  className="h-9 w-28 rounded-md border bg-background px-3 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={onApplyHeaderRow}
                >
                  Apply
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {t("csvPanel")}
                </p>
                <div role="toolbar" className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCopyCsv}
                    disabled={!session || busy}
                  >
                    <Copy className="size-3.5" aria-hidden />
                    {t("copyCsv")}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={onDownloadCsv}
                    disabled={!session || busy}
                  >
                    {t("downloadCsv")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDownloadXml}
                    disabled={!session || busy}
                  >
                    {downloadXmlLabel}
                  </Button>
                </div>
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
                  gridKey={`xls-csv-${sheetIndex}-${session.rows.length}-${session.columnKeys.join(",")}`}
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
