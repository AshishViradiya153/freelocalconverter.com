"use client";

import { Copy, Thermometer } from "lucide-react";
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
import { Link } from "@/i18n/navigation";
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
} from "@/lib/math/simple-converters";

type Mode = "c-to-f" | "f-to-c";

function formatConverted(n: number): string {
  const rounded = Math.round(n * 1e9) / 1e9;
  return String(rounded);
}

export function CelsiusFahrenheitConverterApp() {
  const [mode, setMode] = React.useState<Mode>("c-to-f");
  const [raw, setRaw] = React.useState("");

  const parsed = React.useMemo(() => {
    const t = raw.trim().replace(",", ".");
    if (!t) return { ok: false as const, empty: true };
    const n = Number(t);
    if (!Number.isFinite(n)) {
      return { ok: false as const, empty: false, message: "Enter a valid number." };
    }
    return { ok: true as const, value: n };
  }, [raw]);

  const output = React.useMemo(() => {
    if (!parsed.ok) return null;
    if (mode === "c-to-f") {
      return {
        label: "Fahrenheit (°F)",
        value: formatConverted(celsiusToFahrenheit(parsed.value)),
      };
    }
    return {
      label: "Celsius (°C)",
      value: formatConverted(fahrenheitToCelsius(parsed.value)),
    };
  }, [mode, parsed]);

  const inputLabel =
    mode === "c-to-f" ? "Celsius (°C)" : "Fahrenheit (°F)";

  const onCopy = React.useCallback(() => {
    if (!output) return;
    void navigator.clipboard.writeText(output.value).then(
      () => toast.success("Copied"),
      () => toast.error("Could not copy"),
    );
  }, [output]);

  return (
    <ToolPage>
      <ToolHero
        icon={<Thermometer className="size-8" aria-hidden />}
        title="Celsius ↔ Fahrenheit"
        description={
          <>
            Convert between °C and °F in your browser. Values stay on your device.{" "}
            <span className="mt-2 block text-sm">
              Read the guide:{" "}
              <Link
                href="/blog/how-to-convert-celsius-to-fahrenheit"
                className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/90"
              >
                how to convert Celsius to Fahrenheit
              </Link>
            </span>
          </>
        }
      />

      <ToolCard className="flex flex-col gap-4">
        <ToolToolbar>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => {
              if (v === "c-to-f" || v === "f-to-c") setMode(v);
            }}
            className="justify-start"
            aria-label="Conversion direction"
          >
            <ToggleGroupItem value="c-to-f">Celsius → Fahrenheit</ToggleGroupItem>
            <ToggleGroupItem value="f-to-c">Fahrenheit → Celsius</ToggleGroupItem>
          </ToggleGroup>
        </ToolToolbar>

        <ToolPane>
          <ToolPaneTitle>Input</ToolPaneTitle>
          <div className="flex flex-col gap-2">
            <Label htmlFor="temp-input">{inputLabel}</Label>
            <Input
              id="temp-input"
              inputMode="decimal"
              autoComplete="off"
              placeholder={mode === "c-to-f" ? "e.g. 25" : "e.g. 77"}
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
              <Label className="text-muted-foreground">{output?.label}</Label>
              <p className="mt-1 font-mono text-lg tabular-nums">
                {output ? output.value : "-"}
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
