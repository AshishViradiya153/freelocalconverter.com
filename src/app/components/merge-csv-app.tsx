"use client";

import {
  Download,
  FileSpreadsheet,
  GripVertical,
  Loader2,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import {
  buildCsvExportString,
  sanitizeCsvDownloadFileBaseName,
} from "@/lib/csv-export";
import {
  CsvImportError,
  type CsvImportResult,
  parseCsvFile,
} from "@/lib/csv-import";
import { mergeCsvImports } from "@/lib/csv-merge";
import { downloadBlob } from "@/lib/download-blob";
import { moveArrayElement } from "@/lib/move-array-element";
import { cn } from "@/lib/utils";

interface QueuedCsv {
  id: string;
  file: File;
}

function acceptableCsv(file: File) {
  if (file.type === "text/csv" || file.type === "application/csv") return true;
  return /\.csv$/i.test(file.name);
}

function baseNameFromFirstFileName(name: string) {
  const leaf = name.replace(/\.csv$/i, "");
  return leaf || "merged";
}

export function MergeCsvApp() {
  const t = useTranslations("mergeCsv");
  const tl = useTranslations("landing");
  const [items, setItems] = React.useState<QueuedCsv[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [skipRepeatHeader, setSkipRepeatHeader] = React.useState(true);
  const [dedupeRows, setDedupeRows] = React.useState(false);
  const [dedupeCols, setDedupeCols] = React.useState(false);
  const [addIndexColumn, setAddIndexColumn] = React.useState(false);

  const canMerge = items.length >= 2 && !busy;
  const baseName = React.useMemo(() => {
    if (items.length === 0) return "merged";
    return baseNameFromFirstFileName(items[0]?.file.name ?? "");
  }, [items]);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const next: QueuedCsv[] = [];
    for (const f of Array.from(files)) {
      if (!acceptableCsv(f)) continue;
      next.push({ id: crypto.randomUUID(), file: f });
    }

    if (next.length === 0) {
      setError(t("noValidCsv"));
      return;
    }

    setItems((prev) => prev.concat(next));
  }

  function onClear() {
    setItems([]);
    setError(null);
    setBusy(false);
  }

  async function onMerge() {
    if (!canMerge) return;
    setBusy(true);
    setError(null);

    try {
      const results: CsvImportResult[] = [];
      for (const it of items) {
        const r = await parseCsvFile(it.file);
        results.push(r);
      }

      const merged = mergeCsvImports(
        results.map((result) => ({ result })),
        {
          skipRepeatedHeaderRowsInSubsequentFiles: skipRepeatHeader,
          dedupeRows,
          dedupeDuplicateColumns: dedupeCols,
          addIndexColumn,
        },
      );

      if (merged.truncated) {
        toast.message(tl("largeFileTitle"), {
          description: tl("largeFileDescription", {
            shown: merged.rows.length.toLocaleString(),
            total: merged.rowCountBeforeCap.toLocaleString(),
          }),
        });
      }

      const csv = buildCsvExportString(
        merged.rows,
        merged.columnKeys,
        merged.headerLabels,
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const safeBase = sanitizeCsvDownloadFileBaseName(baseName);
      downloadBlob(blob, `${safeBase}-merged.csv`);
      toast.success(t("mergeSuccess", { count: items.length }));
    } catch (e) {
      if (e instanceof CsvImportError) {
        setError(e.message);
        toast.error(t("mergeFailed"));
        return;
      }
      const msg = e instanceof Error ? e.message : t("mergeFailed");
      setError(msg);
      toast.error(t("mergeFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FileSpreadsheet
            className="size-8 text-muted-foreground"
            aria-hidden
          />
          <h1 className={toolHeroTitleClassName}>{t("heroTitle")}</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          {t("heroSubtitle")}
        </p>
      </header>

      <FileDropZone
        disabled={false}
        busy={busy}
        inputId="merge-csv-input"
        accept=".csv,text/csv,application/csv"
        multiple
        onFiles={(files) => addFiles(files)}
        fileIcon={FileSpreadsheet}
        dropTitle={t("dropTitle")}
        dropHint={t("dropHint")}
        chooseLabel={t("chooseLabel")}
        chooseLabelWhenFileSelected={t("chooseMore")}
        fileHint={t("fileHint")}
      />

      {busy ? (
        <div
          className="flex items-center gap-2 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>{t("merging")}</span>
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="font-medium">{t("filesSection")}</div>
                <div className="text-muted-foreground text-xs">
                  {t("filesHint")}
                </div>
              </div>
              <div className="text-muted-foreground text-sm">
                {t("fileCount", { count: items.length })}
              </div>
            </div>

            <Sortable
              value={items}
              getItemValue={(it) => it.id}
              onValueChange={setItems}
              orientation="vertical"
              mouseActivationDistance={6}
            >
              <SortableContent
                className="divide-y overflow-hidden rounded-xl border bg-background"
                role="list"
                aria-label={t("listAria")}
              >
                {items.map((it, idx) => (
                  <SortableItem
                    key={it.id}
                    value={it.id}
                    className="flex items-center gap-3 bg-background p-3"
                  >
                    <div className="grid size-10 place-items-center rounded-lg border bg-muted/10">
                      <span className="font-semibold text-muted-foreground text-xs">
                        {idx + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sm">
                        {it.file.name}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {(it.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>

                    <SortableItemHandle
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-muted/30"
                      aria-label={t("dragHandleAria", { name: it.file.name })}
                      title={t("dragHandleTitle")}
                      disabled={busy}
                    >
                      <GripVertical className="size-4" aria-hidden />
                    </SortableItemHandle>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || idx === 0}
                        onClick={() =>
                          setItems((prev) =>
                            moveArrayElement(prev, idx, idx - 1),
                          )
                        }
                      >
                        {t("moveUp")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || idx === items.length - 1}
                        onClick={() =>
                          setItems((prev) =>
                            moveArrayElement(prev, idx, idx + 1),
                          )
                        }
                      >
                        {t("moveDown")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          setItems((prev) => prev.filter((x) => x.id !== it.id))
                        }
                        className={cn(
                          "text-destructive hover:text-destructive",
                        )}
                        aria-label={t("removeAria", { name: it.file.name })}
                        title={t("removeTitle")}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </SortableItem>
                ))}
              </SortableContent>
            </Sortable>
          </section>

          <aside className="rounded-xl border bg-background p-4">
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-medium">{t("exportSection")}</div>
                <div className="text-muted-foreground text-xs">
                  {t("exportHint")}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <div className="font-medium">{t("settingsSection")}</div>

                <div className="flex gap-2">
                  <Checkbox
                    id="merge-csv-skip-repeat-header"
                    checked={skipRepeatHeader}
                    disabled={busy}
                    onCheckedChange={(c) => setSkipRepeatHeader(c === true)}
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Label
                      htmlFor="merge-csv-skip-repeat-header"
                      className="font-normal"
                    >
                      {t("skipRepeatHeaderLabel")}
                    </Label>
                    <p className="text-muted-foreground text-xs leading-snug">
                      {t("skipRepeatHeaderHint")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Checkbox
                    id="merge-csv-dedupe-rows"
                    checked={dedupeRows}
                    disabled={busy}
                    onCheckedChange={(c) => setDedupeRows(c === true)}
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Label
                      htmlFor="merge-csv-dedupe-rows"
                      className="font-normal"
                    >
                      {t("dedupeRowsLabel")}
                    </Label>
                    <p className="text-muted-foreground text-xs leading-snug">
                      {t("dedupeRowsHint")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Checkbox
                    id="merge-csv-dedupe-cols"
                    checked={dedupeCols}
                    disabled={busy}
                    onCheckedChange={(c) => setDedupeCols(c === true)}
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Label
                      htmlFor="merge-csv-dedupe-cols"
                      className="font-normal"
                    >
                      {t("dedupeColsLabel")}
                    </Label>
                    <p className="text-muted-foreground text-xs leading-snug">
                      {t("dedupeColsHint")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Checkbox
                    id="merge-csv-add-index"
                    checked={addIndexColumn}
                    disabled={busy}
                    onCheckedChange={(c) => setAddIndexColumn(c === true)}
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Label
                      htmlFor="merge-csv-add-index"
                      className="font-normal"
                    >
                      {t("addIndexLabel")}
                    </Label>
                    <p className="text-muted-foreground text-xs leading-snug">
                      {t("addIndexHint")}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClear}
                  disabled={busy}
                >
                  <Trash2 className="size-4" aria-hidden />
                  {t("clear")}
                </Button>
              </div>

              <Button
                type="button"
                variant="default"
                disabled={!canMerge}
                onClick={() => void onMerge()}
              >
                <Download className="size-4" aria-hidden />
                {t("mergeDownload")}
              </Button>

              <div className="flex items-start gap-2 rounded-lg border bg-muted/10 p-3 text-muted-foreground text-xs">
                <FileSpreadsheet className="mt-0.5 size-4" aria-hidden />
                <div className="min-w-0">{t("privacyNote")}</div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
