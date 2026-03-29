export type UnixUnitPreference = "auto" | "s" | "ms";

export interface WallDateTime {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

const MS_MIN = -8640000000000000;
const MS_MAX = 8640000000000000;

export function isValidIanaTimeZone(timeZone: string): boolean {
  if (!timeZone.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function parseUnixTimestampInput(
  raw: string,
  unit: UnixUnitPreference,
):
  | { ok: true; ms: number; unitUsed: "s" | "ms" }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(/^["']|["']$/g, "").replace(/\s+/g, "");
  if (!unquoted) return { ok: false, error: "Enter a Unix timestamp." };
  if (!/^-?\d+(\.\d+)?$/.test(unquoted))
    return {
      ok: false,
      error: "Use digits only (optional minus, optional decimal).",
    };
  const n = Number(unquoted);
  if (!Number.isFinite(n)) return { ok: false, error: "Not a valid number." };
  const intPart = unquoted.split(".")[0]?.replace("-", "") ?? "";
  const digits = intPart.length;
  let asMs: number;
  let used: "s" | "ms";
  if (unit === "s") {
    asMs = Math.trunc(n) * 1000;
    used = "s";
  } else if (unit === "ms") {
    asMs = Math.trunc(n);
    used = "ms";
  } else if (digits > 10) {
    asMs = Math.trunc(n);
    used = "ms";
  } else {
    asMs = Math.trunc(n) * 1000;
    used = "s";
  }
  if (asMs < MS_MIN || asMs > MS_MAX)
    return { ok: false, error: "Timestamp out of supported range." };
  return { ok: true, ms: asMs, unitUsed: used };
}

function createWallPartsReader(
  timeZone: string,
): (utcMs: number) => WallDateTime {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return (utcMs: number) => {
    const parts = f.formatToParts(new Date(utcMs));
    const g = (t: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((p) => p.type === t)?.value ?? NaN);
    return {
      y: g("year"),
      mo: g("month"),
      d: g("day"),
      h: g("hour"),
      mi: g("minute"),
      s: g("second"),
    };
  };
}

function wallPartsAt(utcMs: number, timeZone: string): WallDateTime {
  return createWallPartsReader(timeZone)(utcMs);
}

function compareWall(a: WallDateTime, b: WallDateTime): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.mo !== b.mo) return a.mo - b.mo;
  if (a.d !== b.d) return a.d - b.d;
  if (a.h !== b.h) return a.h - b.h;
  if (a.mi !== b.mi) return a.mi - b.mi;
  return a.s - b.s;
}

/**
 * Interprets wall-clock components as they appear in `timeZone` (IANA), returns UTC epoch ms.
 * Uses a bounded scan so DST oddities do not rely on monotonic binary search.
 */
export function zonedWallTimeToUtcMs(
  target: WallDateTime,
  timeZone: string,
): number | null {
  if (
    !Number.isFinite(target.y) ||
    target.mo < 1 ||
    target.mo > 12 ||
    target.d < 1 ||
    target.d > 31 ||
    target.h < 0 ||
    target.h > 23 ||
    target.mi < 0 ||
    target.mi > 59 ||
    target.s < 0 ||
    target.s > 59
  )
    return null;
  if (!isValidIanaTimeZone(timeZone)) return null;

  const read = createWallPartsReader(timeZone);
  const guess = Date.UTC(
    target.y,
    target.mo - 1,
    target.d,
    target.h,
    target.mi,
    target.s,
  );
  const radius = 72 * 3600000;
  for (let t = guess - radius; t <= guess + radius; t += 60000) {
    const w = read(t);
    if (
      w.y !== target.y ||
      w.mo !== target.mo ||
      w.d !== target.d ||
      w.h !== target.h ||
      w.mi !== target.mi
    )
      continue;
    for (let s = t; s < t + 60000; s += 1000) {
      if (compareWall(read(s), target) === 0) return s;
    }
  }
  return null;
}

export function parseDatetimeLocalValue(value: string): WallDateTime | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value.trim(),
  );
  if (!m) return null;
  return {
    y: Number(m[1]),
    mo: Number(m[2]),
    d: Number(m[3]),
    h: Number(m[4]),
    mi: Number(m[5]),
    s: m[6] ? Number(m[6]) : 0,
  };
}

export interface FormattedUnixInstant {
  seconds: string;
  millis: string;
  utcIso: string;
  inTimeZone: string;
}

export type FormatUnixInstantResult =
  | { ok: true; value: FormattedUnixInstant }
  | { ok: false; error: string };

export function formatUnixInstant(
  ms: number,
  timeZone: string,
  locale: string,
): FormatUnixInstantResult {
  if (ms < MS_MIN || ms > MS_MAX)
    return { ok: false, error: "Timestamp out of supported range." };
  if (!isValidIanaTimeZone(timeZone))
    return { ok: false, error: "Invalid timezone." };
  const d = new Date(ms);
  const loc = locale === "en" ? undefined : locale;
  const inTimeZone = new Intl.DateTimeFormat(loc, {
    timeZone,
    dateStyle: "full",
    timeStyle: "long",
  }).format(d);
  return {
    ok: true,
    value: {
      seconds: String(Math.trunc(ms / 1000)),
      millis: String(Math.trunc(ms)),
      utcIso: d.toISOString(),
      inTimeZone,
    },
  };
}

export function wallInTimeZoneFromUtc(
  ms: number,
  timeZone: string,
): WallDateTime | { ok: false; error: string } {
  if (ms < MS_MIN || ms > MS_MAX)
    return { ok: false, error: "Timestamp out of supported range." };
  if (!isValidIanaTimeZone(timeZone))
    return { ok: false, error: "Invalid timezone." };
  return wallPartsAt(ms, timeZone);
}

export function wallToDatetimeLocalValue(w: WallDateTime): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${w.y}-${pad(w.mo)}-${pad(w.d)}T${pad(w.h)}:${pad(w.mi)}:${pad(w.s)}`;
}
