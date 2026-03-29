"use client";

import { BookOpen, Copy, Trash2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import {
  htmlToMarkdown,
  MARKDOWN_HTML_MAX_INPUT_CHARS,
  markdownToSafeHtml,
  sanitizeToolHtml,
} from "@/lib/text/markdown-html-transform";
import { cn } from "@/lib/utils";

type Direction = "markdown-to-html" | "html-to-markdown";
type MdHtmlOutputTab = "html-source" | "preview";
type HtmlInputTab = "code" | "rendered";

const previewSurfaceClass =
  "max-h-[min(58vh,520px)] min-h-[200px] overflow-auto rounded-md border border-border/80 bg-muted/15 px-4 py-3 text-[15px] leading-relaxed text-foreground " +
  "[&_a]:break-words [&_a]:text-primary [&_a]:underline " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground " +
  "[&_code]:rounded [&_code]:bg-muted/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] " +
  "[&_h1]:mt-4 [&_h1]:border-border [&_h1]:border-b [&_h1]:pb-2 [&_h1]:font-semibold [&_h1]:text-2xl [&_h1]:tracking-tight " +
  "[&_h2]:mt-4 [&_h2]:font-semibold [&_h2]:text-xl " +
  "[&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-lg " +
  "[&_img]:max-w-full [&_img]:rounded-md " +
  "[&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 " +
  "[&_p]:my-2 " +
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted/50 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs " +
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm " +
  "[&_td]:border [&_td]:border-border/80 [&_td]:px-2 [&_td]:py-1.5 " +
  "[&_th]:border [&_th]:border-border/80 [&_th]:bg-muted/40 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium " +
  "[&_hr]:my-6 [&_hr]:border-border";

export function MarkdownHtmlConverterApp() {
  const [input, setInput] = React.useState("");
  const [direction, setDirection] =
    React.useState<Direction>("markdown-to-html");
  const [mdHtmlTab, setMdHtmlTab] =
    React.useState<MdHtmlOutputTab>("html-source");
  const [htmlInputTab, setHtmlInputTab] = React.useState<HtmlInputTab>("code");

  const conversion = React.useMemo(() => {
    if (direction === "markdown-to-html") {
      return markdownToSafeHtml(input);
    }
    return htmlToMarkdown(input);
  }, [direction, input]);

  const outputText = conversion.ok ? conversion.text : "";
  const error = conversion.ok
    ? null
    : (conversion.error ?? "Conversion failed");

  const htmlForPreview = React.useMemo(() => {
    if (direction === "markdown-to-html") return outputText;
    return sanitizeToolHtml(input);
  }, [direction, input, outputText]);

  const markdownPreviewHtml = React.useMemo(() => {
    if (direction !== "html-to-markdown" || !outputText.trim()) return "";
    const r = markdownToSafeHtml(outputText);
    return r.ok ? r.text : "";
  }, [direction, outputText]);

  const onCopyOutput = React.useCallback(() => {
    void navigator.clipboard.writeText(outputText).then(
      () => toast.success("Copied output"),
      () => toast.error("Could not copy"),
    );
  }, [outputText]);

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

  const inputTooLarge = input.length > MARKDOWN_HTML_MAX_INPUT_CHARS;

  const inputLabel = direction === "markdown-to-html" ? "Markdown" : "HTML";
  const outputLabel = direction === "markdown-to-html" ? "HTML" : "Markdown";

  const inputPlaceholder =
    direction === "markdown-to-html"
      ? "# Heading\n\nPaste **Markdown** here. GFM tables from our [CSV → Markdown](/csv-to-markdown-table) tool render below."
      : "<section>\n  <h1>Title</h1>\n  <p>Paste HTML fragments or full documents.</p>\n</section>";

  const inputId =
    direction === "markdown-to-html" ? "mh-markdown-in" : "mh-html-in";

  return (
    <ToolPage>
      <ToolHero
        icon={<BookOpen className="size-8 md:size-9" aria-hidden />}
        title="Markdown HTML converter"
        description={
          <>
            Convert between Markdown and HTML locally with GitHub-flavored
            Markdown (tables, task lists, strikethrough). Use live preview to
            check formatting - ideal after generating tables with our{" "}
            <Link
              href="/csv-to-markdown-table"
              className="text-primary underline underline-offset-2"
            >
              CSV to Markdown
            </Link>{" "}
            tool. Output HTML is sanitized for safe preview and copy.
          </>
        }
      />

      <ToolCard>
        <ToolToolbar>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm">Direction</Label>
            <div className="flex items-center gap-1 rounded-md border bg-muted/10 p-1">
              <Button
                type="button"
                size="sm"
                variant={
                  direction === "markdown-to-html" ? "secondary" : "ghost"
                }
                onClick={() => {
                  setDirection("markdown-to-html");
                  setMdHtmlTab("html-source");
                }}
              >
                Markdown → HTML
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  direction === "html-to-markdown" ? "secondary" : "ghost"
                }
                onClick={() => {
                  setDirection("html-to-markdown");
                  setHtmlInputTab("code");
                }}
              >
                HTML → Markdown
              </Button>
            </div>
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
              disabled={!outputText.trim() || Boolean(error)}
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

        {inputTooLarge ? (
          <p className="mb-3 text-destructive text-sm" role="alert">
            Input exceeds {MARKDOWN_HTML_MAX_INPUT_CHARS.toLocaleString()}{" "}
            characters. Trim the text to continue.
          </p>
        ) : null}

        {error && !inputTooLarge ? (
          <p
            className="wrap-break-word mb-3 text-destructive text-sm"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <ToolPane>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ToolPaneTitle>{inputLabel}</ToolPaneTitle>
              {direction === "html-to-markdown" ? (
                <div className="flex items-center gap-1 rounded-md border bg-muted/10 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={htmlInputTab === "code" ? "secondary" : "ghost"}
                    onClick={() => setHtmlInputTab("code")}
                  >
                    Source
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      htmlInputTab === "rendered" ? "secondary" : "ghost"
                    }
                    onClick={() => setHtmlInputTab("rendered")}
                  >
                    Rendered
                  </Button>
                </div>
              ) : null}
            </div>
            <Label htmlFor={inputId} className="sr-only">
              {inputLabel} input
            </Label>
            {direction === "html-to-markdown" && htmlInputTab === "rendered" ? (
              <div
                className={cn(previewSurfaceClass, "min-h-[280px]")}
                // Sanitized HTML from user input for visual check only
                dangerouslySetInnerHTML={{ __html: htmlForPreview }}
              />
            ) : (
              <Textarea
                id={inputId}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={inputPlaceholder}
                className={toolEditorClassName()}
                spellCheck={false}
              />
            )}
          </ToolPane>

          <ToolPane>
            {direction === "markdown-to-html" ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ToolPaneTitle>HTML output</ToolPaneTitle>
                <div className="flex items-center gap-1 rounded-md border bg-muted/10 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      mdHtmlTab === "html-source" ? "secondary" : "ghost"
                    }
                    onClick={() => setMdHtmlTab("html-source")}
                  >
                    Source
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mdHtmlTab === "preview" ? "secondary" : "ghost"}
                    onClick={() => setMdHtmlTab("preview")}
                  >
                    Live preview
                  </Button>
                </div>
              </div>
            ) : (
              <ToolPaneTitle>{outputLabel} output</ToolPaneTitle>
            )}

            {direction === "markdown-to-html" && mdHtmlTab === "preview" ? (
              <div
                className={cn(previewSurfaceClass, "min-h-[280px]")}
                dangerouslySetInnerHTML={{
                  __html: error || inputTooLarge ? "" : htmlForPreview,
                }}
              />
            ) : (
              <>
                <Label
                  htmlFor="mh-output"
                  className="sr-only"
                >{`${outputLabel} output`}</Label>
                <Textarea
                  id="mh-output"
                  value={error || inputTooLarge ? "" : outputText}
                  readOnly
                  placeholder="Output will appear here…"
                  className={toolEditorClassName("bg-muted/20")}
                  spellCheck={false}
                />
              </>
            )}

            {direction === "html-to-markdown" &&
            outputText.trim() &&
            !error &&
            !inputTooLarge ? (
              <div className="flex flex-col gap-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
                  Rendered Markdown
                </p>
                <div
                  className={cn(previewSurfaceClass, "min-h-[160px]")}
                  dangerouslySetInnerHTML={{ __html: markdownPreviewHtml }}
                />
              </div>
            ) : null}
          </ToolPane>
        </div>

        <p className="mt-3 text-muted-foreground text-xs">
          Parsing uses Marked (GFM) and Turndown with the GFM plugin. Preview
          HTML is sanitized. Everything runs locally; nothing is uploaded.
        </p>
      </ToolCard>
    </ToolPage>
  );
}
