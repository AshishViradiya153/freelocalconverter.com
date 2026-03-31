"use client";

import { Copy, Weight } from "lucide-react";
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
import { Link } from "@/i18n/navigation";
import { lbsToKg } from "@/lib/math/simple-converters";

function formatConverted(n: number): string {
  const rounded = Math.round(n * 1e9) / 1e9;
  return String(rounded);
}

function parseDecimal(raw: string):
  | { ok: true; value: number }
  | { ok: false; empty: true }
  | { ok: false; empty: false; message: string } {
  const t = raw.trim().replace(",", ".");
  if (!t) return { ok: false, empty: true };
  const n = Number(t);
  if (!Number.isFinite(n)) {
    return { ok: false, empty: false, message: "Enter a valid number." };
  }
  return { ok: true, value: n };
}

export function LbsToKgConverterApp() {
  const [raw, setRaw] = React.useState("");
  const parsed = React.useMemo(() => parseDecimal(raw), [raw]);

  const output = React.useMemo(() => {
    if (!parsed.ok) return null;
    return formatConverted(lbsToKg(parsed.value));
  }, [parsed]);

  const onCopy = React.useCallback(() => {
    if (!output) return;
    void navigator.clipboard.writeText(output).then(
      () => toast.success("Copied"),
      () => toast.error("Could not copy"),
    );
  }, [output]);

  return (
    <ToolPage>
      <ToolHero
        icon={<Weight className="size-8" aria-hidden />}
        title="Lbs to Kg"
        description={
          <>
            Convert pounds (lb) to kilograms (kg) locally in your browser.{" "}
            <span className="mt-2 block text-sm">
              Looking for the reverse?{" "}
              <Link
                href="/kg-to-lbs"
                className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/90"
              >
                Kg to Lbs
              </Link>
              {" "}·{" "}
              <Link
                href="/unit-converter"
                className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/90"
              >
                Unit Converter
              </Link>
            </span>
          </>
        }
      />

      <ToolCard className="flex flex-col gap-4">
        <ToolPane>
          <ToolPaneTitle>Input</ToolPaneTitle>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lbs-input">Pounds (lb)</Label>
            <Input
              id="lbs-input"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 150"
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
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1">
              <Label className="text-muted-foreground">Kilograms (kg)</Label>
              <p className="mt-1 font-mono text-lg tabular-nums">
                {output ?? "-"}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!output}
              onClick={onCopy}
            >
              <Copy className="size-4" aria-hidden />
              Copy
            </Button>
          </div>
        </ToolPane>
      </ToolCard>
    </ToolPage>
  );
}

