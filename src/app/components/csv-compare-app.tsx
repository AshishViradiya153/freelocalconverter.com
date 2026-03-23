"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import {
  ArrowLeftRight,
  Download,
  FileSpreadsheet,
  GitCompare,
  Loader2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { CsvSessionReadOnlyGrid } from "@/app/components/csv-session-read-only-grid";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildCompareDiffReportCsv,
  buildDiffHighlightSets,
  type CompareEqualityOptions,
  computeCsvCompareStats,
  defaultCompareEqualityOptions,
  downloadCompareDiffReport,
  filterSessionToRowIndices,
  incomparableSummaryStats,
  prepareCompareWorkSessions,
} from "@/lib/csv-compare";
import {
  CSV_IMPORT_MAX_FILE_BYTES,
  CSV_IMPORT_MAX_ROWS,
  CsvImportError,
  parseCsvFile,
} from "@/lib/csv-import";
import { type CsvViewerSession, resultToSession } from "@/lib/csv-viewer-session";
import { cn } from "@/lib/utils";

interface FilePickerCardProps {
  label: string;
  disabled: boolean;
  busy: boolean;
  fileName: string | null;
  onFile: (file: File) => void;
  inputId: string;
  changeLabel: string;
}

function FilePickerCard({
  label,
  disabled,
  busy,
  fileName,
  onFile,
  inputId,
  changeLabel,
}: FilePickerCardProps) {
  const tc = useTranslations("compare");

  const onPick = React.useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
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
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors",
          "border-border bg-muted/15 hover:bg-muted/30",
          (disabled || busy) && "pointer-events-none opacity-60",
        )}
      >
        <FileSpreadsheet className="size-8 text-muted-foreground" />
        <p className="text-center text-muted-foreground text-xs">
          {fileName ? (
            <span className="font-medium text-foreground">{fileName}</span>
          ) : (
            tc("dropHint")
          )}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 font-medium text-xs shadow-sm">
          <Upload className="size-3.5" />
          {fileName ? changeLabel : tc("chooseFile")}
        </span>
      </button>
      <input
        id={inputId}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => onPick(e.target.files)}
      />
    </div>
  );
}

function intersectionColumnKeys(a: CsvViewerSession, b: CsvViewerSession): string[] {
  const setB = new Set(b.columnKeys);
  return a.columnKeys.filter((k) => setB.has(k));
}

export function CsvCompareApp() {
  const tc = useTranslations("compare");
  const tl = useTranslations("landing");
  const [leftSession, setLeftSession] = React.useState<CsvViewerSession | null>(
    null,
  );
  const [rightSession, setRightSession] =
    React.useState<CsvViewerSession | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [diffOnly, setDiffOnly] = React.useState(false);
  const [matchColumnsByName, setMatchColumnsByName] = React.useState(true);
  const [alignRows, setAlignRows] = React.useState<"index" | "key">("index");
  const [alignKeyColumn, setAlignKeyColumn] = React.useState<string>("");
  const [equality, setEquality] = React.useState<CompareEqualityOptions>({
    ...defaultCompareEqualityOptions,
  });
  const [syncScroll, setSyncScroll] = React.useState(true);
  const [highlightDiffs, setHighlightDiffs] = React.useState(true);

  const leftScrollRef = React.useRef<HTMLDivElement | null>(null);
  const rightScrollRef = React.useRef<HTMLDivElement | null>(null);
  const syncingScroll = React.useRef<"left" | "right" | null>(null);

  React.useEffect(() => {
    if (!leftSession || !rightSession) return;
    const common = intersectionColumnKeys(leftSession, rightSession);
    if (common.length === 0) return;
    if (!common.includes(alignKeyColumn)) {
      setAlignKeyColumn(common[0] ?? "");
    }
  }, [leftSession, rightSession, alignKeyColumn]);

  const { workLeft, workRight, comparable } = React.useMemo(() => {
    if (!leftSession || !rightSession) {
      return {
        workLeft: null as CsvViewerSession | null,
        workRight: null as CsvViewerSession | null,
        comparable: false,
      };
    }
    return prepareCompareWorkSessions(leftSession, rightSession, {
      matchColumnsByName,
      alignRows,
      alignKeyColumn,
      equality,
    });
  }, [
    leftSession,
    rightSession,
    matchColumnsByName,
    alignRows,
    alignKeyColumn,
    equality,
  ]);

  const stats = React.useMemo(() => {
    if (!workLeft || !workRight || !leftSession || !rightSession) return null;
    if (!comparable) {
      return incomparableSummaryStats(leftSession, rightSession);
    }
    return computeCsvCompareStats(workLeft, workRight, equality);
  }, [
    workLeft,
    workRight,
    leftSession,
    rightSession,
    comparable,
    equality,
  ]);

  const diffSets = React.useMemo(() => {
    if (!workLeft || !workRight || !stats?.canCompareCells) return null;
    return buildDiffHighlightSets(workLeft, workRight, equality);
  }, [workLeft, workRight, stats?.canCompareCells, equality]);

  const { displayLeft, displayRight } = React.useMemo(() => {
    if (!workLeft || !workRight || !stats) {
      return {
        displayLeft: workLeft,
        displayRight: workRight,
      };
    }
    if (!stats.canCompareCells || !diffOnly || stats.differingRowIndices.length === 0) {
      return { displayLeft: workLeft, displayRight: workRight };
    }
    return {
      displayLeft: filterSessionToRowIndices(
        workLeft,
        stats.differingRowIndices,
      ),
      displayRight: filterSessionToRowIndices(
        workRight,
        stats.differingRowIndices,
      ),
    };
  }, [workLeft, workRight, stats, diffOnly]);

  const onLeftScroll = React.useCallback<React.UIEventHandler<HTMLDivElement>>(
    (e) => {
      if (!syncScroll || syncingScroll.current === "right") return;
      syncingScroll.current = "left";
      const t = e.currentTarget;
      const other = rightScrollRef.current;
      if (other) {
        other.scrollTop = t.scrollTop;
        other.scrollLeft = t.scrollLeft;
      }
      requestAnimationFrame(() => {
        syncingScroll.current = null;
      });
    },
    [syncScroll],
  );

  const onRightScroll = React.useCallback<React.UIEventHandler<HTMLDivElement>>(
    (e) => {
      if (!syncScroll || syncingScroll.current === "left") return;
      syncingScroll.current = "right";
      const t = e.currentTarget;
      const other = leftScrollRef.current;
      if (other) {
        other.scrollTop = t.scrollTop;
        other.scrollLeft = t.scrollLeft;
      }
      requestAnimationFrame(() => {
        syncingScroll.current = null;
      });
    },
    [syncScroll],
  );

  const onLoadFile = React.useCallback(
    async (file: File, side: "left" | "right") => {
      setBusy(true);
      setError(null);
      try {
        const r = await parseCsvFile(file);
        const session = resultToSession(file.name, r, "ltr");
        if (side === "left") setLeftSession(session);
        else setRightSession(session);
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
          setError(e.message);
        } else {
          setError(tl("readError"));
        }
      } finally {
        setBusy(false);
      }
    },
    [tl],
  );

  const onReset = React.useCallback(() => {
    setLeftSession(null);
    setRightSession(null);
    setError(null);
    setDiffOnly(false);
    setAlignRows("index");
    setEquality({ ...defaultCompareEqualityOptions });
  }, []);

  const onSwapSides = React.useCallback(() => {
    const L = leftSession;
    const R = rightSession;
    setLeftSession(R);
    setRightSession(L);
  }, [leftSession, rightSession]);

  const onExportDiff = React.useCallback(() => {
    if (!workLeft || !workRight || !stats?.canCompareCells) {
      toast.error(tc("exportDiffUnavailable"));
      return;
    }
    const csv = buildCompareDiffReportCsv(workLeft, workRight, equality);
    downloadCompareDiffReport(csv, `${leftSession?.fileName ?? "left"}_vs_${rightSession?.fileName ?? "right"}`);
    toast.success(tc("exportDiffStarted"));
  }, [
    workLeft,
    workRight,
    stats?.canCompareCells,
    equality,
    leftSession?.fileName,
    rightSession?.fileName,
    tc,
  ]);

  const commonKeys =
    leftSession && rightSession
      ? intersectionColumnKeys(leftSession, rightSession)
      : [];

  const leftDiffSet = diffSets?.left ?? null;
  const rightDiffSet = diffSets?.right ?? null;

  return (
    <DirectionProvider dir="ltr">
      <div className="container flex flex-col gap-6 py-4">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <GitCompare className="size-8 text-muted-foreground" aria-hidden />
            <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
              {tc("heroTitle")}
            </h1>
          </div>
          <p className="max-w-3xl text-muted-foreground text-sm">
            {tc("heroSubtitle", {
              mb: Math.round(CSV_IMPORT_MAX_FILE_BYTES / (1024 * 1024)),
              maxRows: CSV_IMPORT_MAX_ROWS.toLocaleString(),
            })}
          </p>
        </header>

        <div className="flex flex-col gap-4 md:flex-row">
          <FilePickerCard
            label={tc("leftFile")}
            disabled={false}
            busy={busy}
            fileName={leftSession?.fileName ?? null}
            onFile={(f) => void onLoadFile(f, "left")}
            inputId="csv-compare-left"
            changeLabel={tc("changeFile")}
          />
          <FilePickerCard
            label={tc("rightFile")}
            disabled={false}
            busy={busy}
            fileName={rightSession?.fileName ?? null}
            onFile={(f) => void onLoadFile(f, "right")}
            inputId="csv-compare-right"
            changeLabel={tc("changeFile")}
          />
        </div>

        {leftSession && rightSession ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSwapSides}
            >
              <ArrowLeftRight className="size-4" />
              {tc("swapSides")}
            </Button>
          </div>
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

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        {leftSession && rightSession && stats && workLeft && workRight ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-muted/10 p-4">
              <p className="font-medium text-sm">{tc("summaryTitle")}</p>
              <ul className="mt-2 space-y-1 text-muted-foreground text-sm">
                <li>
                  {tc("summaryRows", {
                    left: stats.leftRowCount.toLocaleString(),
                    right: stats.rightRowCount.toLocaleString(),
                  })}
                </li>
                <li>
                  {tc("summaryCols", {
                    left: stats.leftColumnCount.toLocaleString(),
                    right: stats.rightColumnCount.toLocaleString(),
                  })}
                </li>
                {stats.canCompareCells ? (
                  <>
                    {stats.columnsReorderedToMatchLeft ? (
                      <li>{tc("summaryColumnsReordered")}</li>
                    ) : null}
                    <li>
                      {tc("summaryStructureMatch")}
                      {stats.differingCells === 0 ? (
                        <span className="text-foreground">
                          {" "}
                          {tc("summaryIdentical")}
                        </span>
                      ) : (
                        <span className="text-foreground">
                          {" "}
                          {tc("summaryDiffCells", {
                            cells: stats.differingCells.toLocaleString(),
                            rows: stats.rowsWithDifferences.toLocaleString(),
                          })}
                        </span>
                      )}
                    </li>
                  </>
                ) : (
                  <li>{tc("summaryStructureMismatch")}</li>
                )}
              </ul>

              <div className="mt-4 flex flex-col gap-4 border-border border-t pt-4">
                <p className="font-medium text-foreground text-xs uppercase tracking-wide">
                  {tc("optionsTitle")}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="csv-compare-trim"
                      checked={equality.trimWhitespace}
                      onCheckedChange={(v) =>
                        setEquality((e) => ({ ...e, trimWhitespace: v === true }))
                      }
                    />
                    <Label
                      htmlFor="csv-compare-trim"
                      className="cursor-pointer font-normal text-sm leading-none"
                    >
                      {tc("optTrim")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="csv-compare-case"
                      checked={equality.ignoreCase}
                      onCheckedChange={(v) =>
                        setEquality((e) => ({ ...e, ignoreCase: v === true }))
                      }
                    />
                    <Label
                      htmlFor="csv-compare-case"
                      className="cursor-pointer font-normal text-sm leading-none"
                    >
                      {tc("optIgnoreCase")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="csv-compare-sync"
                      checked={syncScroll}
                      onCheckedChange={(v) => setSyncScroll(v === true)}
                    />
                    <Label
                      htmlFor="csv-compare-sync"
                      className="cursor-pointer font-normal text-sm leading-none"
                    >
                      {tc("optSyncScroll")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="csv-compare-highlight"
                      checked={highlightDiffs}
                      onCheckedChange={(v) => setHighlightDiffs(v === true)}
                      disabled={!stats.canCompareCells}
                    />
                    <Label
                      htmlFor="csv-compare-highlight"
                      className="cursor-pointer font-normal text-sm leading-none"
                    >
                      {tc("optHighlightDiffs")}
                    </Label>
                  </div>
                </div>

                {stats.columnStructureKind === "same_keys_diff_order" ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="csv-compare-match-names"
                        checked={matchColumnsByName}
                        onCheckedChange={(v) =>
                          setMatchColumnsByName(v === true)
                        }
                      />
                      <Label
                        htmlFor="csv-compare-match-names"
                        className="cursor-pointer font-normal text-sm leading-none"
                      >
                        {tc("optMatchColumnsByName")}
                      </Label>
                    </div>
                    {!matchColumnsByName ? (
                      <p className="text-amber-800 text-xs dark:text-amber-200/90">
                        {tc("warnMatchColumnsOff")}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {stats.canCompareCells && commonKeys.length > 0 ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="csv-compare-align-key"
                        checked={alignRows === "key"}
                        onCheckedChange={(v) =>
                          setAlignRows(v === true ? "key" : "index")
                        }
                      />
                      <Label
                        htmlFor="csv-compare-align-key"
                        className="cursor-pointer font-normal text-sm leading-none"
                      >
                        {tc("optAlignByKey")}
                      </Label>
                    </div>
                    {alignRows === "key" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {tc("alignKeyLabel")}
                        </span>
                        <Select
                          value={alignKeyColumn}
                          onValueChange={setAlignKeyColumn}
                        >
                          <SelectTrigger size="sm" className="w-[min(100%,220px)]">
                            <SelectValue placeholder={tc("alignKeyPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {commonKeys.map((key) => {
                              const ix = leftSession.columnKeys.indexOf(key);
                              const label =
                                leftSession.headerLabels[ix] ?? key;
                              return (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {stats.canCompareCells && stats.differingRowIndices.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="csv-compare-diff-only"
                        checked={diffOnly}
                        onCheckedChange={(v) => setDiffOnly(v === true)}
                      />
                      <Label
                        htmlFor="csv-compare-diff-only"
                        className="cursor-pointer font-normal text-sm leading-none"
                      >
                        {tc("diffOnlyLabel")}
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={onExportDiff}
                    >
                      <Download className="size-4" />
                      {tc("exportDiffCsv")}
                    </Button>
                  </div>
                ) : stats.canCompareCells ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onExportDiff}
                  >
                    <Download className="size-4" />
                    {tc("exportDiffCsv")}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              {displayLeft ? (
                <CsvSessionReadOnlyGrid
                  session={displayLeft}
                  gridKey={`left-${diffOnly}-${displayLeft.rows.length}-${alignRows}-${alignKeyColumn}-${equality.trimWhitespace}-${equality.ignoreCase}`}
                  diffCellSet={leftDiffSet}
                  highlightDiffs={highlightDiffs}
                  scrollContainerRef={leftScrollRef}
                  onGridScroll={onLeftScroll}
                />
              ) : null}
              {displayRight ? (
                <CsvSessionReadOnlyGrid
                  session={displayRight}
                  gridKey={`right-${diffOnly}-${displayRight.rows.length}-${alignRows}-${alignKeyColumn}-${equality.trimWhitespace}-${equality.ignoreCase}`}
                  diffCellSet={rightDiffSet}
                  highlightDiffs={highlightDiffs}
                  scrollContainerRef={rightScrollRef}
                  onGridScroll={onRightScroll}
                />
              ) : null}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={onReset}>
              {tc("reset")}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{tc("needBoth")}</p>
        )}
      </div>
    </DirectionProvider>
  );
}
