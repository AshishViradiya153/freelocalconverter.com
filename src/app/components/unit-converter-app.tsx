"use client";

import { ArrowRightLeft, Copy, Ruler, Weight } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  feetToMeters,
  kgToLbs,
  lbsToKg,
} from "@/lib/math/simple-converters";

type Mode = "lbs-to-kg" | "kg-to-lbs" | "feet-to-meters";

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

function modeMeta(mode: Mode): {
  icon: React.ReactNode;
  title: string;
  inputLabel: string;
  outputLabel: string;
  placeholder: string;
  convert: (n: number) => number;
} {
  switch (mode) {
    case "lbs-to-kg":
      return {
        icon: <Weight className="size-4" aria-hidden />,
        title: "Lbs → Kg",
        inputLabel: "Pounds (lb)",
        outputLabel: "Kilograms (kg)",
        placeholder: "e.g. 150",
        convert: lbsToKg,
      };
    case "kg-to-lbs":
      return {
        icon: <Weight className="size-4" aria-hidden />,
        title: "Kg → Lbs",
        inputLabel: "Kilograms (kg)",
        outputLabel: "Pounds (lb)",
        placeholder: "e.g. 70",
        convert: kgToLbs,
      };
    case "feet-to-meters":
      return {
        icon: <Ruler className="size-4" aria-hidden />,
        title: "Feet → Meters",
        inputLabel: "Feet (ft)",
        outputLabel: "Meters (m)",
        placeholder: "e.g. 6",
        convert: feetToMeters,
      };
  }
}

export function UnitConverterApp() {
  const [mode, setMode] = React.useState<Mode>("lbs-to-kg");
  const [raw, setRaw] = React.useState("");

  const parsed = React.useMemo(() => parseDecimal(raw), [raw]);
  const meta = React.useMemo(() => modeMeta(mode), [mode]);

  const output = React.useMemo(() => {
    if (!parsed.ok) return null;
    return formatConverted(meta.convert(parsed.value));
  }, [meta, parsed]);

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
        icon={<ArrowRightLeft className="size-8" aria-hidden />}
        title="Unit Converter"
        description="Quick unit conversions that run locally in your browser."
      />

      <ToolCard className="flex flex-col gap-4">
        <ToolToolbar>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => {
              if (v === "lbs-to-kg" || v === "kg-to-lbs" || v === "feet-to-meters") {
                setMode(v);
              }
            }}
            className="justify-start"
            aria-label="Conversion type"
          >
            <ToggleGroupItem value="lbs-to-kg">
              <span className="flex items-center gap-2">
                {modeMeta("lbs-to-kg").icon}
                {modeMeta("lbs-to-kg").title}
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem value="kg-to-lbs">
              <span className="flex items-center gap-2">
                {modeMeta("kg-to-lbs").icon}
                {modeMeta("kg-to-lbs").title}
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem value="feet-to-meters">
              <span className="flex items-center gap-2">
                {modeMeta("feet-to-meters").icon}
                {modeMeta("feet-to-meters").title}
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </ToolToolbar>

        <ToolPane>
          <ToolPaneTitle>Input</ToolPaneTitle>
          <div className="flex flex-col gap-2">
            <Label htmlFor="unit-input">{meta.inputLabel}</Label>
            <Input
              id="unit-input"
              inputMode="decimal"
              autoComplete="off"
              placeholder={meta.placeholder}
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
              <Label className="text-muted-foreground">{meta.outputLabel}</Label>
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

