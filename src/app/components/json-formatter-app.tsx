"use client";

import { Copy, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
  ToolToolbar,
  toolEditorClassName,
} from "@/components/tool-ui";
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
import { formatJson, minifyJson } from "@/lib/text/json-transform";
import { cn } from "@/lib/utils";

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
  const [spaces, setSpaces] =
    React.useState<(typeof spaceOptions)[number]["id"]>("2");

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
    <ToolPage>
      <ToolHero
        title="JSON Formatter"
        description="Paste JSON to format or minify it locally in your browser, with a consistent split workspace and no uploads."
      />

      <ToolCard>
        <ToolToolbar>
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

          <div
            className={cn(
              "flex items-center gap-2",
              mode === "minify" && "opacity-50",
            )}
          >
            <Label className="text-sm">Indent</Label>
            <Select
              value={spaces}
              onValueChange={(v) =>
                setSpaces(v as (typeof spaceOptions)[number]["id"])
              }
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopyInput}
              disabled={!input.trim()}
            >
              <Copy className="size-4" aria-hidden />
              Copy input
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopyOutput}
              disabled={!output.trim()}
            >
              <Copy className="size-4" aria-hidden />
              Copy output
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={!input.trim()}
            >
              <Trash2 className="size-4" aria-hidden />
              Clear
            </Button>
          </div>
        </ToolToolbar>

        <Separator className="my-4" />

        {error ? (
          <p className="mb-3 text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <ToolPane>
            <ToolPaneTitle>Input</ToolPaneTitle>
            <Label htmlFor="json-input" className="sr-only">
              Input
            </Label>
            <Textarea
              id="json-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste JSON here, e.g. {"hello":"world"}'
              className={toolEditorClassName()}
              spellCheck={false}
            />
          </ToolPane>

          <ToolPane>
            <ToolPaneTitle>Output</ToolPaneTitle>
            <Label htmlFor="json-output" className="sr-only">
              Output
            </Label>
            <Textarea
              id="json-output"
              value={output}
              readOnly
              placeholder="Output will appear here…"
              className={toolEditorClassName("bg-muted/20")}
              spellCheck={false}
            />
          </ToolPane>
        </div>

        <p className="mt-3 text-muted-foreground text-xs">
          Everything runs locally. Nothing is uploaded.
        </p>
      </ToolCard>
    </ToolPage>
  );
}
