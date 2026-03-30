"use client";

import { Copy, Fingerprint, RefreshCw, Trash2 } from "lucide-react";
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
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  formatUuidBulk,
  generateUuid,
  UUID_VERSION_LABELS,
  type UuidBulkSeparator,
  type UuidVersion,
} from "@/lib/text/uuid-generate";
import { cn } from "@/lib/utils";

const MAX_COUNT = 5000;

const separatorOptions: { id: UuidBulkSeparator; label: string }[] = [
  { id: "newline", label: "One per line" },
  { id: "comma", label: "Comma" },
  { id: "comma-space", label: "Comma + space" },
  { id: "json", label: "JSON array" },
];

function clampCount(raw: number): number {
  if (!Number.isFinite(raw) || raw < 1) return 1;
  if (raw > MAX_COUNT) return MAX_COUNT;
  return Math.floor(raw);
}

function formatUuidLine(
  canonical: string,
  opts: { uppercase: boolean; hyphens: boolean; braces: boolean },
): string {
  let s = opts.uppercase ? canonical.toUpperCase() : canonical;
  if (!opts.hyphens) s = s.replace(/-/g, "");
  if (opts.braces) s = `{${s}}`;
  return s;
}

export function UuidGeneratorApp() {
  const [version, setVersion] = React.useState<UuidVersion>("v4");
  const [countInput, setCountInput] = React.useState("10");
  const [uppercase, setUppercase] = React.useState(false);
  const [hyphens, setHyphens] = React.useState(true);
  const [braces, setBraces] = React.useState(false);
  const [separator, setSeparator] =
    React.useState<UuidBulkSeparator>("newline");
  const [canonicalBatch, setCanonicalBatch] = React.useState<string[]>([]);

  const displayLines = React.useMemo(
    () =>
      canonicalBatch.map((u) =>
        formatUuidLine(u, { uppercase, hyphens, braces }),
      ),
    [canonicalBatch, uppercase, hyphens, braces],
  );

  const bulkText = React.useMemo(
    () => formatUuidBulk(displayLines, separator),
    [displayLines, separator],
  );

  const onGenerate = React.useCallback(() => {
    const n = clampCount(Number.parseInt(countInput, 10));
    if (
      countInput.trim() === "" ||
      !Number.isFinite(Number.parseInt(countInput, 10))
    ) {
      toast.error("Enter a valid count between 1 and 5000.");
      return;
    }
    const next: string[] = [];
    for (let i = 0; i < n; i++) {
      next.push(generateUuid(version, { uppercase: false }));
    }
    setCanonicalBatch(next);
    toast.success(`Generated ${n} ${n === 1 ? "ID" : "IDs"}`);
  }, [countInput, version]);

  const onCopyAll = React.useCallback(() => {
    if (!bulkText.trim()) {
      toast.error("Nothing to copy yet.");
      return;
    }
    void navigator.clipboard.writeText(bulkText.trimEnd()).then(
      () => toast.success("Copied output"),
      () => toast.error("Could not copy"),
    );
  }, [bulkText]);

  const onClear = React.useCallback(() => {
    setCanonicalBatch([]);
    toast.message("Cleared");
  }, []);

  return (
    <ToolPage>
      <ToolHero
        icon={<Fingerprint className="size-8 md:size-9" aria-hidden />}
        title="UUID / GUID generator"
        description="Create RFC 4122 v1 and v4 identifiers, RFC 9562 v7 time-ordered UUIDs, or the nil UUID—in bulk for fixtures and tests. Random bytes come from your browser (Web Crypto); nothing is uploaded."
      />

      <ToolCard>
        <ToolToolbar className="flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end items-start">
            <div className="flex min-w-[min(100%,220px)] flex-col gap-2">
              <Label htmlFor="uuid-version">Version</Label>
              <Select
                value={version}
                onValueChange={(v) => setVersion(v as UuidVersion)}
              >
                <SelectTrigger id="uuid-version" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "v4",
                      "v7",
                      "v1",
                      "nil",
                    ] as const satisfies readonly UuidVersion[]
                  ).map((v) => (
                    <SelectItem key={v} value={v}>
                      {UUID_VERSION_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-full min-w-[min(100%,140px)] max-w-[200px] flex-col gap-2">
              <Label htmlFor="uuid-count">Count</Label>
              <Input
                id="uuid-count"
                inputMode="numeric"
                type="number"
                min={1}
                max={MAX_COUNT}
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Max {MAX_COUNT.toLocaleString()} per run.
              </p>
            </div>

            <div className="flex min-w-[min(100%,200px)] flex-col gap-2">
              <Label htmlFor="uuid-separator">Bulk format</Label>
              <Select
                value={separator}
                onValueChange={(v) => setSeparator(v as UuidBulkSeparator)}
              >
                <SelectTrigger id="uuid-separator" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {separatorOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onGenerate}>
              <RefreshCw className="size-4" aria-hidden />
              Generate
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopyAll}
              disabled={!canonicalBatch.length}
            >
              <Copy className="size-4" aria-hidden />
              Copy all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={!canonicalBatch.length}
            >
              <Trash2 className="size-4" aria-hidden />
              Clear
            </Button>
          </div>
        </ToolToolbar>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              id="uuid-upper"
              checked={uppercase}
              onCheckedChange={(c) => setUppercase(c === true)}
            />
            <Label htmlFor="uuid-upper" className="font-normal">
              Uppercase hex
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="uuid-hyphens"
              checked={hyphens}
              onCheckedChange={(c) => setHyphens(c === true)}
            />
            <Label htmlFor="uuid-hyphens" className="font-normal">
              Hyphens (8-4-4-4-12)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="uuid-braces"
              checked={braces}
              onCheckedChange={(c) => setBraces(c === true)}
            />
            <Label htmlFor="uuid-braces" className="font-normal">
              Wrap in {"{}"} (GUID style)
            </Label>
          </div>
        </div>

        <Separator className="my-6" />

        <ToolSectionHeading>Output</ToolSectionHeading>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
          v4 and v7 are suitable for opaque IDs; v1 uses a MAC-free random node
          and clock sequence. Toggle formatting without re-rolling random
          values. This batch:{" "}
          <span className="font-medium text-foreground">
            {canonicalBatch.length.toLocaleString()}
          </span>{" "}
          {canonicalBatch.length === 1 ? "ID" : "IDs"}.
        </p>

        <Label htmlFor="uuid-output" className="sr-only">
          Generated UUIDs
        </Label>
        <Textarea
          id="uuid-output"
          readOnly
          value={bulkText}
          placeholder='Click "Generate" to create UUIDs. Example v4: 550e8400-e29b-41d4-a716-446655440000'
          className={cn(
            "mt-3 min-h-[min(22rem,45vh)] resize-y font-mono text-xs leading-relaxed md:text-sm",
          )}
          spellCheck={false}
        />
      </ToolCard>

      <ToolPane>
        <ToolPaneTitle>Reference</ToolPaneTitle>
        <ul className="list-inside list-disc text-muted-foreground text-sm leading-relaxed">
          <li>
            <strong className="text-foreground">v4</strong> — Random (RFC 4122
            variant 4).
          </li>
          <li>
            <strong className="text-foreground">v7</strong> — Unix ms in the
            first 48 bits, then random (RFC 9562).
          </li>
          <li>
            <strong className="text-foreground">v1</strong> — Gregorian
            timestamp + random clock and node (RFC 4122); not guaranteed
            globally unique without a real MAC.
          </li>
          <li>
            <strong className="text-foreground">Nil</strong> — All zeros; useful
            as a sentinel in tests.
          </li>
        </ul>
      </ToolPane>
    </ToolPage>
  );
}
