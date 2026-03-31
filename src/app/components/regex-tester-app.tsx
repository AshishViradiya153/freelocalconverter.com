"use client";

import { Braces, Copy, Info, Regex, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
  ToolToolbar,
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  collectPatternExplainNotes,
  REGEX_FLAG_REFERENCE,
  type RegexFlagState,
  type RegexMatchRow,
  runRegexTest,
} from "@/lib/text/regex-test";
import { cn } from "@/lib/utils";

const monoPreviewClass =
  "max-h-[min(18rem,36vh)] min-h-[8rem] overflow-auto whitespace-pre-wrap wrap-break-word rounded-lg border border-border/80 bg-muted/15 p-3 font-mono text-xs leading-relaxed";

function flagStateFromValues(values: string[]): RegexFlagState {
  const s = new Set(values);
  return {
    global: s.has("g"),
    ignoreCase: s.has("i"),
    multiline: s.has("m"),
    dotAll: s.has("s"),
    unicode: s.has("u"),
    sticky: s.has("y"),
    hasIndices: s.has("d"),
  };
}

function buildHighlightParts(
  subject: string,
  matches: RegexMatchRow[],
): Array<{ text: string; hit: boolean }> {
  const solid = matches.filter((m) => m.end > m.index);
  if (solid.length === 0) {
    return [{ text: subject, hit: false }];
  }
  const sorted = [...solid].sort((a, b) => a.index - b.index);
  const parts: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;
  for (const m of sorted) {
    if (m.index < cursor) continue;
    if (m.index > cursor) {
      parts.push({ text: subject.slice(cursor, m.index), hit: false });
    }
    parts.push({ text: subject.slice(m.index, m.end), hit: true });
    cursor = m.end;
  }
  if (cursor < subject.length) {
    parts.push({ text: subject.slice(cursor), hit: false });
  }
  return parts;
}

const DEFAULT_PATTERN = String.raw`([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})`;
const DEFAULT_SUBJECT = `Contact us:
team@example.com
support@sub.company.co.uk`;

export function RegexTesterApp() {
  const [pattern, setPattern] = React.useState(DEFAULT_PATTERN);
  const [subject, setSubject] = React.useState(DEFAULT_SUBJECT);
  const [flagValues, setFlagValues] = React.useState<string[]>(["g", "m", "u"]);
  const [explainOpen, setExplainOpen] = React.useState(false);

  const flags = React.useMemo(
    () => flagStateFromValues(flagValues),
    [flagValues],
  );

  const result = React.useMemo(
    () => runRegexTest(pattern, subject, flags),
    [pattern, subject, flags],
  );

  const patternNotes = React.useMemo(
    () => collectPatternExplainNotes(pattern, flags),
    [pattern, flags],
  );

  const highlightParts = React.useMemo(() => {
    if (!result.ok) return [];
    return buildHighlightParts(subject, result.matches);
  }, [result, subject]);

  const onCopy = React.useCallback((label: string, text: string) => {
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`Copied ${label}`),
      () => toast.error("Could not copy"),
    );
  }, []);

  const onClear = React.useCallback(() => {
    setPattern("");
    setSubject("");
    toast.message("Cleared");
  }, []);

  return (
    <ToolPage>
      <ToolHero
        icon={<Regex className="size-8 md:size-9" aria-hidden />}
        title="Regex tester"
        description="Try JavaScript (ECMAScript) regular expressions against multiline text. All matching runs locally in your browser. Match count and subject length are capped so pathological patterns are less likely to freeze the tab."
      />

      <ToolCard>
        <ToolToolbar className="items-start justify-between gap-3">
          <p className="max-w-xl text-muted-foreground text-xs leading-relaxed">
            Toggle flags to match your runtime (Node or browser). Use Explain to
            see what each active flag does and quick safety notes for your
            pattern.
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="regex-explain"
                checked={explainOpen}
                onCheckedChange={(v) => setExplainOpen(v === true)}
              />
              <Label
                htmlFor="regex-explain"
                className="cursor-pointer font-normal text-xs"
              >
                Explain
              </Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCopy("pattern", pattern)}
                disabled={!pattern}
              >
                <Copy className="size-4" aria-hidden />
                Copy pattern
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCopy("subject", subject)}
                disabled={!subject}
              >
                <Copy className="size-4" aria-hidden />
                Copy subject
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClear}
                disabled={!pattern && !subject}
              >
                <Trash2 className="size-4" aria-hidden />
                Clear
              </Button>
            </div>
          </div>
        </ToolToolbar>

        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor="regex-pattern" className="text-xs">
            Pattern
          </Label>
          <Input
            id="regex-pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="font-mono text-xs"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            placeholder="e.g. \\b\\w+\\b"
          />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
            Flags
          </span>
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={flagValues}
            onValueChange={(v) => setFlagValues(v)}
            className="flex w-full max-w-3xl flex-wrap justify-start gap-1.5"
          >
            {(
              [
                ["g", "g"],
                ["i", "i"],
                ["m", "m"],
                ["s", "s"],
                ["u", "u"],
                ["y", "y"],
                ["d", "d"],
              ] as const
            ).map(([letter, value]) => (
              <ToggleGroupItem
                key={value}
                value={value}
                aria-label={`Flag ${letter}`}
                className="shrink-0 px-2.5 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/10"
              >
                {letter}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            g global · i ignore case · m multiline · s dotAll · u unicode · y
            sticky · d match indices
          </p>
        </div>

        {explainOpen ? (
          <div className="mt-5 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-start gap-2">
              <Info
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="flex min-w-0 flex-col gap-3">
                <p className="font-medium text-xs">Flag reference</p>
                <ul className="flex flex-col gap-2 text-muted-foreground text-xs leading-relaxed">
                  {REGEX_FLAG_REFERENCE.map((row) => {
                    const on = flagValues.includes(row.letter);
                    return (
                      <li
                        key={row.letter}
                        className={cn(
                          "rounded-md border border-transparent px-2 py-1",
                          on &&
                            "border-primary/25 bg-primary/5 text-foreground",
                        )}
                      >
                        <span className="font-mono text-[11px]">
                          {row.letter}
                        </span>{" "}
                        <span className="font-medium">{row.label}</span>
                        {" - "}
                        {row.description}
                      </li>
                    );
                  })}
                </ul>
                {patternNotes.length > 0 ? (
                  <div>
                    <p className="mb-2 font-medium text-xs">Pattern notes</p>
                    <ul className="list-inside list-disc text-muted-foreground text-xs leading-relaxed">
                      {patternNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <ToolPane>
            <ToolPaneTitle>Subject text</ToolPaneTitle>
            <Label htmlFor="regex-subject" className="sr-only">
              Subject text
            </Label>
            <Textarea
              id="regex-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="min-h-[min(22rem,42vh)] resize-y font-mono text-xs leading-relaxed"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              placeholder="Paste or type the haystack to search…"
            />
          </ToolPane>

          <ToolPane>
            <ToolPaneTitle>Results</ToolPaneTitle>
            {!result.ok ? (
              <div
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-xs leading-relaxed"
                role="alert"
              >
                {result.kind === "syntax"
                  ? "Invalid regular expression: "
                  : null}
                {result.message}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                  <span>
                    <span className="font-medium text-foreground">
                      {result.matchCount}
                    </span>{" "}
                    {result.matchCount === 1 ? "match" : "matches"}
                  </span>
                  <span className="font-mono text-[11px]">
                    /{pattern || "(empty)"}/{result.flagsUsed || " - "}
                  </span>
                  {result.subjectWasTruncated ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      Subject truncated for safety
                    </span>
                  ) : null}
                  {result.matchesTruncated ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      Match list capped (see limits in library)
                    </span>
                  ) : null}
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] text-muted-foreground uppercase tracking-wide">
                    Highlighted
                  </p>
                  <div className={monoPreviewClass}>
                    {highlightParts.length === 0 ? (
                      <span className="text-muted-foreground">
                        No non-empty matches to highlight.
                      </span>
                    ) : (
                      highlightParts.map((part, i) =>
                        part.hit ? (
                          <mark
                            key={i}
                            className="bg-amber-200/90 text-foreground dark:bg-amber-500/30"
                          >
                            {part.text}
                          </mark>
                        ) : (
                          <span key={i}>{part.text}</span>
                        ),
                      )
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 font-mono text-[11px]">
                          #
                        </TableHead>
                        <TableHead className="font-mono text-[11px]">
                          index
                        </TableHead>
                        <TableHead className="min-w-[8rem] font-mono text-[11px]">
                          match
                        </TableHead>
                        <TableHead className="min-w-[10rem] font-mono text-[11px]">
                          groups
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.matches.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-muted-foreground text-xs"
                          >
                            No matches.
                          </TableCell>
                        </TableRow>
                      ) : (
                        result.matches.map((m, idx) => (
                          <TableRow key={`${m.index}-${idx}`}>
                            <TableCell className="font-mono text-[11px] text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-mono text-[11px]">
                              {m.index}
                              {m.end > m.index ? `–${m.end}` : ""}
                            </TableCell>
                            <TableCell className="max-w-[14rem] truncate font-mono text-[11px]">
                              <span title={m.match}>
                                {m.match.length === 0 ? "∅" : m.match}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-[11px] leading-snug">
                              {m.captures.length === 0 &&
                              Object.keys(m.named).length === 0
                                ? " - "
                                : null}
                              {m.captures.some(Boolean) ? (
                                <span className="wrap-break-word block">
                                  [
                                  {m.captures
                                    .map((c, i) => `${i + 1}:${c || "∅"}`)
                                    .join(", ")}
                                  ]
                                </span>
                              ) : null}
                              {Object.keys(m.named).length > 0 ? (
                                <span className="wrap-break-word mt-1 block text-muted-foreground">
                                  {Object.entries(m.named)
                                    .map(([k, v]) => `${k}=${v || "∅"}`)
                                    .join(", ")}
                                </span>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {flags.hasIndices &&
                result.matches.some((m) => m.indexRanges) ? (
                  <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/10 p-3 text-xs">
                    <Braces
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <p className="text-muted-foreground leading-relaxed">
                      The d flag is on: full match and capture index pairs are
                      available to the engine as{" "}
                      <span className="font-mono text-foreground">
                        match.indices
                      </span>
                      . This table shows character offsets in the subject
                      string.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </ToolPane>
        </div>
      </ToolCard>
    </ToolPage>
  );
}
