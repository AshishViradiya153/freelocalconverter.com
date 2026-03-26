"use client";

import * as React from "react";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatJson, minifyJson } from "@/lib/text/json-transform";

interface ModeOption {
  id: "format" | "minify";
  label: string;
}

const modeOptions: ModeOption[] = [
  { id: "format", label: "Format" },
  { id: "minify", label: "Minify" },
];

const spaceOptions = [
  { id: "2", label: "2 spaces" },
  { id: "4", label: "4 spaces" },
  { id: "0", label: "0 (compact)" },
] as const;

export function JsonFormatterApp() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState<ModeOption["id"]>("format");
  const [spaces, setSpaces] = React.useState<(typeof spaceOptions)[number]["id"]>("2");

  const result = React.useMemo(() => {
    if (mode === "minify") return minifyJson(input);
    return formatJson(input, Number.parseInt(spaces, 10));
  }, [input, mode, spaces]);

  const output = result.ok ? result.text : "";
  const error = result.ok ? null : (result.error ?? "Invalid JSON");

  const onCopyOutput = React.useCallback(() => {
    void navigator.clipboard.writeText(output).then(
      () => toast.success("Copied output"),
      () => toast.error("Could not copy"),
    );
  }, [output]);

  const onCopyInput = React.useCallback(() => {
    void navigator.clipboard.writeText(input).then(
      () => toast.success("Copied input"),
      () => toast.error("Could not copy"),
    );
  }, [input]);

  const onClear = React.useCallback(() => {
    setInput("");
    toast.message("Cleared");
  }, []);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
          JSON Formatter
        </h1>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Paste JSON to format or minify it locally in your browser, no uploads.
        </p>
      </header>

      <section className="rounded-xl border bg-background p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Mode</Label>
            <div className="flex items-center gap-1 rounded-md border bg-muted/10 p-1">
              {modeOptions.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  size="sm"
                  variant={mode === m.id ? "secondary" : "ghost"}
                  onClick={() => setMode(m.id)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          <div className={cn("flex items-center gap-2", mode === "minify" && "opacity-50")}>
            <Label className="text-sm">Indent</Label>
            <Select
              value={spaces}
              onValueChange={(v) => setSpaces(v as (typeof spaceOptions)[number]["id"])}
              disabled={mode === "minify"}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spaceOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCopyInput} disabled={!input.trim()}>
              <Copy className="size-4" aria-hidden />
              Copy input
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCopyOutput} disabled={!output.trim()}>
              <Copy className="size-4" aria-hidden />
              Copy output
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClear} disabled={!input.trim()}>
              <Trash2 className="size-4" aria-hidden />
              Clear
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {error ? (
          <p className="mb-3 text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="json-input" className="text-xs uppercase tracking-wide text-muted-foreground">
              Input
            </Label>
            <Textarea
              id="json-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste JSON here, e.g. {"hello":"world"}'
              className="min-h-[280px] font-mono text-xs leading-5 md:min-h-[420px]"
              spellCheck={false}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="json-output" className="text-xs uppercase tracking-wide text-muted-foreground">
              Output
            </Label>
            <Textarea
              id="json-output"
              value={output}
              readOnly
              placeholder="Output will appear here…"
              className="min-h-[280px] font-mono text-xs leading-5 md:min-h-[420px]"
              spellCheck={false}
            />
          </div>
        </div>

        <p className="mt-3 text-muted-foreground text-xs">
          Everything runs locally. Nothing is uploaded.
        </p>
      </section>
    </div>
  );
}

