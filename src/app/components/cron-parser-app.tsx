"use client";

import { formatDistanceToNow } from "date-fns";
import { CalendarClock, Copy, Info, RefreshCw, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
  ToolToolbar,
} from "@/components/tool-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  describeCronExpression,
  getNextCronRuns,
  humanPhraseToCron,
  parseCronExpression,
} from "@/lib/text/cron-schedule";
import { cn } from "@/lib/utils";

const PRESETS: Array<{ label: string; value: string }> = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 15 min", value: "*/15 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Daily midnight", value: "0 0 * * *" },
  { label: "Weekdays 9:00", value: "0 9 * * 1-5" },
  { label: "Weekly Sun", value: "0 0 * * 0" },
  { label: "@daily", value: "@daily" },
];

const NEXT_COUNTS = [5, 10, 15, 25] as const;

function alertBoxClass(): string {
  return "rounded-lg border border-border/80 bg-muted/20 p-3 text-foreground text-xs leading-relaxed";
}

export function CronParserApp() {
  const locale = useLocale();
  const [cronLine, setCronLine] = React.useState("0 9 * * 1-5");
  const [humanPhrase, setHumanPhrase] = React.useState("");
  const [useUtc, setUseUtc] = React.useState(false);
  const [nextCount, setNextCount] =
    React.useState<(typeof NEXT_COUNTS)[number]>(10);
  const [anchor, setAnchor] = React.useState(() => new Date());

  const parsed = React.useMemo(
    () => parseCronExpression(cronLine.trim()),
    [cronLine],
  );

  const description = React.useMemo(() => {
    if (!parsed.ok) return null;
    return describeCronExpression(parsed.cron);
  }, [parsed]);

  const nextRuns = React.useMemo(() => {
    if (!parsed.ok) return [];
    return getNextCronRuns(parsed.cron, anchor, nextCount, { utc: useUtc });
  }, [parsed, anchor, nextCount, useUtc]);

  const fullFmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "en" ? undefined : locale, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: useUtc ? "UTC" : undefined,
        timeZoneName: useUtc ? "short" : "short",
      }),
    [locale, useUtc],
  );

  const onCopy = React.useCallback((label: string, text: string) => {
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`Copied ${label}`),
      () => toast.error("Could not copy"),
    );
  }, []);

  const onRefreshAnchor = React.useCallback(() => {
    setAnchor(new Date());
    toast.message("Next runs recalculated from now");
  }, []);

  const onApplyHuman = React.useCallback(() => {
    const r = humanPhraseToCron(humanPhrase);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setCronLine(r.cron);
    toast.success("Applied phrase to cron field");
  }, [humanPhrase]);

  return (
    <ToolPage>
      <ToolHero
        icon={<CalendarClock className="size-8 md:size-9" aria-hidden />}
        title="Cron parser"
        description="Parse standard five-field cron schedules, preview upcoming run times, and turn simple English phrases into cron. Everything runs locally in your browser; expressions follow common Vixie-style rules (when both day-of-month and day-of-week are set, either can match)."
      />

      <ToolCard>
        <ToolToolbar className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-muted-foreground text-xs leading-relaxed">
            Minute, hour, day-of-month, month, day-of-week. Optional macros:
            @hourly, @daily, @weekly, @monthly, @yearly. Names like MON or JAN
            are accepted. Next runs use minute resolution (second 0).
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCopy("cron", cronLine)}
              disabled={!cronLine.trim()}
            >
              <Copy className="size-4" aria-hidden />
              Copy cron
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefreshAnchor}
            >
              <RefreshCw className="size-4" aria-hidden />
              Refresh times
            </Button>
          </div>
        </ToolToolbar>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.value}
              type="button"
              variant="secondary"
              size="sm"
              className="font-mono text-xs"
              onClick={() => setCronLine(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <Label htmlFor="cron-input" className="mt-4 block text-sm">
          Cron expression
        </Label>
        <Input
          id="cron-input"
          value={cronLine}
          onChange={(e) => setCronLine(e.target.value)}
          placeholder="0 9 * * 1-5"
          className="mt-1.5 font-mono text-sm"
          spellCheck={false}
          autoComplete="off"
        />

        {!parsed.ok ? (
          <p className="mt-3 text-destructive text-sm" role="alert">
            {parsed.error}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {parsed.cron.normalized}
            </Badge>
            <span className="text-muted-foreground text-xs">normalized</span>
          </div>
        )}

        {description ? (
          <p className="mt-3 text-foreground text-sm leading-relaxed">
            {description}
          </p>
        ) : null}

        <Separator className="my-5" />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
              Next runs from
            </p>
            <div className="flex rounded-md border border-border/80 bg-muted/10 p-1">
              <Button
                type="button"
                size="sm"
                variant={useUtc ? "ghost" : "secondary"}
                onClick={() => setUseUtc(false)}
              >
                Local
              </Button>
              <Button
                type="button"
                size="sm"
                variant={useUtc ? "secondary" : "ghost"}
                onClick={() => setUseUtc(true)}
              >
                UTC
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="next-count" className="text-xs">
                Count
              </Label>
              <div className="flex rounded-md border border-border/80 p-1">
                {NEXT_COUNTS.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant={nextCount === n ? "secondary" : "ghost"}
                    className="h-8 min-w-9 px-2"
                    onClick={() => setNextCount(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {parsed.ok ? (
          <ul className="mt-4 flex flex-col gap-2">
            {nextRuns.map((d, i) => (
              <li
                key={`${d.toISOString()}-${i}`}
                className="flex flex-col gap-0.5 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-mono text-xs">{fullFmt.format(d)}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(d, { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-muted-foreground text-sm">
            Fix the expression to see upcoming runs.
          </p>
        )}

        <Separator className="my-6" />

        <ToolPane>
          <ToolPaneTitle className="flex items-center gap-2 normal-case tracking-normal">
            <Sparkles className="size-3.5" aria-hidden />
            English to cron
          </ToolPaneTitle>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Examples:{" "}
            <kbd className="rounded border bg-muted/40 px-1 py-0.5 font-mono">
              every 5 minutes
            </kbd>
            ,{" "}
            <kbd className="rounded border bg-muted/40 px-1 py-0.5 font-mono">
              weekdays at 9am
            </kbd>
            ,{" "}
            <kbd className="rounded border bg-muted/40 px-1 py-0.5 font-mono">
              monday at 3:30 pm
            </kbd>
            ,{" "}
            <kbd className="rounded border bg-muted/40 px-1 py-0.5 font-mono">
              monthly on the 15th at 8:00 am
            </kbd>
            .
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="human-phrase" className="text-sm">
                Phrase
              </Label>
              <Input
                id="human-phrase"
                value={humanPhrase}
                onChange={(e) => setHumanPhrase(e.target.value)}
                placeholder="every 10 minutes"
                className="mt-1.5"
              />
            </div>
            <Button
              type="button"
              className="shrink-0"
              onClick={onApplyHuman}
              disabled={!humanPhrase.trim()}
            >
              Apply to cron
            </Button>
          </div>
        </ToolPane>

        <div className={cn("mt-6 flex gap-2", alertBoxClass())}>
          <Info
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div>
            <p className="font-medium">Scheduler notes</p>
            <p className="mt-1 text-muted-foreground">
              Kubernetes and some platforms use a different flavor (often with
              seconds or extra fields). Always confirm against your orchestrator
              docs. DST shifts apply in local mode; use UTC for predictable
              production schedules.
            </p>
          </div>
        </div>
      </ToolCard>
    </ToolPage>
  );
}
