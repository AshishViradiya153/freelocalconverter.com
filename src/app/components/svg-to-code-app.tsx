"use client";

import { Braces, Copy, FileCode2, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";

import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
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
import { type SvgToCodeMode, svgToCode } from "@/lib/svg/svg-to-code";

const modeOptions: { id: SvgToCodeMode; label: string; hint: string }[] = [
  {
    id: "jsx",
    label: "JSX",
    hint: "React/TSX-friendly markup (camelCase attributes).",
  },
  {
    id: "react",
    label: "React component",
    hint: "Adds SVGProps spread so you can override className, aria-*, etc.",
  },
  {
    id: "pretty",
    label: "Pretty XML",
    hint: "Indented SVG source with XML declaration.",
  },
];

function FileCodeGlyph(props: { className?: string; "aria-hidden"?: boolean }) {
  return (
    <FileCode2 className={props.className} aria-hidden={props["aria-hidden"]} />
  );
}

export function SvgToCodeApp() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState<SvgToCodeMode>("jsx");
  const [componentName, setComponentName] = React.useState("SvgIcon");
  const [fileName, setFileName] = React.useState<string | null>(null);

  const result = React.useMemo(
    () => svgToCode(input, { mode, componentName }),
    [input, mode, componentName],
  );

  const output = result.ok ? result.text : "";
  const error = result.ok ? null : result.error;

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
    setFileName(null);
    toast.message("Cleared");
  }, []);

  const onFiles = React.useCallback((files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (f.type !== "image/svg+xml" && !/\.svg$/i.test(f.name)) {
      toast.error("Please choose an .svg file.");
      return;
    }
    void f.text().then(
      (text) => {
        setInput(text);
        setFileName(f.name);
        toast.success("Loaded SVG");
      },
      () => toast.error("Could not read file"),
    );
  }, []);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <Braces className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className={toolHeroTitleClassName}>SVG to code</h1>
          </div>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Turn SVG markup into JSX, a typed React component, or pretty-printed
          XML. Paste below or drop a file; everything stays in your browser.
        </p>
      </header>

      <FileDropZone
        disabled={false}
        busy={false}
        inputId="svg-to-code-input"
        accept="image/svg+xml,.svg"
        multiple={false}
        onFiles={onFiles}
        fileIcon={FileCodeGlyph}
        fileName={fileName}
        dropTitle="Drop an SVG file here or click to browse"
        dropHint="Paste works too · local-only"
        chooseLabel="Choose SVG"
        chooseLabelWhenFileSelected="Replace file"
        fileHint="Reads UTF-8 text from .svg; no uploads."
        size="sm"
      />

      <section className="rounded-xl border bg-background p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="grid min-w-[200px] gap-2">
            <Label className="text-sm">Output</Label>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as SvgToCodeMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {modeOptions.find((m) => m.id === mode)?.hint}
            </p>
          </div>

          {mode === "react" ? (
            <div className="grid min-w-[200px] flex-1 gap-2 lg:max-w-sm">
              <Label htmlFor="svg-component-name" className="text-sm">
                Component name
              </Label>
              <Input
                id="svg-component-name"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="SvgIcon"
                autoComplete="off"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 lg:ml-auto">
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
        </div>

        <Separator className="my-4" />

        {error ? (
          <p className="mb-3 text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <Label
              htmlFor="svg-input"
              className="text-muted-foreground text-xs uppercase tracking-wide"
            >
              SVG input
            </Label>
            <Textarea
              id="svg-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setFileName(null);
              }}
              placeholder='Paste SVG, e.g. <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">…</svg>'
              className="min-h-[280px] font-mono text-xs leading-5 md:min-h-[420px]"
              spellCheck={false}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <Label
              htmlFor="svg-output"
              className="text-muted-foreground text-xs uppercase tracking-wide"
            >
              Code output
            </Label>
            <Textarea
              id="svg-output"
              value={output}
              readOnly
              placeholder="Code will appear here…"
              className="min-h-[280px] font-mono text-xs leading-5 md:min-h-[420px]"
              spellCheck={false}
            />
          </div>
        </div>

        <p className="mt-3 text-muted-foreground text-xs">
          JSX mode rewrites attributes like class → className and stroke-width →
          strokeWidth. This is not automatic vectorization of raster images.
        </p>
      </section>
    </div>
  );
}
