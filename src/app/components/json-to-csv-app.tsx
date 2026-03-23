"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import {
  Braces,
  Copy,
  FileJson,
  Loader2,
  Upload,
  Wand2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { CsvSessionReadOnlyGrid } from "@/app/components/csv-session-read-only-grid";
import { Button } from "@/components/ui/button";
import {
  buildLabelKeyedExportRows,
  buildCsvExportString,
  downloadCsvExport,
} from "@/lib/csv-export";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  jsonRecordsToImportResult,
} from "@/lib/csv-import";
import { type CsvViewerSession, resultToSession } from "@/lib/csv-viewer-session";
import { cn } from "@/lib/utils";
import type { Direction } from "@/types/data-grid";

function sessionToPrettyJson(session: CsvViewerSession): string {
  const rows = buildLabelKeyedExportRows(
    session.rows,
    session.columnKeys,
    session.headerLabels,
  );
  return `${JSON.stringify(rows, null, 2)}\n`;
}

interface FileDropCardProps {
  disabled: boolean;
  busy: boolean;
  fileName: string | null;
  onFile: (file: File) => void;
  inputId: string;
}

function FileDropCard({
  disabled,
  busy,
  fileName,
  onFile,
  inputId,
}: FileDropCardProps) {
  const t = useTranslations("jsonToCsv");
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
        <FileJson className="size-10 text-muted-foreground" />
        <p className="text-center text-muted-foreground text-sm">
          {fileName ? (
            <span className="font-medium text-foreground">{fileName}</span>
          ) : (
            t("dropHint")
          )}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 font-medium text-xs shadow-sm">
          <Upload className="size-3.5" />
          {t("chooseFile")}
        </span>
      </button>
      <input
        id={inputId}
        type="file"
        accept=".json,application/json,text/json,text/plain"
        className="sr-only"
        onChange={(e) => onPick(e.target.files)}
      />
      <p className="text-muted-foreground text-xs">{t("fileHint")}</p>
    </div>
  );
}

export function JsonToCsvApp() {
  const t = useTranslations("jsonToCsv");
  const tl = useTranslations("landing");
  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const [jsonText, setJsonText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [jsonError, setJsonError] = React.useState<string | null>(null);

  const replaceJsonFromExternal = React.useCallback((text: string) => {
    setJsonText(text);
  }, []);

  const onLoadJsonText = React.useCallback(
    async (text: string, fileName: string) => {
      setBusy(true);
      setLoadError(null);
      setJsonError(null);
      try {
        const textBytes = new TextEncoder().encode(text).byteLength;
        if (textBytes > CSV_IMPORT_MAX_FILE_BYTES) {
          throw new CsvImportError(
            "file_too_large",
            `File is too large (max ${Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024))} MB).`,
          );
        }
        const parsed = JSON.parse(text) as unknown;
        const result = jsonRecordsToImportResult(parsed);
        const next = resultToSession(fileName, result, "ltr" as Direction);
        setSession(next);
        replaceJsonFromExternal(sessionToPrettyJson(next));
        if (result.truncated) {
          toast.message(tl("largeFileTitle"), {
            description: tl("largeFileDescription", {
              shown: result.rows.length.toLocaleString(),
              total: result.rowCountBeforeCap.toLocaleString(),
            }),
          });
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          setLoadError(t("jsonInvalid"));
        } else if (e instanceof CsvImportError) {
          setLoadError(e.message);
        } else {
          setLoadError(tl("readError"));
        }
        setSession(null);
        setJsonText("");
      } finally {
        setBusy(false);
      }
    },
    [replaceJsonFromExternal, tl],
  );

  const onLoadFile = React.useCallback(
    async (file: File) => {
      const text = await file.text();
      await onLoadJsonText(text, file.name);
    },
    [onLoadJsonText],
  );

  const onApplyJson = React.useCallback(() => {
    setJsonError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText) as unknown;
    } catch {
      setJsonError(t("jsonInvalid"));
      return;
    }
    try {
      const result = jsonRecordsToImportResult(parsed);
      const next = resultToSession(
        session?.fileName ?? "pasted.json",
        result,
        session?.dir ?? ("ltr" as Direction),
      );
      setSession(next);
      replaceJsonFromExternal(sessionToPrettyJson(next));
      if (result.truncated) {
        toast.message(tl("largeFileTitle"), {
          description: tl("largeFileDescription", {
            shown: result.rows.length.toLocaleString(),
            total: result.rowCountBeforeCap.toLocaleString(),
          }),
        });
      } else {
        toast.success(t("applySuccess"));
      }
    } catch (e) {
      if (e instanceof CsvImportError) {
        setJsonError(e.message);
      } else {
        setJsonError(t("jsonInvalid"));
      }
    }
  }, [jsonText, replaceJsonFromExternal, session, t, tl]);

  const onFormatJson = React.useCallback(() => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      replaceJsonFromExternal(`${JSON.stringify(parsed, null, 2)}\n`);
    } catch {
      setJsonError(t("jsonInvalid"));
    }
  }, [jsonText, replaceJsonFromExternal, t]);

  const onCopyJson = React.useCallback(() => {
    void navigator.clipboard.writeText(jsonText).then(
      () => toast.success(t("copyJsonSuccess")),
      () => toast.error(t("copyJsonFailed")),
    );
  }, [jsonText, t]);

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

  const onClear = React.useCallback(() => {
    setSession(null);
    setJsonText("");
    setLoadError(null);
    setJsonError(null);
  }, []);

  const onEditorJsonChange = React.useCallback((text: string) => {
    setJsonText(text);
    setJsonError(null);
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
            <Braces className="size-8 text-muted-foreground" aria-hidden />
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
          <FileDropCard
            disabled={false}
            busy={busy}
            fileName={null}
            onFile={(f) => void onLoadFile(f)}
            inputId="json-to-csv-file"
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

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              {t("clearFile")}
            </Button>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {t("jsonPanel")}
              </p>
              <div role="toolbar" className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={onApplyJson}
                >
                  {t("applyJson")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onFormatJson}
                >
                  <Wand2 className="size-3.5" aria-hidden />
                  {t("formatJson")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCopyJson}
                >
                  <Copy className="size-3.5" aria-hidden />
                  {t("copyJson")}
                </Button>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => onEditorJsonChange(e.target.value)}
                aria-label={t("jsonAria")}
                spellCheck={false}
                className="min-h-[280px] w-full rounded-md border bg-background p-3 font-mono text-xs leading-5 md:min-h-[360px]"
              />
              {jsonError ? (
                <p className="text-destructive text-sm" role="alert">
                  {jsonError}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">{t("jsonHint")}</p>
              )}
            </div>

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
                  disabled={!session}
                >
                  <Copy className="size-3.5" aria-hidden />
                  {t("copyCsv")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDownloadCsv}
                  disabled={!session}
                >
                  {t("downloadCsv")}
                </Button>
              </div>
              <textarea
                value={csvOutput}
                readOnly
                aria-label={t("csvAria")}
                className="min-h-[280px] w-full rounded-md border bg-muted/20 p-3 font-mono text-xs leading-5 md:min-h-[360px]"
              />
              <p className="text-muted-foreground text-xs">{t("csvHint")}</p>
              {session ? (
                <CsvSessionReadOnlyGrid
                  session={session}
                  gridKey={`json-csv-${session.rows.length}-${session.columnKeys.join(",")}`}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </DirectionProvider>
  );
}
