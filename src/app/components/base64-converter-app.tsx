"use client";

import { Copy, Download, FileUp, Layers, Trash2 } from "lucide-react";
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
  bytesToBase64,
  bytesToHexPreview,
  decodeBase64,
  utf8StringToBase64,
} from "@/lib/text/base64-transform";
import { cn } from "@/lib/utils";

type Mode = "encode" | "decode";
type Source = "text" | "file";

const lineOptions = [
  { id: "0", label: "Single line", width: 0 },
  { id: "64", label: "Wrap 64 (PEM-style)", width: 64 },
  { id: "76", label: "Wrap 76 (MIME-style)", width: 76 },
] as const;

const HEX_COPY_MAX_BYTES = 4096;

function downloadUint8Array(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Base64ConverterApp() {
  const [mode, setMode] = React.useState<Mode>("encode");
  const [source, setSource] = React.useState<Source>("text");
  const [urlSafe, setUrlSafe] = React.useState(false);
  const [lineId, setLineId] =
    React.useState<(typeof lineOptions)[number]["id"]>("0");
  const lineWidth = lineOptions.find((o) => o.id === lineId)?.width ?? 0;

  const [textInput, setTextInput] = React.useState("");
  const [encodeFileBytes, setEncodeFileBytes] =
    React.useState<Uint8Array | null>(null);
  const [encodeFileName, setEncodeFileName] = React.useState<string | null>(
    null,
  );
  const [decodeFileName, setDecodeFileName] = React.useState<string | null>(
    null,
  );
  const [isReadingFile, setIsReadingFile] = React.useState(false);

  const encodeInputRef = React.useRef<HTMLInputElement>(null);
  const decodeInputRef = React.useRef<HTMLInputElement>(null);

  const formatOpts = React.useMemo(
    () => ({ urlSafe, lineWidth }),
    [urlSafe, lineWidth],
  );

  const encodedOutput = React.useMemo(() => {
    if (mode !== "encode") return "";
    if (source === "file") {
      if (!encodeFileBytes || isReadingFile) return "";
      return bytesToBase64(encodeFileBytes, formatOpts);
    }
    if (!textInput) return "";
    return utf8StringToBase64(textInput, formatOpts);
  }, [encodeFileBytes, formatOpts, isReadingFile, mode, source, textInput]);

  const decodeResult = React.useMemo(() => {
    if (mode !== "decode") return null;
    return decodeBase64(textInput, urlSafe);
  }, [mode, textInput, urlSafe]);

  const onPickEncodeFile = React.useCallback((list: FileList | null) => {
    const file = list?.[0];
    setEncodeFileName(file?.name ?? null);
    setEncodeFileBytes(null);
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) {
      toast.error("File is larger than 40 MB; try a smaller file.");
      return;
    }
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result;
      if (buf instanceof ArrayBuffer) {
        setEncodeFileBytes(new Uint8Array(buf));
      }
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      toast.error("Could not read file");
      setIsReadingFile(false);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onPickDecodeFile = React.useCallback((list: FileList | null) => {
    const file = list?.[0];
    setDecodeFileName(file?.name ?? null);
    if (!file) {
      setTextInput("");
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      toast.error("File is larger than 40 MB; try a smaller file.");
      return;
    }
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const t = reader.result;
      setTextInput(typeof t === "string" ? t : "");
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      toast.error("Could not read file");
      setIsReadingFile(false);
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const onCopyHex = React.useCallback(() => {
    if (!decodeResult?.ok || decodeResult.utf8Text !== null) return;
    const hex = bytesToHexPreview(
      decodeResult.bytes,
      Math.min(decodeResult.bytes.length, HEX_COPY_MAX_BYTES),
    );
    void navigator.clipboard.writeText(hex).then(
      () =>
        toast.success(
          decodeResult.bytes.length > HEX_COPY_MAX_BYTES
            ? `Copied hex (first ${HEX_COPY_MAX_BYTES} bytes)`
            : "Copied hex",
        ),
      () => toast.error("Could not copy"),
    );
  }, [decodeResult]);

  const onClear = React.useCallback(() => {
    setTextInput("");
    setEncodeFileBytes(null);
    setEncodeFileName(null);
    setDecodeFileName(null);
    if (encodeInputRef.current) encodeInputRef.current.value = "";
    if (decodeInputRef.current) decodeInputRef.current.value = "";
    toast.message("Cleared");
  }, []);

  React.useEffect(() => {
    if (mode === "decode" && source === "file") {
      setEncodeFileBytes(null);
      setEncodeFileName(null);
    }
    if (mode === "encode" && source === "file") {
      setDecodeFileName(null);
    }
  }, [mode, source]);

  const inputLabel =
    mode === "encode"
      ? source === "text"
        ? "Text to encode (UTF-8)"
        : "File to encode (raw bytes)"
      : source === "text"
        ? "Base64 to decode"
        : "File containing Base64 text";

  const showLineWrap = mode === "encode";

  return (
    <ToolPage>
      <ToolHero
        icon={<Layers className="size-8 md:size-9" aria-hidden />}
        title="Base64 encoder & decoder"
        description="Encode UTF-8 text or any file to Base64, or decode Base64 back to text or a downloadable binary — all locally in your browser. Whitespace in pasted Base64 is ignored; optional URL-safe (Base64URL) output."
      />

      <ToolCard>
        <ToolToolbar className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm">Mode</Label>
              <div className="flex gap-1 rounded-md border bg-muted/10 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "encode" ? "secondary" : "ghost"}
                  onClick={() => setMode("encode")}
                >
                  Encode
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "decode" ? "secondary" : "ghost"}
                  onClick={() => setMode("decode")}
                >
                  Decode
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm">Input</Label>
              <div className="flex gap-1 rounded-md border bg-muted/10 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={source === "text" ? "secondary" : "ghost"}
                  onClick={() => setSource("text")}
                >
                  Text
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={source === "file" ? "secondary" : "ghost"}
                  onClick={() => setSource("file")}
                >
                  File
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={urlSafe ? "secondary" : "outline"}
                onClick={() => setUrlSafe((v) => !v)}
                aria-pressed={urlSafe}
              >
                URL-safe (Base64URL)
              </Button>
              {showLineWrap ? (
                <>
                  <Label htmlFor="b64-wrap" className="sr-only">
                    Line wrapping
                  </Label>
                  <Select
                    value={lineId}
                    onValueChange={(v) =>
                      setLineId(v as (typeof lineOptions)[number]["id"])
                    }
                  >
                    <SelectTrigger
                      id="b64-wrap"
                      size="sm"
                      className="w-[200px]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lineOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : null}
            </div>
          </div>
        </ToolToolbar>

        <input
          ref={encodeInputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => onPickEncodeFile(e.target.files)}
        />
        <input
          ref={decodeInputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          accept=".txt,.b64,.pem,.crt,.key,text/plain"
          onChange={(e) => onPickDecodeFile(e.target.files)}
        />

        <div className="mt-4 flex flex-col gap-3">
          {source === "text" ? (
            <>
              <Label htmlFor="b64-text-in" className="text-sm">
                {inputLabel}
              </Label>
              <Textarea
                id="b64-text-in"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  mode === "encode"
                    ? "Type or paste UTF-8 text…"
                    : "Paste Base64 (newlines and spaces are OK)…"
                }
                className={toolEditorClassName("min-h-48")}
                spellCheck={false}
                disabled={isReadingFile}
              />
            </>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-border/80 border-dashed bg-muted/10 p-4">
              <ToolPaneTitle>File</ToolPaneTitle>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {mode === "encode"
                  ? "Reads raw bytes (any file type). For text sources, prefer the Text tab so UTF-8 is encoded correctly."
                  : "Loads the file as UTF-8 text (typical for .b64, .pem). Strip PEM headers manually if needed."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isReadingFile}
                  onClick={() =>
                    mode === "encode"
                      ? encodeInputRef.current?.click()
                      : decodeInputRef.current?.click()
                  }
                >
                  <FileUp className="size-4" aria-hidden />
                  {isReadingFile ? "Reading…" : "Choose file"}
                </Button>
                {mode === "encode" && encodeFileName ? (
                  <span className="wrap-break-word text-muted-foreground text-xs">
                    {encodeFileName} (
                    {encodeFileBytes
                      ? `${(encodeFileBytes.length / 1024).toFixed(1)} KB`
                      : "…"}
                    )
                  </span>
                ) : null}
                {mode === "decode" && decodeFileName ? (
                  <span className="wrap-break-word text-muted-foreground text-xs">
                    {decodeFileName}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-5" />

        <div className="flex flex-wrap items-center gap-2">
          {mode === "encode" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!encodedOutput.trim()}
              onClick={() => {
                void navigator.clipboard.writeText(encodedOutput).then(
                  () => toast.success("Copied Base64"),
                  () => toast.error("Could not copy"),
                );
              }}
            >
              <Copy className="size-4" aria-hidden />
              Copy Base64
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!decodeResult?.ok || decodeResult.utf8Text === null}
              onClick={() => {
                const t = decodeResult?.ok ? decodeResult.utf8Text : null;
                if (!t) return;
                void navigator.clipboard.writeText(t).then(
                  () => toast.success("Copied decoded text"),
                  () => toast.error("Could not copy"),
                );
              }}
            >
              <Copy className="size-4" aria-hidden />
              Copy decoded text
            </Button>
          )}
          {mode === "decode" &&
          decodeResult?.ok &&
          decodeResult.utf8Text === null ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCopyHex}
              >
                <Copy className="size-4" aria-hidden />
                Copy hex preview
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  downloadUint8Array(decodeResult.bytes, "decoded.bin")
                }
              >
                <Download className="size-4" aria-hidden />
                Download .bin
              </Button>
            </>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            <Trash2 className="size-4" aria-hidden />
            Clear
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Label className="text-sm">
            {mode === "encode" ? "Base64 output" : "Decoded output"}
          </Label>
          {mode === "encode" ? (
            <Textarea
              readOnly
              value={encodedOutput}
              placeholder={
                isReadingFile ? "Reading file…" : "Output will appear here…"
              }
              className={toolEditorClassName("min-h-48 bg-muted/20")}
              spellCheck={false}
            />
          ) : decodeResult && !decodeResult.ok ? (
            <p
              className="wrap-break-word text-destructive text-sm"
              role="alert"
            >
              {decodeResult.error}
            </p>
          ) : decodeResult?.ok && decodeResult.utf8Text !== null ? (
            <Textarea
              readOnly
              value={decodeResult.utf8Text}
              className={toolEditorClassName("min-h-48 bg-muted/20")}
              spellCheck={false}
            />
          ) : decodeResult?.ok ? (
            <div
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-400/25 dark:bg-amber-400/10",
              )}
            >
              <p className="font-medium text-sm">
                Binary output (not valid UTF-8)
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Length: {decodeResult.bytes.length} bytes. Download the raw
                bytes or copy a hex preview.
              </p>
              <pre
                className={cn(
                  "wrap-break-word max-h-40 overflow-auto rounded-lg border bg-muted/20 p-3 font-mono text-xs",
                )}
              >
                {bytesToHexPreview(decodeResult.bytes, 256)}
              </pre>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Switch to Decode and provide Base64 to see text or binary results.
            </p>
          )}
        </div>

        <p className="mt-4 text-muted-foreground text-xs leading-relaxed">
          Everything runs locally. Nothing is uploaded. For secrets, prefer
          offline tools; this page does not log your input.
        </p>
      </ToolCard>
    </ToolPage>
  );
}
