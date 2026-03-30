"use client";

import { Copy, Download, Mail, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
  ToolSectionHeading,
  ToolToolbar,
  toolEditorClassName,
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { htmlEmailToText } from "@/lib/text/html-email-to-text";
import { cn } from "@/lib/utils";

function downloadTextFile(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function HtmlToTextEmailApp() {
  const [html, setHtml] = React.useState("");
  const [includeLinks, setIncludeLinks] = React.useState(true);
  const [collapseWhitespace, setCollapseWhitespace] = React.useState(true);
  const [maxBlankLines, setMaxBlankLines] = React.useState(1);

  const output = React.useMemo(() => {
    if (!html.trim()) return "";
    return htmlEmailToText(html, {
      includeLinks,
      collapseWhitespace,
      maxBlankLines,
    });
  }, [collapseWhitespace, html, includeLinks, maxBlankLines]);

  const onCopyOutput = React.useCallback(() => {
    if (!output.trim()) {
      toast.error("Nothing to copy yet.");
      return;
    }
    void navigator.clipboard.writeText(output.trimEnd()).then(
      () => toast.success("Copied output"),
      () => toast.error("Could not copy"),
    );
  }, [output]);

  const onDownload = React.useCallback(() => {
    if (!output.trim()) {
      toast.error("Nothing to download yet.");
      return;
    }
    downloadTextFile(output.trimEnd() + "\n", "email.txt");
    toast.success("Download started");
  }, [output]);

  const onClear = React.useCallback(() => {
    setHtml("");
    toast.message("Cleared");
  }, []);

  return (
    <ToolPage>
      <ToolHero
        icon={<Mail className="size-8 md:size-9" aria-hidden />}
        title="HTML to Text Email Converter"
        description="Paste HTML email markup and generate a clean plain-text version for multipart emails. Runs locally in your browser; nothing is uploaded."
      />

      <ToolCard>
        <ToolToolbar className="flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end items-start">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hte-links"
                checked={includeLinks}
                onCheckedChange={(c) => setIncludeLinks(c === true)}
              />
              <Label htmlFor="hte-links" className="font-normal">
                Keep link URLs
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hte-collapse"
                checked={collapseWhitespace}
                onCheckedChange={(c) => setCollapseWhitespace(c === true)}
              />
              <Label htmlFor="hte-collapse" className="font-normal">
                Collapse whitespace
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="hte-blank" className="font-normal">
                Max blank lines
              </Label>
              <input
                id="hte-blank"
                type="number"
                min={0}
                max={5}
                value={maxBlankLines}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  setMaxBlankLines(Math.max(0, Math.min(5, Math.floor(n))));
                }}
                className="h-9 w-16 rounded-md border bg-background px-2 text-sm"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCopyOutput}>
              <Copy className="size-4" aria-hidden />
              Copy text
            </Button>
            <Button type="button" variant="default" size="sm" onClick={onDownload}>
              <Download className="size-4" aria-hidden />
              Download .txt
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="size-4" aria-hidden />
              Clear
            </Button>
          </div>
        </ToolToolbar>

        <Separator className="my-6" />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <ToolSectionHeading>HTML input</ToolSectionHeading>
            <Label htmlFor="hte-in" className="sr-only">
              HTML input
            </Label>
            <Textarea
              id="hte-in"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={`<table>\n  <tr><td><strong>Hello</strong> there</td></tr>\n</table>`}
              className={cn("min-h-[min(22rem,52vh)] resize-y", toolEditorClassName)}
              spellCheck={false}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <ToolSectionHeading>Plain text output</ToolSectionHeading>
            <Label htmlFor="hte-out" className="sr-only">
              Plain text output
            </Label>
            <Textarea
              id="hte-out"
              readOnly
              value={output}
              placeholder="Output appears here."
              className={cn(
                "min-h-[min(22rem,52vh)] resize-y font-mono text-xs leading-relaxed md:text-sm",
              )}
              spellCheck={false}
            />
            <p className="text-muted-foreground text-xs">
              Tip: include this text as the <code className="rounded bg-muted px-1">text/plain</code>{" "}
              part of a multipart/alternative email.
            </p>
          </div>
        </div>
      </ToolCard>

      <ToolPane>
        <ToolPaneTitle>Notes</ToolPaneTitle>
        <ul className="list-inside list-disc text-muted-foreground text-sm leading-relaxed">
          <li>
            Uses your browser’s <strong className="text-foreground">DOMParser</strong>{" "}
            to extract text (no network).
          </li>
          <li>
            This is a best-effort conversion; complex layouts may need minor manual edits.
          </li>
        </ul>
      </ToolPane>
    </ToolPage>
  );
}

