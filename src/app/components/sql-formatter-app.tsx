"use client";

import { Copy, Database, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import type { IndentStyle, KeywordCase, SqlLanguage } from "sql-formatter";
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
  dialectLabel,
  formatSqlString,
  SQL_FORMAT_DIALECT_IDS,
} from "@/lib/text/sql-format";

const indentOptions = [
  { id: "2", width: 2, label: "2 spaces" },
  { id: "4", width: 4, label: "4 spaces" },
] as const;

const keywordCaseOptions = [
  { id: "upper", label: "UPPERCASE" },
  { id: "lower", label: "lowercase" },
  { id: "preserve", label: "Preserve" },
] as const;

const indentStyleOptions = [
  {
    id: "standard",
    label: "Standard",
    hint: "Classic indented blocks",
  },
  {
    id: "tabularLeft",
    label: "Tabular (left)",
    hint: "Aligned clauses (common in analytics)",
  },
  {
    id: "tabularRight",
    label: "Tabular (right)",
    hint: "Right-aligned keywords",
  },
] as const;

export function SqlFormatterApp() {
  const [input, setInput] = React.useState("");
  const [language, setLanguage] = React.useState<SqlLanguage>("postgresql");
  const [indentId, setIndentId] =
    React.useState<(typeof indentOptions)[number]["id"]>("2");
  const [keywordCaseId, setKeywordCaseId] =
    React.useState<(typeof keywordCaseOptions)[number]["id"]>("upper");
  const [indentStyleId, setIndentStyleId] =
    React.useState<(typeof indentStyleOptions)[number]["id"]>("standard");

  const tabWidth = indentOptions.find((o) => o.id === indentId)?.width ?? 2;
  const keywordCase = keywordCaseId as KeywordCase;
  const indentStyle = indentStyleId as IndentStyle;

  const result = React.useMemo(
    () =>
      formatSqlString(input, {
        language,
        tabWidth,
        keywordCase,
        indentStyle,
      }),
    [indentStyle, input, keywordCase, language, tabWidth],
  );

  const output = result.ok ? result.text : "";
  const error = result.ok ? null : (result.error ?? "Could not format SQL");

  const onCopyOutput = React.useCallback(() => {
    void navigator.clipboard.writeText(output).then(
      () => toast.success("Copied formatted SQL"),
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
        icon={<Database className="size-8 md:size-9" aria-hidden />}
        title="SQL formatter"
        description="Pretty-print SQL locally in your browser. Pick your engine for correct quoting and functions, adjust keyword case and layout - read-only output, nothing uploaded."
      />

      <ToolCard>
        <ToolToolbar className="items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-xs">Dialect</Label>
                <Select
                  value={language}
                  onValueChange={(v) => setLanguage(v as SqlLanguage)}
                >
                  <SelectTrigger
                    size="sm"
                    className="min-w-44 max-w-[min(100%,18rem)]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {SQL_FORMAT_DIALECT_IDS.map((id) => (
                      <SelectItem key={id} value={id}>
                        {dialectLabel(id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-xs">Indent</Label>
                <Select
                  value={indentId}
                  onValueChange={(v) =>
                    setIndentId(v as (typeof indentOptions)[number]["id"])
                  }
                >
                  <SelectTrigger size="sm" className="w-30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {indentOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-xs">
                  Keywords
                </Label>
                <Select
                  value={keywordCaseId}
                  onValueChange={(v) =>
                    setKeywordCaseId(
                      v as (typeof keywordCaseOptions)[number]["id"],
                    )
                  }
                >
                  <SelectTrigger size="sm" className="w-38">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {keywordCaseOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-muted-foreground text-xs">Layout</Label>
                <Select
                  value={indentStyleId}
                  onValueChange={(v) =>
                    setIndentStyleId(
                      v as (typeof indentStyleOptions)[number]["id"],
                    )
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="min-w-40 max-w-[min(100%,16rem)]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {indentStyleOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id} title={o.hint}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="max-w-3xl text-muted-foreground text-xs leading-relaxed">
              Uses the{" "}
              <span className="font-medium text-foreground/90">
                sql-formatter
              </span>{" "}
              lexer and parser (not regex-only prettifiers), so nesting and
              strings respect your dialect. This does not execute or validate
              semantics - only layout.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 self-start">
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
              Copy formatted
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
            <ToolPaneTitle>SQL input</ToolPaneTitle>
            <Label htmlFor="sql-input" className="sr-only">
              SQL input
            </Label>
            <Textarea
              id="sql-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`-- Example\nSELECT u.id, COUNT(o.id) AS orders\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nWHERE u.active = TRUE\nGROUP BY u.id\nORDER BY orders DESC\nLIMIT 50;`}
              className={toolEditorClassName()}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />
          </ToolPane>

          <ToolPane>
            <ToolPaneTitle>Formatted SQL (read-only)</ToolPaneTitle>
            <Label htmlFor="sql-output" className="sr-only">
              Formatted SQL output
            </Label>
            <Textarea
              id="sql-output"
              value={output}
              readOnly
              placeholder="Formatted SQL appears here…"
              className={toolEditorClassName("bg-muted/20")}
              spellCheck={false}
              aria-readonly="true"
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
