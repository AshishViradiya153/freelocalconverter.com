"use client";

import { Copy, Globe2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatZoned(
  date: Date,
  timeZone: string,
): { date: string; time: string } {
  const dtfDate = new Intl.DateTimeFormat(undefined, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dtfTime = new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return { date: dtfDate.format(date), time: dtfTime.format(date) };
}

function parseLocalDateTime(
  raw: string,
): { ok: true; date: Date } | { ok: false; empty: true } | { ok: false; empty: false; message: string } {
  const t = raw.trim();
  if (!t) return { ok: false, empty: true };
  const d = new Date(t);
  if (!Number.isFinite(d.getTime())) {
    return { ok: false, empty: false, message: "Enter a valid date/time." };
  }
  return { ok: true, date: d };
}

export function TimeZonePairConverterApp({
  title,
  fromTimeZone,
  toTimeZone,
}: {
  title: string;
  fromTimeZone: string;
  toTimeZone: string;
}) {
  const [raw, setRaw] = React.useState("");
  const parsed = React.useMemo(() => parseLocalDateTime(raw), [raw]);

  const output = React.useMemo(() => {
    if (!parsed.ok) return null;
    const from = formatZoned(parsed.date, fromTimeZone);
    const to = formatZoned(parsed.date, toTimeZone);
    return { from, to };
  }, [fromTimeZone, parsed, toTimeZone]);

  const onCopy = React.useCallback(() => {
    if (!output) return;
    const text = `${title}\n${fromTimeZone}: ${output.from.date} ${output.from.time}\n${toTimeZone}: ${output.to.date} ${output.to.time}`;
    void navigator.clipboard.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Could not copy"),
    );
  }, [fromTimeZone, output, title, toTimeZone]);

  return (
    <ToolPage>
      <ToolHero
        icon={<Globe2 className="size-8" aria-hidden />}
        title={title}
        description="Convert a local date/time between two time zones (uses your browser, no uploads)."
      />

      <ToolCard className="flex flex-col gap-4">
        <ToolPane>
          <ToolPaneTitle>Input</ToolPaneTitle>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tz-dt">Local date/time</Label>
            <Input
              id="tz-dt"
              type="datetime-local"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
            {parsed.ok === false && !parsed.empty ? (
              <p className="text-destructive text-sm" role="status">
                {parsed.message}
              </p>
            ) : null}
          </div>
        </ToolPane>

        <ToolPane>
          <ToolPaneTitle>Result</ToolPaneTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">{fromTimeZone}</Label>
              <p className="mt-1 font-mono text-sm tabular-nums">
                {output ? `${output.from.date} ${output.from.time}` : "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{toTimeZone}</Label>
              <p className="mt-1 font-mono text-sm tabular-nums">
                {output ? `${output.to.date} ${output.to.time}` : "-"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={!output}
            onClick={onCopy}
          >
            <Copy className="size-4" aria-hidden />
            Copy
          </Button>
        </ToolPane>
      </ToolCard>
    </ToolPage>
  );
}

