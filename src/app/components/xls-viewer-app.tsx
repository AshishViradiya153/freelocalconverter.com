"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { CsvGridPanel } from "@/app/components/csv-viewer-app";
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
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  type ParseStringMatrixHeaderOptions,
} from "@/lib/csv-import";
import { parseExcelFile } from "@/lib/excel-import";
import { resultToSession, type CsvViewerSession } from "@/lib/csv-viewer-session";
import { cn } from "@/lib/utils";

interface FileDropCardProps {
  disabled: boolean;
  busy: boolean;
  onFile: (file: File) => void;
  inputId: string;
}

function FileDropCard({ disabled, busy, onFile, inputId }: FileDropCardProps) {
  const t = useTranslations("xlsToCsv");
  const onPick = React.useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <button
        type="button"
        disabled={disabled || busy}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files);
        }}
        onClick={() => document.getElementById(inputId)?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors",
          "border-border bg-muted/15 hover:bg-muted/30",
          (disabled || busy) && "pointer-events-none opacity-60",
        )}
      >
        <FileSpreadsheet className="size-10 text-muted-foreground" />
        <p className="text-center text-muted-foreground text-sm">{t("dropHint")}</p>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 font-medium text-xs shadow-sm">
          <Upload className="size-3.5" />
          {t("chooseFile")}
        </span>
      </button>
      <input
        id={inputId}
        type="file"
        accept=".xlsx,.xls,.xlsm,.xlsb,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="sr-only"
        onChange={(e) => onPick(e.target.files)}
      />
      <p className="text-muted-foreground text-xs">{t("fileHint")}</p>
    </div>
  );
}

const MAX_HEADER_ROW_PICK = 100;

export function XlsViewerApp() {
  const t = useTranslations("xlsToCsv");
  const tl = useTranslations("landing");

  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const [sheetNames, setSheetNames] = React.useState<string[]>([]);
  const [sheetIndex, setSheetIndex] = React.useState(0);
  const [sheetRowCount, setSheetRowCount] = React.useState(0);

  const [hasHeaderRow, setHasHeaderRow] = React.useState(true);
  const [headerRowLine, setHeaderRowLine] = React.useState(1); // 1-based for UI.

  const [loadGeneration, setLoadGeneration] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const fileRef = React.useRef<File | null>(null);

  const patchSession = React.useCallback(
    (fn: (s: CsvViewerSession) => CsvViewerSession) => {
      setSession((prev) => (prev ? fn(prev) : prev));
    },
    [],
  );

  const reloadParsed = React.useCallback(
    async (file: File, index: number) => {
      const { session: nextSession, sheetNames: names, sheetIndex: resolvedIndex, sheetRowCount: rows } =
        await parseXlsToCsvSession(file, {
          sheetIndex: index,
          hasHeaderRow,
          headerRowLine,
        });

      setSession(nextSession);
      setLoadGeneration((g) => g + 1);
      setSheetNames(names);
      setSheetIndex(resolvedIndex);
      setSheetRowCount(rows);
      setLoadError(null);

      if (nextSession.truncated) {
        toast.message(tl("largeFileTitle"), {
          description: tl("largeFileDescription", {
            shown: nextSession.rows.length.toLocaleString(),
            total: nextSession.rowCountBeforeCap.toLocaleString(),
          }),
        });
      }
    },
    [headerRowLine, hasHeaderRow, tl],
  );

  const onLoadFile = React.useCallback(
    async (file: File) => {
      setBusy(true);
      setLoadError(null);
      try {
        fileRef.current = file;
        await reloadParsed(file, 0);
      } catch (e) {
        fileRef.current = null;
        setSession(null);
        setSheetNames([]);
        setSheetRowCount(0);
        if (e instanceof CsvImportError) setLoadError(e.message);
        else setLoadError(tl("readError"));
      } finally {
        setBusy(false);
      }
    },
    [reloadParsed, tl],
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
        await reloadParsed(file, nextIndex);
      } catch (e) {
        if (e instanceof CsvImportError) setLoadError(e.message);
        else setLoadError(tl("readError"));
      } finally {
        setBusy(false);
      }
    },
    [reloadParsed, tl],
  );

  const onToggleHeaderRow = React.useCallback(
    (pressed: boolean) => {
      setHasHeaderRow(pressed);
      const file = fileRef.current;
      if (!file) return;
      setBusy(true);
      setLoadError(null);
      void parseXlsToCsvSession(file, {
        sheetIndex,
        hasHeaderRow: pressed,
        headerRowLine,
      })
        .then(({ session: nextSession, sheetNames: names, sheetIndex: resolvedIndex, sheetRowCount: rows }) => {
          setSession(nextSession);
          setLoadGeneration((g) => g + 1);
          setSheetNames(names);
          setSheetIndex(resolvedIndex);
          setSheetRowCount(rows);
          setLoadError(null);
          if (nextSession.truncated) {
            toast.message(tl("largeFileTitle"), {
              description: tl("largeFileDescription", {
                shown: nextSession.rows.length.toLocaleString(),
                total: nextSession.rowCountBeforeCap.toLocaleString(),
              }),
            });
          }
        })
        .catch((e) => {
          if (e instanceof CsvImportError) setLoadError(e.message);
          else setLoadError(tl("readError"));
        })
        .finally(() => setBusy(false));
    },
    [headerRowLine, sheetIndex, tl],
  );

  const onHeaderRowLineChange = React.useCallback(
    (value: string) => {
      const next = Number.parseInt(value, 10);
      if (Number.isNaN(next)) return;
      setHeaderRowLine(next);
      const file = fileRef.current;
      if (!file) return;
      setBusy(true);
      setLoadError(null);
      void parseXlsToCsvSession(file, {
        sheetIndex,
        hasHeaderRow,
        headerRowLine: next,
      })
        .then(({ session: nextSession, sheetNames: names, sheetIndex: resolvedIndex, sheetRowCount: rows }) => {
          setSession(nextSession);
          setLoadGeneration((g) => g + 1);
          setSheetNames(names);
          setSheetIndex(resolvedIndex);
          setSheetRowCount(rows);
          setLoadError(null);
          if (nextSession.truncated) {
            toast.message(tl("largeFileTitle"), {
              description: tl("largeFileDescription", {
                shown: nextSession.rows.length.toLocaleString(),
                total: nextSession.rowCountBeforeCap.toLocaleString(),
              }),
            });
          }
        })
        .catch((e) => {
          if (e instanceof CsvImportError) setLoadError(e.message);
          else setLoadError(tl("readError"));
        })
        .finally(() => setBusy(false));
    },
    [hasHeaderRow, sheetIndex, tl],
  );

  const onClear = React.useCallback(() => {
    fileRef.current = null;
    setSession(null);
    setSheetNames([]);
    setSheetIndex(0);
    setSheetRowCount(0);
    setHasHeaderRow(true);
    setHeaderRowLine(1);
    setLoadError(null);
  }, []);

  const headerRowPickMax = Math.min(
    MAX_HEADER_ROW_PICK,
    Math.max(1, sheetRowCount),
  );

  return (
    <DirectionProvider dir="ltr">
      <div className="container flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className="font-semibold text-5xl tracking-tight">{t("heroTitle")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("heroSubtitle", {
                mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
                maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
              })}
            </p>
          </header>

          {!session ? (
            <FileDropCard
              disabled={false}
              busy={busy}
              onFile={(f) => void onLoadFile(f)}
              inputId="xls-viewer-file"
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClear}
                >
                  {t("clearFile")}
                </Button>
                {sheetNames.length > 1 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      {t("sheetLabel")}
                    </span>
                    <Select
                      value={String(sheetIndex)}
                      onValueChange={(v) => void onSheetSelect(v)}
                      disabled={busy}
                    >
                      <SelectTrigger
                        className="w-[min(100%,240px)]"
                        aria-label={t("sheetLabel")}
                      >
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
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={hasHeaderRow}
                  onPressedChange={onToggleHeaderRow}
                  disabled={busy}
                  aria-label={t("headerToggleAria")}
                  className="bg-background dark:bg-input/30 dark:hover:bg-input/50"
                >
                  {t("headerToggleLabel")}
                </Toggle>

                {hasHeaderRow && sheetRowCount > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Label
                      htmlFor="xls-viewer-header-row"
                      className="text-muted-foreground"
                    >
                      {t("headerRowLabel")}
                    </Label>
                    <Select
                      value={String(Math.min(headerRowLine, headerRowPickMax))}
                      onValueChange={onHeaderRowLineChange}
                      disabled={busy}
                    >
                      <SelectTrigger
                        id="xls-viewer-header-row"
                        className="w-[min(100%,200px)]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: headerRowPickMax },
                          (_, i) => i + 1,
                        ).map((line) => (
                          <SelectItem key={line} value={String(line)}>
                            {t("headerRowOption", { line })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {busy ? (
            <div
              className="flex items-center gap-2 text-muted-foreground text-sm"
              role="status"
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
            <CsvGridPanel
              key={loadGeneration}
              session={session}
              patchSession={patchSession}
              onClear={onClear}
            />
          ) : null}
        </div>
      </div>
    </DirectionProvider>
  );
}
