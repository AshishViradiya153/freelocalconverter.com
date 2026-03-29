"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import {
  type Content,
  createJSONEditor,
  isJSONContent,
  type JsonEditor,
  Mode,
} from "vanilla-jsoneditor";
import "vanilla-jsoneditor/themes/jse-theme-dark.css";
import { cn } from "@/lib/utils";

function parseJsonTextToContent(text: string): Content {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { text };
  }
  try {
    return { json: JSON.parse(text) as unknown };
  } catch {
    return { text };
  }
}

function contentToJsonText(content: Content): string {
  if (isJSONContent(content)) {
    return `${JSON.stringify(content.json, null, 2)}\n`;
  }
  return content.text;
}

interface CsvJsonEditorPanelProps {
  jsonText: string;
  /** Increment when `jsonText` was replaced from outside the editor (load, apply, reset, format). */
  contentRevision: number;
  onJsonTextChange: (text: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function CsvJsonEditorPanel({
  jsonText,
  contentRevision,
  onJsonTextChange,
  className,
  ariaLabel,
}: CsvJsonEditorPanelProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<JsonEditor | null>(null);
  const suppressOnChangeRef = React.useRef(false);
  const lastRevisionRef = React.useRef(contentRevision);
  const { resolvedTheme } = useTheme();

  const onJsonTextChangeRef = React.useRef(onJsonTextChange);
  onJsonTextChangeRef.current = onJsonTextChange;

  React.useEffect(() => {
    const target = containerRef.current;
    if (!target) {
      return;
    }

    const editor = createJSONEditor({
      target,
      props: {
        content: parseJsonTextToContent(jsonText),
        mode: Mode.tree,
        mainMenuBar: true,
        navigationBar: true,
        statusBar: true,
        askToFormat: true,
        onChange: (content: Content) => {
          if (suppressOnChangeRef.current) return;
          onJsonTextChangeRef.current(contentToJsonText(content));
        },
      },
    });
    editorRef.current = editor;
    lastRevisionRef.current = contentRevision;

    return () => {
      void editor.destroy();
      editorRef.current = null;
    };
  }, [contentRevision, jsonText]);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (lastRevisionRef.current === contentRevision) return;
    lastRevisionRef.current = contentRevision;
    suppressOnChangeRef.current = true;
    editor.updateProps({ content: parseJsonTextToContent(jsonText) });
    queueMicrotask(() => {
      suppressOnChangeRef.current = false;
    });
  }, [contentRevision, jsonText]);

  return (
    <div
      role="region"
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden rounded-md border border-border bg-background",
        resolvedTheme === "dark" && "jse-theme-dark",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div
        ref={containerRef}
        className="h-[min(560px,62svh)] min-h-[280px] w-full md:min-h-[360px]"
      />
    </div>
  );
}
