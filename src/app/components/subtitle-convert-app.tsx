"use client";

import { Download, FileText, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/download-blob";

type SubtitleFormat = "srt" | "vtt";

function normalizeNewlines(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function detectFormatFromName(name: string): SubtitleFormat | null {
  if (name.toLowerCase().endsWith(".srt")) return "srt";
  if (name.toLowerCase().endsWith(".vtt")) return "vtt";
  return null;
}

function baseNameFromFileName(name: string) {
  const leaf = name.replace(/\.[a-z0-9]+$/i, "");
  return leaf || "subtitles";
}

function srtToVtt(raw: string) {
  const text = normalizeNewlines(raw).trim();
  // Remove BOM if present, then convert commas in timestamps to dots.
  const noBom = text.replace(/^\uFEFF/, "");
  const body = noBom.replace(
    /(\d{2}:\d{2}:\d{2}),(\d{3})\s-->\s(\d{2}:\d{2}:\d{2}),(\d{3})/g,
    "$1.$2 --> $3.$4",
  );
  return `WEBVTT\n\n${body}\n`;
}

function vttToSrt(raw: string) {
  const text = normalizeNewlines(raw).trim().replace(/^\uFEFF/, "");
  const withoutHeader = text.replace(/^WEBVTT[^\n]*\n+/i, "");
  // Convert dots in timestamps to commas; keep cue text as-is.
  const body = withoutHeader.replace(
    /(\d{2}:\d{2}:\d{2})\.(\d{3})\s-->\s(\d{2}:\d{2}:\d{2})\.(\d{3})/g,
    "$1,$2 --> $3,$4",
  );
  return `${body.trim()}\n`;
}

function convertSubtitles(input: string, from: SubtitleFormat, to: SubtitleFormat) {
  if (from === to) return normalizeNewlines(input);
  if (from === "srt" && to === "vtt") return srtToVtt(input);
  return vttToSrt(input);
}

export function SubtitleConvertApp() {
  const [from, setFrom] = React.useState<SubtitleFormat>("srt");
  const [to, setTo] = React.useState<SubtitleFormat>("vtt");
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [sourceName, setSourceName] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      setOutput(convertSubtitles(input, from, to));
    } catch (e) {
      setOutput("");
    }
  }, [from, input, to]);

  const onClear = React.useCallback(() => {
    setInput("");
    setOutput("");
    setSourceName(null);
  }, []);

  const onFiles = React.useCallback(async (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (!file) return;
    const guessed = detectFormatFromName(file.name);
    if (!guessed) {
      toast.error("Upload a .srt or .vtt file.");
      return;
    }
    const text = await file.text();
    setSourceName(file.name);
    setFrom(guessed);
    setTo(guessed === "srt" ? "vtt" : "srt");
    setInput(text);
    toast.success(`Loaded: ${file.name}`);
  }, []);

  const downloadName = React.useMemo(() => {
    const base = sourceName ? baseNameFromFileName(sourceName) : "subtitles";
    return `${base}.${to}`;
  }, [sourceName, to]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <FileText className="size-5" aria-hidden />
          </div>
          <h1 className={toolHeroTitleClassName}>SRT to VTT converter</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Convert subtitles locally in your browser: SRT ⇄ WebVTT. No uploads to
          our servers.
        </p>
      </header>

      <div className="grid gap-4 rounded-xl border bg-background p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-sm">From</Label>
            <Select value={from} onValueChange={(v) => setFrom(v as SubtitleFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="srt">SRT (.srt)</SelectItem>
                <SelectItem value="vtt">WebVTT (.vtt)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-sm">To</Label>
            <Select value={to} onValueChange={(v) => setTo(v as SubtitleFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vtt">WebVTT (.vtt)</SelectItem>
                <SelectItem value="srt">SRT (.srt)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <FileDropZone
          inputId="subtitle-convert-input"
          accept=".srt,.vtt,text/vtt,text/plain"
          multiple={false}
          disabled={false}
          busy={false}
          onFiles={onFiles}
          fileIcon={({ className, "aria-hidden": ariaHidden }) => (
            <FileText className={className} aria-hidden={ariaHidden} />
          )}
          dropTitle="Drop a .srt or .vtt file here, or click to browse"
          dropHint="Local-only conversion"
          chooseLabel="Choose subtitle file"
          fileHint="Your subtitle file stays on this device."
          size="sm"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm">Input</Label>
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="size-4" aria-hidden />
              Clear
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            placeholder={"Paste subtitles here…"}
            spellCheck={false}
          />
        </section>

        <section className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm">Output</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!output.trim()}
                onClick={() => {
                  if (!output.trim()) return;
                  downloadBlob(
                    new Blob([output], { type: "text/plain;charset=utf-8" }),
                    downloadName,
                  );
                }}
              >
                <Download className="size-4" aria-hidden />
                Download
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setOutput("")}
                aria-label="Clear output"
                disabled={!output}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
          <Textarea value={output} readOnly rows={14} spellCheck={false} />
          <div className="text-muted-foreground text-xs">
            Tip: VTT supports cue settings and styling; this converter preserves
            cue text and basic timestamps.
          </div>
        </section>
      </div>
    </div>
  );
}

