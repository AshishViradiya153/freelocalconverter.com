"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Loader2 } from "lucide-react";
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
import {
  clearCsvViewerSession,
  loadCsvViewerSession,
  saveCsvViewerSession,
} from "@/lib/csv-viewer-idb";
import {
  getInMemoryXlsViewerState,
  setInMemoryXlsViewerState,
} from "@/lib/xls-viewer-memory";
import { resultToSession, type CsvViewerSession } from "@/lib/csv-viewer-session";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { FileExcelGlyph } from "@/components/file-glyphs";

const PERSIST_DEBOUNCE_MS = 500;

function exportCsvBaseName(excelName: string): string {
  const leaf = excelName.replace(/\.(xlsx|xlsm|xlsb|xls)$/i, "");
  return leaf ? `${leaf}.csv` : "export.csv";
}

export function XlsViewerApp() {
  const t = useTranslations("xlsToCsv");
  const tl = useTranslations("landing");

  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const sessionRef = React.useRef<CsvViewerSession | null>(null);
  const [sheetNames, setSheetNames] = React.useState<string[]>([]);
  const [sheetIndex, setSheetIndex] = React.useState(0);
  const [headerRowInput, setHeaderRowInput] = React.useState("");
  const [hydrated, setHydrated] = React.useState(false);

  const [loadGeneration, setLoadGeneration] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const fileRef = React.useRef<File | null>(null);

  const patchSession = React.useCallback(
    (fn: (s: CsvViewerSession) => CsvViewerSession) => {
      setSession((prev) => {
        const next = prev ? fn(prev) : prev;
        sessionRef.current = next;
        const current = getInMemoryXlsViewerState();
        if (current) {
          setInMemoryXlsViewerState({ ...current, session: next });
        }
        return next;
      });
    },
    [],
  );

  React.useEffect(() => {
    let cancelled = false;
    const xlsInMemory = getInMemoryXlsViewerState();
    if (xlsInMemory?.session) {
      fileRef.current = xlsInMemory.file;
      sessionRef.current = xlsInMemory.session;
      setSession(xlsInMemory.session);
      setSheetNames(xlsInMemory.sheetNames);
      setSheetIndex(xlsInMemory.sheetIndex);
      setHeaderRowInput(xlsInMemory.headerRowInput);
      setLoadError(null);
      setLoadGeneration((g) => g + 1);
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    void loadCsvViewerSession().then((restored) => {
      if (cancelled) return;
      if (restored) {
        fileRef.current = null;
        sessionRef.current = restored;
        setSession(restored);
        setSheetNames([]);
        setSheetIndex(0);
        setHeaderRowInput("");
        setInMemoryXlsViewerState({
          file: null,
          session: restored,
          sheetNames: [],
          sheetIndex: 0,
          headerRowInput: "",
        });
        setLoadError(null);
        setLoadGeneration((g) => g + 1);
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

  const reloadParsed = React.useCallback(
    async (file: File, index: number, headerLineInput: string) => {
      const parsedLine = Number.parseInt(headerLineInput.trim(), 10);
      const matrixHeader: ParseStringMatrixHeaderOptions =
        Number.isFinite(parsedLine) && parsedLine >= 1
          ? {
            hasHeaderRow: true,
            headerRowIndex: parsedLine - 1,
            autoDetectHeaderRow: false,
          }
          : { autoDetectHeaderRow: true };

      const { result, sheetNames: names, sheetIndex: resolvedIndex } =
        await parseExcelFile(file, { sheetIndex: index, matrixHeader });

      const csvName = exportCsvBaseName(file.name);
      const nextSession = resultToSession(csvName, result, "ltr");

      sessionRef.current = nextSession;
      setInMemoryXlsViewerState({
        file,
        session: nextSession,
        sheetNames: names,
        sheetIndex: resolvedIndex,
        headerRowInput: headerLineInput,
      });
      setSession(nextSession);
      setLoadGeneration((g) => g + 1);
      setSheetNames(names);
      setSheetIndex(resolvedIndex);
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
        if (e instanceof CsvImportError) setLoadError(e.message);
        else setLoadError(tl("readError"));
      } finally {
        setBusy(false);
      }
    },
    [reloadParsed, tl, headerRowInput],
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
        if (e instanceof CsvImportError) setLoadError(e.message);
        else setLoadError(tl("readError"));
      } finally {
        setBusy(false);
      }
    },
    [reloadParsed, tl, headerRowInput],
  );

  const onApplyHeaderRow = React.useCallback(() => {
    const file = fileRef.current;
    if (!file) return;
    setBusy(true);
    setLoadError(null);
    void reloadParsed(file, sheetIndex, headerRowInput)
      .catch((e) => {
        if (e instanceof CsvImportError) setLoadError(e.message);
        else setLoadError(tl("readError"));
      })
      .finally(() => setBusy(false));
  }, [headerRowInput, reloadParsed, sheetIndex, tl]);

  const onClear = React.useCallback(async () => {
    fileRef.current = null;
    sessionRef.current = null;
    setInMemoryXlsViewerState(null);
    setSession(null);
    setSheetNames([]);
    setSheetIndex(0);
    setHeaderRowInput("");
    setLoadError(null);

    await clearCsvViewerSession();
  }, []);

  const canEditXlsMeta = fileRef.current !== null;

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
            !hydrated ? (
              <div
                className="flex items-center gap-2 text-muted-foreground text-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tl("loadingSheet")}
              </div>
            ) : (
                <FileDropZone
                  disabled={false}
                  busy={busy}
                  inputId="xls-viewer-file"
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
              )
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
                  {canEditXlsMeta && sheetNames.length > 1 ? (
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

                {canEditXlsMeta ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Label
                      htmlFor="xls-viewer-header-row-number"
                      className="text-muted-foreground"
                    >
                      {t("headerRowLabel")}
                    </Label>
                    <input
                      id="xls-viewer-header-row-number"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={headerRowInput}
                      onChange={(e) => setHeaderRowInput(e.target.value)}
                      placeholder="Auto"
                      className="h-9 w-28 rounded-md border bg-background px-3 text-sm"
                      disabled={busy}
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
                ) : null}
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
