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
import {
  jsonStringToYaml,
  yamlStringToJson,
  yamlStringToMinifiedJson,
} from "@/lib/text/json-yaml-transform";

type Direction = "json-to-yaml" | "yaml-to-json";

const yamlIndentOptions = [
  { id: "2", label: "2 spaces" },
  { id: "4", label: "4 spaces" },
] as const;

const jsonSpaceOptions = [
  { id: "2", label: "2 spaces" },
  { id: "4", label: "4 spaces" },
  { id: "0", label: "0 (minify)" },
] as const;

export function JsonYamlConverterApp() {
  const [input, setInput] = React.useState("");
  const [direction, setDirection] = React.useState<Direction>("json-to-yaml");
  const [yamlIndent, setYamlIndent] =
    React.useState<(typeof yamlIndentOptions)[number]["id"]>("2");
  const [jsonSpaces, setJsonSpaces] =
    React.useState<(typeof jsonSpaceOptions)[number]["id"]>("2");

  const result = React.useMemo(() => {
    if (direction === "json-to-yaml") {
      return jsonStringToYaml(input, Number.parseInt(yamlIndent, 10));
    }
    if (jsonSpaces === "0") return yamlStringToMinifiedJson(input);
    return yamlStringToJson(input, Number.parseInt(jsonSpaces, 10));
  }, [direction, input, jsonSpaces, yamlIndent]);

  const output = result.ok ? result.text : "";
  const error = result.ok ? null : (result.error ?? "Conversion failed");

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

  const inputLabel = direction === "json-to-yaml" ? "JSON input" : "YAML input";
  const outputLabel =
    direction === "json-to-yaml" ? "YAML output" : "JSON output";
  const inputPlaceholder =
    direction === "json-to-yaml"
      ? 'Paste JSON, e.g. {"service":"api","port":8080}'
      : "Paste YAML, e.g.\nservice: api\nport: 8080";

  return (
    <ToolPage>
      <ToolHero
        title="JSON YAML converter"
        description="Convert between JSON and YAML locally in your browser—handy for Kubernetes, CI configs, and API specs—with no uploads."
      />

      <ToolCard>
        <ToolToolbar>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm">Direction</Label>
            <div className="flex items-center gap-1 rounded-md border bg-muted/10 p-1">
              <Button
                type="button"
                size="sm"
                variant={direction === "json-to-yaml" ? "secondary" : "ghost"}
                onClick={() => setDirection("json-to-yaml")}
              >
                JSON → YAML
              </Button>
              <Button
                type="button"
                size="sm"
                variant={direction === "yaml-to-json" ? "secondary" : "ghost"}
                onClick={() => setDirection("yaml-to-json")}
              >
                YAML → JSON
              </Button>
            </div>
          </div>

          {direction === "json-to-yaml" ? (
            <div className="flex items-center gap-2">
              <Label className="text-sm">YAML indent</Label>
              <Select
                value={yamlIndent}
                onValueChange={(v) =>
                  setYamlIndent(v as (typeof yamlIndentOptions)[number]["id"])
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yamlIndentOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Label className="text-sm">JSON</Label>
              <Select
                value={jsonSpaces}
                onValueChange={(v) =>
                  setJsonSpaces(v as (typeof jsonSpaceOptions)[number]["id"])
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jsonSpaceOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
          <p
            className="wrap-break-word mb-3 text-destructive text-sm"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <ToolPane>
            <ToolPaneTitle>{inputLabel}</ToolPaneTitle>
            <Label htmlFor="jy-input" className="sr-only">
              {inputLabel}
            </Label>
            <Textarea
              id="jy-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              className={toolEditorClassName()}
              spellCheck={false}
            />
          </ToolPane>

          <ToolPane>
            <ToolPaneTitle>{outputLabel}</ToolPaneTitle>
            <Label htmlFor="jy-output" className="sr-only">
              {outputLabel}
            </Label>
            <Textarea
              id="jy-output"
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
