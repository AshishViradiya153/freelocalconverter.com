"use client";

import { Copy, Orbit } from "lucide-react";
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
  degreesToRadians,
  radiansToDegrees,
} from "@/lib/math/simple-converters";

type Mode = "deg-to-rad" | "rad-to-deg";

function formatAngle(n: number): string {
  return String(Math.round(n * 1e12) / 1e12);
}

export function DegreesRadiansConverterApp() {
  const [mode, setMode] = React.useState<Mode>("deg-to-rad");
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
    if (mode === "deg-to-rad") {
      return {
        label: "Radians",
        value: formatAngle(degreesToRadians(parsed.value)),
      };
    }
    return {
      label: "Degrees",
      value: formatAngle(radiansToDegrees(parsed.value)),
    };
  }, [mode, parsed]);

  const inputLabel = mode === "deg-to-rad" ? "Degrees (°)" : "Radians";

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
        icon={<Orbit className="size-8" aria-hidden />}
        title="Degrees ↔ radians"
        description={
          <>
            Convert angle units for trig and geometry. π radians equals 180°.{" "}
            <span className="mt-2 block text-sm">
              Read the guide:{" "}
              <Link
                href="/blog/how-to-convert-degrees-to-radians"
                className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/90"
              >
                how to convert degrees to radians
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
              if (v === "deg-to-rad" || v === "rad-to-deg") setMode(v);
            }}
            className="justify-start"
            aria-label="Conversion direction"
          >
            <ToggleGroupItem value="deg-to-rad">Degrees → radians</ToggleGroupItem>
            <ToggleGroupItem value="rad-to-deg">Radians → degrees</ToggleGroupItem>
          </ToggleGroup>
        </ToolToolbar>

        <ToolPane>
          <ToolPaneTitle>Input</ToolPaneTitle>
          <div className="flex flex-col gap-2">
            <Label htmlFor="angle-input">{inputLabel}</Label>
            <Input
              id="angle-input"
              inputMode="decimal"
              autoComplete="off"
              placeholder={mode === "deg-to-rad" ? "e.g. 90" : "e.g. 1.5707963267948966"}
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
                {output ? output.value : "—"}
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
