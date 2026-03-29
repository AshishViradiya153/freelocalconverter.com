"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Copy, Database, Download, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { CsvSessionReadOnlyGrid } from "@/app/components/csv-session-read-only-grid";
import { FileSpreadsheetGlyph } from "@/components/file-glyphs";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  csvSessionToSql,
  defaultTableNameFromFileName,
  type SqlDialect,
} from "@/lib/csv/csv-sql-transform";
import { sanitizeCsvDownloadFileBaseName } from "@/lib/csv-export";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  parseCsvFile,
} from "@/lib/csv-import";
import {
  type CsvViewerSession,
  resultToSession,
} from "@/lib/csv-viewer-session";

function downloadSqlFile(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const DIALECT_OPTIONS: SqlDialect[] = ["postgresql", "mysql", "sqlite"];
const BATCH_OPTIONS = [50, 100, 250, 500] as const;

export function CsvToSqlApp() {
  const t = useTranslations("csvToSql");
  const tl = useTranslations("landing");
  const [session, setSession] = React.useState<CsvViewerSession | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [tableNameDraft, setTableNameDraft] = React.useState("");
  const [dialect, setDialect] = React.useState<SqlDialect>("postgresql");
  const [includeCreate, setIncludeCreate] = React.useState(true);
  const [includeInserts, setIncludeInserts] = React.useState(true);
  const [emptyAsNull, setEmptyAsNull] = React.useState(true);
  const [rowsPerInsert, setRowsPerInsert] =
    React.useState<(typeof BATCH_OPTIONS)[number]>(100);

  const onLoadFile = React.useCallback(
    async (file: File) => {
      setBusy(true);
      setLoadError(null);
      try {
        const result = await parseCsvFile(file);
        const next = resultToSession(file.name, result, "ltr");
        setSession(next);
        setTableNameDraft(defaultTableNameFromFileName(file.name));
        if (result.truncated) {
          toast.message(tl("largeFileTitle"), {
            description: tl("largeFileDescription", {
              shown: result.rows.length.toLocaleString(),
              total: result.rowCountBeforeCap.toLocaleString(),
            }),
          });
        }
      } catch (e) {
        setSession(null);
        setTableNameDraft("");
        if (e instanceof CsvImportError) setLoadError(e.message);
        else setLoadError(tl("readError"));
      } finally {
        setBusy(false);
      }
    },
    [tl],
  );

  const onClear = React.useCallback(() => {
    setSession(null);
    setLoadError(null);
    setTableNameDraft("");
  }, []);

  const sqlOutput = React.useMemo(() => {
    if (!session) return "";
    const tableName =
      tableNameDraft.trim() || defaultTableNameFromFileName(session.fileName);
    return csvSessionToSql(session, {
      tableName,
      dialect,
      includeCreateTable: includeCreate,
      includeInserts,
      rowsPerInsert,
      emptyAsNull,
    });
  }, [
    session,
    tableNameDraft,
    dialect,
    includeCreate,
    includeInserts,
    rowsPerInsert,
    emptyAsNull,
  ]);

  const onCopy = React.useCallback(() => {
    void navigator.clipboard.writeText(sqlOutput).then(
      () => toast.success(t("copySuccess")),
      () => toast.error(t("copyFailed")),
    );
  }, [sqlOutput, t]);

  const onDownload = React.useCallback(() => {
    if (!session) return;
    const base = sanitizeCsvDownloadFileBaseName(session.fileName);
    downloadSqlFile(sqlOutput, `${base}.sql`);
    toast.success(t("downloadStarted"));
  }, [session, sqlOutput, t]);

  const previewKey = React.useMemo(() => {
    if (!session) return "";
    return `csv-sql-${session.rows.length}-${session.columnKeys.join(",")}`;
  }, [session]);

  return (
    <DirectionProvider dir="ltr">
      <div className="container flex flex-col gap-6 py-4">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Database className="size-8 text-muted-foreground" aria-hidden />
            <h1 className={toolHeroTitleClassName}>{t("heroTitle")}</h1>
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
            inputId="csv-to-sql-file"
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClear}
              >
                {t("clearFile")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCopy}
              >
                <Copy className="size-3.5" aria-hidden />
                {t("copySql")}
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onDownload}
              >
                <Download className="size-3.5" aria-hidden />
                {t("downloadSql")}
              </Button>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/10 p-4">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {t("optionsTitle")}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex min-w-[200px] flex-col gap-2">
                  <Label htmlFor="csv-sql-table-name">
                    {t("tableNameLabel")}
                  </Label>
                  <Input
                    id="csv-sql-table-name"
                    value={tableNameDraft}
                    onChange={(e) => setTableNameDraft(e.target.value)}
                    placeholder={defaultTableNameFromFileName(session.fileName)}
                    autoComplete="off"
                  />
                </div>
                <div className="flex min-w-[200px] flex-col gap-2">
                  <Label>{t("dialectLabel")}</Label>
                  <Select
                    value={dialect}
                    onValueChange={(v) => setDialect(v as SqlDialect)}
                  >
                    <SelectTrigger size="sm" className="w-full min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIALECT_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {t(`dialect.${d}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex min-w-[200px] flex-col gap-2">
                  <Label>{t("batchSizeLabel")}</Label>
                  <Select
                    value={String(rowsPerInsert)}
                    onValueChange={(v) =>
                      setRowsPerInsert(
                        Number(v) as (typeof BATCH_OPTIONS)[number],
                      )
                    }
                  >
                    <SelectTrigger size="sm" className="w-full min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BATCH_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {t("batchSizeOption", { n })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeCreate}
                    onCheckedChange={(c) => setIncludeCreate(c === true)}
                  />
                  {t("optCreateTable")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeInserts}
                    onCheckedChange={(c) => setIncludeInserts(c === true)}
                  />
                  {t("optInserts")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={emptyAsNull}
                    onCheckedChange={(c) => setEmptyAsNull(c === true)}
                  />
                  {t("optEmptyAsNull")}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {t("sqlPanel")}
                </p>
                <textarea
                  value={sqlOutput}
                  readOnly
                  aria-label={t("sqlAria")}
                  className="min-h-[280px] w-full rounded-md border bg-muted/20 p-3 font-mono text-xs leading-5 md:min-h-[360px]"
                />
                <p className="text-muted-foreground text-xs">{t("sqlHint")}</p>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {t("previewPanel")}
                </p>
                <CsvSessionReadOnlyGrid
                  session={session}
                  onSessionChange={(next) => setSession(next)}
                  gridKey={previewKey}
                />
                <p className="text-muted-foreground text-xs">
                  {t("previewHint")}
                </p>
              </div>
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
