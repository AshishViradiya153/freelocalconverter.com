"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Braces, Copy, Loader2, RotateCcw, Upload, Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { CsvSessionReadOnlyGrid } from "@/app/components/csv-session-read-only-grid";
import { FileSpreadsheetGlyph } from "@/components/file-glyphs";
import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
  ToolToolbar,
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import {
  buildLabelKeyedExportRows,
  downloadJsonExport,
  downloadXlsxExport,
} from "@/lib/csv-export";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  jsonRecordsToImportResult,
  parseCsvFile,
} from "@/lib/csv-import";
import {
  type CsvViewerSession,
  resultToSession,
} from "@/lib/csv-viewer-session";
import type { Direction } from "@/types/data-grid";

function JsonEditorLoadFallback() {
  const t = useTranslations("csvToJson");
  return (
    <div
      className="flex min-h-[280px] items-center justify-center rounded-md border border-border border-dashed text-muted-foreground text-sm md:min-h-[360px]"
      role="status"
      aria-live="polite"
    >
      {t("jsonEditorLoading")}
    </div>
  );
}

const CsvJsonEditorPanel = dynamic(
  () =>
    import("@/app/components/csv-json-editor-panel").then(
      (m) => m.CsvJsonEditorPanel,
    ),
  {
    ssr: false,
    loading: JsonEditorLoadFallback,
  },
);

function sessionToPrettyJson(session: CsvViewerSession): string {
  const rows = buildLabelKeyedExportRows(
    session.rows,
    session.columnKeys,
    session.headerLabels,
  );
  return `${JSON.stringify(rows, null, 2)}\n`;
}

export function CsvToJsonApp() {
  const t = useTranslations("csvToJson");
  const tl = useTranslations("landing");
  const tCompare = useTranslations("compare");
  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const [jsonText, setJsonText] = React.useState("");
  const [jsonEditorRevision, setJsonEditorRevision] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [jsonError, setJsonError] = React.useState<string | null>(null);

  const replaceJsonFromExternal = React.useCallback((text: string) => {
    setJsonText(text);
    setJsonEditorRevision((r) => r + 1);
  }, []);

  const onLoadFile = React.useCallback(
    async (file: File) => {
      setBusy(true);
      setLoadError(null);
      setJsonError(null);
      try {
        const r = await parseCsvFile(file);
        const next = resultToSession(file.name, r, "ltr" as Direction);
        setSession(next);
        replaceJsonFromExternal(sessionToPrettyJson(next));
        if (r.truncated) {
          toast.message(tl("largeFileTitle"), {
            description: tl("largeFileDescription", {
              shown: r.rows.length.toLocaleString(),
              total: r.rowCountBeforeCap.toLocaleString(),
            }),
          });
        }
      } catch (e) {
        if (e instanceof CsvImportError) {
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

  const onApplyJson = React.useCallback(() => {
    if (!session) return;
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
      const next = resultToSession(session.fileName, result, session.dir);
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

  const onResetJsonFromCsv = React.useCallback(() => {
    if (!session) return;
    setJsonError(null);
    replaceJsonFromExternal(sessionToPrettyJson(session));
    toast.message(t("resetFromCsvToast"));
  }, [replaceJsonFromExternal, session, t]);

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
      () => toast.success(t("copySuccess")),
      () => toast.error(t("copyFailed")),
    );
  }, [jsonText, t]);

  const onDownloadJson = React.useCallback(() => {
    if (!session) return;
    downloadJsonExport(
      session.rows,
      session.columnKeys,
      session.headerLabels,
      session.fileName,
    );
    toast.success(tl("downloadStarted"));
  }, [session, tl]);

  const onDownloadXlsx = React.useCallback(() => {
    if (!session) return;
    void toast.promise(
      downloadXlsxExport(
        session.rows,
        session.columnKeys,
        session.headerLabels,
        session.fileName,
      ),
      {
        loading: tl("prepExcel"),
        success: tl("downloadStarted"),
        error: tl("excelError"),
      },
    );
  }, [session, tl]);

  const onClear = React.useCallback(() => {
    setSession(null);
    setJsonText("");
    setJsonEditorRevision((r) => r + 1);
    setLoadError(null);
    setJsonError(null);
  }, []);

  const onEditorJsonChange = React.useCallback((text: string) => {
    setJsonText(text);
    setJsonError(null);
  }, []);

  return (
    <DirectionProvider dir="ltr">
      <ToolPage>
        <ToolHero
          icon={<Braces className="size-8" aria-hidden />}
          title={t("heroTitle")}
          description={t("heroSubtitle", {
            mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
            maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
          })}
        />

        {!session ? (
          <FileDropZone
            disabled={false}
            busy={busy}
            inputId="csv-to-json-file"
            accept=".csv,text/csv"
            onFiles={(files) => {
              const file = files?.[0];
              if (file) void onLoadFile(file);
            }}
            fileIcon={FileSpreadsheetGlyph}
            dropTitle={tCompare("dropHint")}
            chooseLabel={tCompare("chooseFile")}
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
          <ToolCard className="space-y-4">
            <ToolToolbar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClear}
              >
                {t("clearFile")}
              </Button>
            </ToolToolbar>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <ToolPane className="flex-1 gap-2">
                <ToolPaneTitle>{t("csvPanel")}</ToolPaneTitle>
                <CsvSessionReadOnlyGrid
                  session={session}
                  onSessionChange={(next) => setSession(next)}
                  gridKey={`csv-json-${session.rows.length}-${session.columnKeys.join(",")}`}
                />
              </ToolPane>

              <ToolPane className="flex-1 gap-2">
                <ToolPaneTitle>{t("jsonPanel")}</ToolPaneTitle>
                <ToolToolbar role="toolbar">
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
                    onClick={onResetJsonFromCsv}
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    {t("resetFromCsv")}
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDownloadJson}
                  >
                    {t("downloadJson")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDownloadXlsx}
                  >
                    {t("downloadXlsx")}
                  </Button>
                </ToolToolbar>
                <CsvJsonEditorPanel
                  jsonText={jsonText}
                  contentRevision={jsonEditorRevision}
                  onJsonTextChange={onEditorJsonChange}
                  ariaLabel={t("jsonAria")}
                />
                {jsonError ? (
                  <p className="text-destructive text-sm" role="alert">
                    {jsonError}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    {t("jsonHint")}
                  </p>
                )}
              </ToolPane>
            </div>
          </ToolCard>
        ) : null}
      </ToolPage>
    </DirectionProvider>
  );
}
