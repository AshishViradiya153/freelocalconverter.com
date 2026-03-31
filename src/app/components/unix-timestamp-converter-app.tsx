"use client";

import { Check, ChevronsUpDown, Clock, Copy, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  formatUnixInstant,
  parseDatetimeLocalValue,
  parseUnixTimestampInput,
  type UnixUnitPreference,
  zonedWallTimeToUtcMs,
} from "@/lib/text/unix-timestamp-convert";
import { cn } from "@/lib/utils";

const TZ_STORAGE = "FreeLocalConverter.unix-ts.tz";

type Mode = "unix-to-date" | "date-to-unix";

function getTimeZoneOptions(): string[] {
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      return Intl.supportedValuesOf("timeZone").sort((a, b) =>
        a.localeCompare(b),
      );
    }
  } catch {
    /* noop */
  }
  return ["UTC"];
}

export function UnixTimestampConverterApp() {
  const locale = useLocale();
  const timeZones = React.useMemo(() => getTimeZoneOptions(), []);

  const [timeZone, setTimeZone] = React.useState("UTC");
  const [tzOpen, setTzOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(TZ_STORAGE);
      if (stored && timeZones.includes(stored)) {
        setTimeZone(stored);
        return;
      }
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && timeZones.includes(tz)) setTimeZone(tz);
    } catch {
      /* noop */
    }
  }, [timeZones]);

  const onTimeZoneChange = React.useCallback((tz: string) => {
    setTimeZone(tz);
    setTzOpen(false);
    try {
      localStorage.setItem(TZ_STORAGE, tz);
    } catch {
      /* noop */
    }
  }, []);

  const [mode, setMode] = React.useState<Mode>("unix-to-date");
  const [unixInput, setUnixInput] = React.useState("");
  const [unit, setUnit] = React.useState<UnixUnitPreference>("auto");
  const [humanWall, setHumanWall] = React.useState("");

  const parsedUnix = React.useMemo(
    () => parseUnixTimestampInput(unixInput, unit),
    [unixInput, unit],
  );

  const formatted = React.useMemo(() => {
    if (!parsedUnix.ok) return null;
    return formatUnixInstant(parsedUnix.ms, timeZone, locale);
  }, [parsedUnix, timeZone, locale]);

  const humanToUnix = React.useMemo(() => {
    if (mode !== "date-to-unix") return null;
    const wall = parseDatetimeLocalValue(humanWall);
    if (!wall)
      return {
        ok: false as const,
        error:
          "Use YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss (wall time in the selected timezone).",
      };
    const ms = zonedWallTimeToUtcMs(wall, timeZone);
    if (ms === null)
      return {
        ok: false as const,
        error:
          "Could not resolve that instant in this timezone (invalid local time or ambiguous DST).",
      };
    return { ok: true as const, ms };
  }, [mode, humanWall, timeZone]);

  const formattedHuman = React.useMemo(() => {
    if (!humanToUnix?.ok) return null;
    return formatUnixInstant(humanToUnix.ms, timeZone, locale);
  }, [humanToUnix, timeZone, locale]);

  const onCopy = React.useCallback((label: string, text: string) => {
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`Copied ${label}`),
      () => toast.error("Could not copy"),
    );
  }, []);

  const onNow = React.useCallback(() => {
    const ms = Date.now();
    const asS = String(Math.floor(ms / 1000));
    const asMs = String(ms);
    if (unit === "ms" || (unit === "auto" && asMs.length > 10)) {
      setUnixInput(asMs);
    } else {
      setUnixInput(asS);
    }
    toast.message("Inserted current time");
  }, [unit]);

  const onClear = React.useCallback(() => {
    setUnixInput("");
    toast.message("Cleared");
  }, []);

  return (
    <ToolPage>
      <ToolHero
        icon={<Clock className="size-8 md:size-9" aria-hidden />}
        title="Unix timestamp converter"
        description="Convert Unix epoch seconds or milliseconds to human dates and back, with IANA timezones. Everything runs locally in your browser; nothing is uploaded."
      />
      <ToolCard>
        <ToolToolbar className="flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm">Mode</Label>
            <div className="flex flex-wrap gap-1 rounded-md border bg-muted/10 p-1">
              <Button
                type="button"
                size="sm"
                variant={mode === "unix-to-date" ? "secondary" : "ghost"}
                onClick={() => setMode("unix-to-date")}
              >
                Unix → date
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "date-to-unix" ? "secondary" : "ghost"}
                onClick={() => setMode("date-to-unix")}
              >
                Date → Unix
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label className="shrink-0 text-sm">Timezone</Label>
            <Popover open={tzOpen} onOpenChange={setTzOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-[min(100%,280px)] justify-between font-normal"
                  aria-expanded={tzOpen}
                >
                  <span className="truncate">{timeZone}</span>
                  <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(100vw-2rem,320px)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search timezone…" />
                  <CommandList>
                    <CommandEmpty>No timezone found.</CommandEmpty>
                    <CommandGroup className="max-h-[280px] overflow-y-auto">
                      {timeZones.map((tz) => (
                        <CommandItem
                          key={tz}
                          value={tz}
                          onSelect={() => onTimeZoneChange(tz)}
                        >
                          <Check
                            className={cn(
                              "size-4 shrink-0",
                              timeZone === tz ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="truncate">{tz}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {mode === "unix-to-date" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm">Unit</Label>
              <div className="flex flex-wrap gap-1 rounded-md border bg-muted/10 p-1">
                {(
                  [
                    ["auto", "Auto"],
                    ["s", "Seconds"],
                    ["ms", "Milliseconds"],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={unit === id ? "secondary" : "ghost"}
                    onClick={() => setUnit(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 md:ml-auto">
            {mode === "unix-to-date" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onNow}
                >
                  Now
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClear}
                  disabled={!unixInput.trim()}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Clear
                </Button>
              </>
            ) : null}
          </div>
        </ToolToolbar>

        <Separator className="my-4" />

        {mode === "unix-to-date" ? (
          <>
            <Label htmlFor="unix-input" className="font-medium text-sm">
              Unix timestamp
            </Label>
            <Input
              id="unix-input"
              className="mt-1 max-w-xl font-mono text-sm"
              value={unixInput}
              onChange={(e) => setUnixInput(e.target.value)}
              placeholder="1700000000 or 1700000000123"
              spellCheck={false}
              autoComplete="off"
            />
            {!parsedUnix.ok && unixInput.trim() ? (
              <p className="mt-2 text-destructive text-sm" role="alert">
                {parsedUnix.error}
              </p>
            ) : null}
            {parsedUnix.ok && formatted && !formatted.ok ? (
              <p className="mt-2 text-destructive text-sm" role="alert">
                {formatted.error}
              </p>
            ) : null}
            {parsedUnix.ok && formatted?.ok ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ToolPane>
                  <ToolPaneTitle>Selected timezone</ToolPaneTitle>
                  <p className="text-sm leading-relaxed">
                    {formatted.value.inTimeZone}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8"
                    onClick={() =>
                      onCopy("local time", formatted.value.inTimeZone)
                    }
                  >
                    <Copy className="size-4" aria-hidden />
                    Copy
                  </Button>
                </ToolPane>
                <ToolPane>
                  <ToolPaneTitle>UTC and raw</ToolPaneTitle>
                  <dl className="grid gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground text-xs">UTC ISO</dt>
                      <dd className="wrap-break-word font-mono text-xs">
                        {formatted.value.utcIso}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Seconds</dt>
                      <dd className="font-mono text-xs">
                        {formatted.value.seconds}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">
                        Milliseconds
                      </dt>
                      <dd className="font-mono text-xs">
                        {formatted.value.millis}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => onCopy("UTC ISO", formatted.value.utcIso)}
                    >
                      <Copy className="size-4" aria-hidden />
                      ISO
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => onCopy("seconds", formatted.value.seconds)}
                    >
                      <Copy className="size-4" aria-hidden />
                      Seconds
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        onCopy("milliseconds", formatted.value.millis)
                      }
                    >
                      <Copy className="size-4" aria-hidden />
                      Ms
                    </Button>
                  </div>
                </ToolPane>
              </div>
            ) : null}
            {!unixInput.trim() ? (
              <p className="mt-3 text-muted-foreground text-sm">
                Enter a Unix epoch value. With Auto, values with more than 10
                digits are treated as milliseconds; shorter values as seconds.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              Enter the wall-clock date and time as it appears in the selected
              IANA timezone (not your device timezone).
            </p>
            <Label htmlFor="human-wall" className="mt-3 font-medium text-sm">
              Wall time in {timeZone}
            </Label>
            <Input
              id="human-wall"
              className="mt-1 max-w-md font-mono text-sm"
              value={humanWall}
              onChange={(e) => setHumanWall(e.target.value)}
              placeholder="2024-06-01T12:00:00"
              spellCheck={false}
              autoComplete="off"
            />
            {humanToUnix && !humanToUnix.ok && humanWall.trim() ? (
              <p className="mt-2 text-destructive text-sm" role="alert">
                {humanToUnix.error}
              </p>
            ) : null}
            {formattedHuman?.ok ? (
              <div className="mt-4 space-y-2 rounded-xl border border-border/70 bg-muted/10 p-4">
                <p className="font-medium text-sm">Unix time</p>
                <p className="font-mono text-sm">
                  Seconds: {formattedHuman.value.seconds}
                </p>
                <p className="font-mono text-sm">
                  Milliseconds: {formattedHuman.value.millis}
                </p>
                <p className="wrap-break-word font-mono text-muted-foreground text-xs">
                  UTC: {formattedHuman.value.utcIso}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onCopy("seconds", formattedHuman.value.seconds)
                    }
                  >
                    <Copy className="size-4" aria-hidden />
                    Copy seconds
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onCopy("milliseconds", formattedHuman.value.millis)
                    }
                  >
                    <Copy className="size-4" aria-hidden />
                    Copy ms
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}

        <p className="mt-4 text-muted-foreground text-xs">
          Everything runs locally. Nothing is uploaded.
        </p>
      </ToolCard>
    </ToolPage>
  );
}
