"use client";

import { Copy, Divide } from "lucide-react";
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
  decimalToFraction,
  formatFractionResult,
  parseFractionOrDecimal,
} from "@/lib/math/simple-converters";

type Mode = "dec-to-frac" | "frac-to-dec";

export function DecimalFractionConverterApp() {
  const [mode, setMode] = React.useState<Mode>("dec-to-frac");
  const [raw, setRaw] = React.useState("");

  const decToFracResult = React.useMemo(() => {
    if (mode !== "dec-to-frac") return null;
    const t = raw.trim();
    if (!t) return { kind: "empty" as const };
    const n = Number(t.replace(",", "."));
    if (!Number.isFinite(n)) {
      return { kind: "error" as const, message: "Enter a valid decimal number." };
    }
    const fr = decimalToFraction(n);
    if (!fr.ok) {
      return { kind: "error" as const, message: fr.message };
    }
    return {
      kind: "ok" as const,
      mixed: formatFractionResult(fr),
      improper: `${fr.improperNumerator}/${fr.improperDenominator}`,
      decimal: String(Math.round(n * 1e12) / 1e12),
    };
  }, [mode, raw]);

  const fracToDecResult = React.useMemo(() => {
    if (mode !== "frac-to-dec") return null;
    const t = raw.trim();
    if (!t) return { kind: "empty" as const };
    const p = parseFractionOrDecimal(t);
    if (!p.ok) {
      return { kind: "error" as const, message: p.message };
    }
    return {
      kind: "ok" as const,
      value: String(Math.round(p.value * 1e12) / 1e12),
    };
  }, [mode, raw]);

  const copyText = React.useMemo(() => {
    if (mode === "dec-to-frac" && decToFracResult?.kind === "ok") {
      return `${decToFracResult.mixed} (${decToFracResult.improper})`;
    }
    if (mode === "frac-to-dec" && fracToDecResult?.kind === "ok") {
      return fracToDecResult.value;
    }
    return null;
  }, [decToFracResult, fracToDecResult, mode]);

  const onCopy = React.useCallback(() => {
    if (!copyText) return;
    void navigator.clipboard.writeText(copyText).then(
      () => toast.success("Copied"),
      () => toast.error("Could not copy"),
    );
  }, [copyText]);

  const errorMessage =
    mode === "dec-to-frac"
      ? decToFracResult?.kind === "error"
        ? decToFracResult.message
        : null
      : fracToDecResult?.kind === "error"
        ? fracToDecResult.message
        : null;

  return (
    <ToolPage>
      <ToolHero
        icon={<Divide className="size-8" aria-hidden />}
        title="Decimal ↔ fraction"
        description={
          <>
            Turn decimals into simplified fractions (and back) locally. Supports mixed numbers like{" "}
            <code className="text-foreground">1 3/4</code>.{" "}
            <span className="mt-2 block text-sm">
              Read guides:{" "}
              <Link
                href="/blog/how-to-convert-decimal-to-fraction"
                className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/90"
              >
                decimal → fraction
              </Link>
              {" "}·{" "}
              <Link
                href="/blog/how-to-convert-fractions-to-decimals"
                className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/90"
              >
                fraction → decimal
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
              if (v === "dec-to-frac" || v === "frac-to-dec") setMode(v);
            }}
            className="justify-start"
            aria-label="Conversion direction"
          >
            <ToggleGroupItem value="dec-to-frac">Decimal → fraction</ToggleGroupItem>
            <ToggleGroupItem value="frac-to-dec">Fraction → decimal</ToggleGroupItem>
          </ToggleGroup>
        </ToolToolbar>

        <ToolPane>
          <ToolPaneTitle>Input</ToolPaneTitle>
          <div className="flex flex-col gap-2">
            <Label htmlFor="df-input">
              {mode === "dec-to-frac" ? "Decimal" : "Fraction or decimal"}
            </Label>
            <Input
              id="df-input"
              inputMode={mode === "dec-to-frac" ? "decimal" : "text"}
              autoComplete="off"
              placeholder={
                mode === "dec-to-frac" ? "e.g. 0.375" : "e.g. 3/4 or 1 3/4"
              }
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
            {errorMessage ? (
              <p className="text-destructive text-sm" role="status">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </ToolPane>

        <ToolPane>
          <ToolPaneTitle>Result</ToolPaneTitle>
          {mode === "dec-to-frac" ? (
            <div className="flex flex-col gap-2">
              {decToFracResult?.kind === "ok" ? (
                <>
                  <div>
                    <Label className="text-muted-foreground">Mixed / readable</Label>
                    <p className="mt-1 font-mono text-lg">{decToFracResult.mixed}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Improper fraction</Label>
                    <p className="mt-1 font-mono text-lg">{decToFracResult.improper}</p>
                  </div>
                </>
              ) : (
                <p className="font-mono text-lg text-muted-foreground">—</p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <p className="min-w-48 flex-1 font-mono text-lg tabular-nums">
                {fracToDecResult?.kind === "ok" ? fracToDecResult.value : "—"}
              </p>
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            disabled={!copyText}
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
