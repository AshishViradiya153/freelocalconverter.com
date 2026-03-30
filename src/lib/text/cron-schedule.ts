/**
 * Standard 5-field cron (minute hour day-of-month month day-of-week).
 * Semantics follow common Vixie/cronie behavior: when both DOM and DOW are
 * restricted (not *), a date matches if either field matches (OR).
 * Runs at second 0 of each matching minute. All matching uses the chosen
 * calendar (local wall time or UTC), not a fixed offset - DST transitions are
 * handled by the native Date API.
 */

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const DOW_NAMES: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export interface ParsedCron {
  /** Sorted unique minute values 0–59 */
  minutes: readonly number[];
  /** Sorted unique hour values 0–23 */
  hours: readonly number[];
  /** Sorted unique day-of-month 1–31 */
  daysOfMonth: readonly number[];
  /** Sorted unique month 1–12 */
  months: readonly number[];
  /** Sorted unique day-of-week 0–6 (0 = Sunday); 7 normalized to 0 */
  daysOfWeek: readonly number[];
  /** True if DOM field was * or ? */
  domUnrestricted: boolean;
  /** True if DOW field was * or ? */
  dowUnrestricted: boolean;
  /** Normalized 5-field string (single spaces) */
  normalized: string;
}

export type ParseCronResult =
  | { ok: true; cron: ParsedCron }
  | { ok: false; error: string };

export type HumanToCronResult =
  | { ok: true; cron: string }
  | { ok: false; error: string };

function sortUnique(nums: number[]): number[] {
  return [...new Set(nums)].sort((a, b) => a - b);
}

function parseIntStrict(s: string): number | null {
  const t = s.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function expandRange(
  start: number,
  end: number,
  step: number,
  min: number,
  max: number,
  field: string,
): number[] {
  if (step < 1) throw new Error(`${field}: step must be >= 1`);
  if (start < min || start > max || end < min || end > max) {
    throw new Error(`${field}: value out of range ${min}-${max}`);
  }
  const out: number[] = [];
  for (let v = start; v <= end; v += step) out.push(v);
  return out;
}

function parseAtom(
  atom: string,
  min: number,
  max: number,
  field: string,
  nameMap?: Record<string, number>,
): number[] {
  const a = atom.trim().toLowerCase();
  if (a === "" || a === "*" || a === "?") {
    return expandRange(min, max, 1, min, max, field);
  }

  const stepParts = a.split("/");
  const base = stepParts[0] ?? "";
  const step = stepParts.length === 1 ? 1 : parseIntStrict(stepParts[1] ?? "");
  if (step === null || stepParts.length > 2) {
    throw new Error(`${field}: invalid step syntax`);
  }

  let rangeStart = min;
  let rangeEnd = max;

  if (base !== "*") {
    const hyphen = base.indexOf("-");
    if (hyphen === -1) {
      let v: number | null = null;
      const fromMap = nameMap?.[base];
      if (fromMap !== undefined) v = fromMap;
      else v = parseIntStrict(base);
      if (v === null) throw new Error(`${field}: invalid value "${atom}"`);
      if (v < min || v > max) throw new Error(`${field}: ${v} out of range`);
      rangeStart = rangeEnd = v;
    } else {
      const left = base.slice(0, hyphen).trim();
      const right = base.slice(hyphen + 1).trim();
      let lo: number | null = null;
      let hi: number | null = null;
      const loNamed = nameMap?.[left];
      if (loNamed !== undefined) lo = loNamed;
      else lo = parseIntStrict(left);
      const hiNamed = nameMap?.[right];
      if (hiNamed !== undefined) hi = hiNamed;
      else hi = parseIntStrict(right);
      if (lo === null || hi === null) {
        throw new Error(`${field}: invalid range "${atom}"`);
      }
      if (lo < min || hi > max || lo > hi) {
        throw new Error(`${field}: invalid range ${lo}-${hi}`);
      }
      rangeStart = lo;
      rangeEnd = hi;
    }
  }

  return expandRange(rangeStart, rangeEnd, step, min, max, field);
}

function parseField(
  raw: string,
  min: number,
  max: number,
  label: string,
  nameMap?: Record<string, number>,
): number[] {
  const parts = raw.split(",");
  const acc: number[] = [];
  for (const p of parts) {
    const sub = p.trim();
    if (!sub) throw new Error(`${label}: empty list entry`);
    acc.push(...parseAtom(sub, min, max, label, nameMap));
  }
  return sortUnique(acc);
}

const ALIAS_LINE = /^(@[a-z]+)\s*$/i;

function expandMacros(line: string): string | null {
  const m = line.match(ALIAS_LINE);
  if (!m?.[1]) return null;
  switch (m[1].toLowerCase()) {
    case "@yearly":
    case "@annually":
      return "0 0 1 1 *";
    case "@monthly":
      return "0 0 1 * *";
    case "@weekly":
      return "0 0 * * 0";
    case "@daily":
    case "@midnight":
      return "0 0 * * *";
    case "@hourly":
      return "0 * * * *";
    default:
      return null;
  }
}

function isDomOrDowUnrestricted(field: string): boolean {
  const t = field.trim();
  return t === "*" || t === "?";
}

function fieldToCronToken(
  values: readonly number[],
  min: number,
  max: number,
): string {
  if (values.length === max - min + 1) return "*";
  return values.join(",");
}

export function parseCronExpression(raw: string): ParseCronResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Empty expression" };

  const macro = expandMacros(trimmed);
  const line = macro ?? trimmed;
  const fields = line.split(/\s+/).filter(Boolean);
  if (fields.length !== 5) {
    return {
      ok: false,
      error: "Expected 5 fields: minute hour day-of-month month day-of-week",
    };
  }

  const minF = fields[0];
  const hourF = fields[1];
  const domF = fields[2];
  const monF = fields[3];
  const dowF = fields[4];
  if (
    minF === undefined ||
    hourF === undefined ||
    domF === undefined ||
    monF === undefined ||
    dowF === undefined
  ) {
    return {
      ok: false,
      error: "Expected 5 fields: minute hour day-of-month month day-of-week",
    };
  }

  try {
    const minutes = parseField(minF, 0, 59, "minute");
    const hours = parseField(hourF, 0, 23, "hour");
    const domUnrestricted = isDomOrDowUnrestricted(domF);
    const dowUnrestricted = isDomOrDowUnrestricted(dowF);
    const daysOfMonth = parseField(domF, 1, 31, "day-of-month");
    const months = parseField(monF, 1, 12, "month", MONTH_NAMES);
    const dowRaw = parseField(dowF, 0, 7, "day-of-week", DOW_NAMES);
    const daysOfWeek = sortUnique(dowRaw.map((d) => (d === 7 ? 0 : d)));

    const normalized = [
      fieldToCronToken(minutes, 0, 59),
      fieldToCronToken(hours, 0, 23),
      domUnrestricted ? "*" : fieldToCronToken(daysOfMonth, 1, 31),
      fieldToCronToken(months, 1, 12),
      dowUnrestricted ? "*" : fieldToCronToken(daysOfWeek, 0, 6),
    ].join(" ");

    const cron: ParsedCron = {
      minutes,
      hours,
      daysOfMonth,
      months,
      daysOfWeek,
      domUnrestricted,
      dowUnrestricted,
      normalized: macro ? trimmed : normalized,
    };

    return { ok: true, cron };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid cron expression";
    return { ok: false, error: msg };
  }
}

function dayOfWeekLocal(d: Date): number {
  return d.getDay();
}

function dayOfWeekUtc(d: Date): number {
  return d.getUTCDay();
}

function calendarPartsLocal(d: Date) {
  return {
    minute: d.getMinutes(),
    hour: d.getHours(),
    dom: d.getDate(),
    month: d.getMonth() + 1,
    dow: dayOfWeekLocal(d),
  };
}

function calendarPartsUtc(d: Date) {
  return {
    minute: d.getUTCMinutes(),
    hour: d.getUTCHours(),
    dom: d.getUTCDate(),
    month: d.getUTCMonth() + 1,
    dow: dayOfWeekUtc(d),
  };
}

function isRealCalendarDate(
  year: number,
  month: number,
  dom: number,
  hour: number,
  minute: number,
  utc: boolean,
): boolean {
  const t = utc
    ? new Date(Date.UTC(year, month - 1, dom, hour, minute, 0, 0))
    : new Date(year, month - 1, dom, hour, minute, 0, 0);
  if (utc) {
    return (
      t.getUTCFullYear() === year &&
      t.getUTCMonth() + 1 === month &&
      t.getUTCDate() === dom &&
      t.getUTCHours() === hour &&
      t.getUTCMinutes() === minute
    );
  }
  return (
    t.getFullYear() === year &&
    t.getMonth() + 1 === month &&
    t.getDate() === dom &&
    t.getHours() === hour &&
    t.getMinutes() === minute
  );
}

function matchesMinute(
  cron: ParsedCron,
  minute: number,
  hour: number,
  dom: number,
  month: number,
  dow: number,
): boolean {
  if (!cron.minutes.includes(minute)) return false;
  if (!cron.hours.includes(hour)) return false;
  if (!cron.months.includes(month)) return false;

  const domOk = cron.daysOfMonth.includes(dom);
  const dowOk = cron.daysOfWeek.includes(dow);

  if (cron.domUnrestricted && cron.dowUnrestricted) return true;
  if (cron.domUnrestricted) return dowOk;
  if (cron.dowUnrestricted) return domOk;
  return domOk || dowOk;
}

function matches(cron: ParsedCron, d: Date, utc: boolean): boolean {
  const p = utc ? calendarPartsUtc(d) : calendarPartsLocal(d);
  const y = utc ? d.getUTCFullYear() : d.getFullYear();
  if (!isRealCalendarDate(y, p.month, p.dom, p.hour, p.minute, utc)) {
    return false;
  }
  return matchesMinute(cron, p.minute, p.hour, p.dom, p.month, p.dow);
}

function startOfNextMinute(from: Date, utc: boolean): Date {
  const t = new Date(from.getTime());
  if (utc) {
    t.setUTCSeconds(0, 0);
    t.setUTCMilliseconds(0);
    if (t.getTime() <= from.getTime()) {
      t.setUTCMinutes(t.getUTCMinutes() + 1);
    }
  } else {
    t.setSeconds(0, 0);
    t.setMilliseconds(0);
    if (t.getTime() <= from.getTime()) {
      t.setMinutes(t.getMinutes() + 1);
    }
  }
  return t;
}

const MAX_MINUTE_WALK = 527_040; // 366 * 24 * 60

export interface NextCronRunsOptions {
  /** Use UTC calendar fields instead of local time */
  utc?: boolean;
  /** Safety cap on minute steps (default 527040) */
  maxSteps?: number;
}

export function getNextCronRuns(
  cron: ParsedCron,
  from: Date,
  count: number,
  options?: NextCronRunsOptions,
): Date[] {
  if (count < 1) return [];
  const utc = options?.utc === true;
  const cap = options?.maxSteps ?? MAX_MINUTE_WALK;
  const out: Date[] = [];
  const cursor = startOfNextMinute(from, utc);
  for (let step = 0; step < cap && out.length < count; step++) {
    if (matches(cron, cursor, utc)) out.push(new Date(cursor.getTime()));
    if (utc) cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
    else cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return out;
}

const DOW_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatList(
  nums: readonly number[],
  names?: readonly string[],
): string {
  if (nums.length === 0) return "";
  if (names) {
    const parts = nums.map((n) => names[n] ?? String(n));
    if (parts.length === 1) {
      const only = parts[0];
      return only === undefined ? "" : only;
    }
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
  }
  if (nums.length === 1) return String(nums[0]);
  if (nums.length === 2) return `${nums[0]} and ${nums[1]}`;
  return `${nums.slice(0, -1).join(", ")}, and ${nums[nums.length - 1]}`;
}

function isEvery(values: readonly number[], min: number, max: number): boolean {
  return values.length === max - min + 1;
}

export function describeCronExpression(cron: ParsedCron): string {
  if (
    isEvery(cron.minutes, 0, 59) &&
    isEvery(cron.hours, 0, 23) &&
    cron.domUnrestricted &&
    cron.dowUnrestricted &&
    isEvery(cron.months, 1, 12)
  ) {
    return "Runs every minute.";
  }

  if (
    cron.minutes.length === 1 &&
    cron.minutes[0] === 0 &&
    isEvery(cron.hours, 0, 23) &&
    cron.domUnrestricted &&
    cron.dowUnrestricted &&
    isEvery(cron.months, 1, 12)
  ) {
    return "Runs at minute 0 of every hour.";
  }

  if (
    cron.minutes.length === 1 &&
    cron.minutes[0] === 0 &&
    cron.hours.length === 1 &&
    cron.hours[0] === 0 &&
    cron.domUnrestricted &&
    cron.dowUnrestricted &&
    isEvery(cron.months, 1, 12)
  ) {
    return "Runs once per day at 00:00 (midnight).";
  }

  const isWeekdays =
    cron.daysOfWeek.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => cron.daysOfWeek.includes(d));
  if (
    cron.minutes.length === 1 &&
    cron.minutes[0] === 0 &&
    cron.hours.length === 1 &&
    cron.hours[0] === 9 &&
    cron.domUnrestricted &&
    !cron.dowUnrestricted &&
    isWeekdays &&
    isEvery(cron.months, 1, 12)
  ) {
    return "Runs at 09:00 on weekdays (Monday through Friday).";
  }

  const timePart =
    cron.minutes.length === 1 && cron.hours.length === 1
      ? `At ${String(cron.hours[0]).padStart(2, "0")}:${String(cron.minutes[0]).padStart(2, "0")}`
      : `When minute is ${formatList(cron.minutes)} and hour is ${formatList(cron.hours)}`;

  const monthPart = isEvery(cron.months, 1, 12)
    ? "every month"
    : `in ${formatList(cron.months)}`;

  let dayPart: string;
  if (cron.domUnrestricted && cron.dowUnrestricted) {
    dayPart = "every day";
  } else if (cron.domUnrestricted) {
    dayPart = `on ${formatList(cron.daysOfWeek, DOW_LONG)}`;
  } else if (cron.dowUnrestricted) {
    dayPart =
      cron.daysOfMonth.length === 31 && isEvery(cron.daysOfMonth, 1, 31)
        ? "every day of the month"
        : `on day-of-month ${formatList(cron.daysOfMonth)}`;
  } else {
    dayPart = `on DOM ${formatList(cron.daysOfMonth)} or ${formatList(cron.daysOfWeek, DOW_LONG)} (either matches)`;
  }

  return `${timePart}, ${dayPart}, ${monthPart}.`;
}

function parseClockTo24h(
  text: string,
): { hour: number; minute: number } | null {
  const t = text.trim().toLowerCase().replace(/\./g, "");
  let m = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (m) {
    let h = Number(m[1]);
    const min = Number(m[2]);
    const ap = m[3];
    if (min > 59) return null;
    if (ap) {
      if (h < 1 || h > 12) return null;
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
    } else if (h > 23) return null;
    return { hour: h, minute: min };
  }
  m = t.match(/^(\d{1,2})\s*(am|pm)$/);
  if (m) {
    let h = Number(m[1]);
    if (h < 1 || h > 12) return null;
    if (m[2] === "pm" && h < 12) h += 12;
    if (m[2] === "am" && h === 12) h = 0;
    return { hour: h, minute: 0 };
  }
  return null;
}

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

export function humanPhraseToCron(phrase: string): HumanToCronResult {
  const raw = phrase.trim().toLowerCase().replace(/\s+/g, " ");
  if (!raw) return { ok: false, error: "Empty phrase" };

  if (raw === "every minute" || raw === "minutely") {
    return { ok: true, cron: "* * * * *" };
  }
  if (raw === "every hour" || raw === "hourly") {
    return { ok: true, cron: "0 * * * *" };
  }
  if (raw === "every day" || raw === "daily" || raw === "once a day") {
    return { ok: true, cron: "0 0 * * *" };
  }
  if (raw === "@yearly" || raw === "@annually")
    return { ok: true, cron: "@yearly" };
  if (raw === "@monthly") return { ok: true, cron: "@monthly" };
  if (raw === "@weekly") return { ok: true, cron: "@weekly" };
  if (raw === "@daily" || raw === "@midnight")
    return { ok: true, cron: "@daily" };
  if (raw === "@hourly") return { ok: true, cron: "@hourly" };

  let m = raw.match(/^every (\d+) minutes?$/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 59) return { ok: true, cron: `*/${n} * * * *` };
    return { ok: false, error: "Minute interval must be 1-59" };
  }

  m = raw.match(/^every (\d+) hours?$/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 23) return { ok: true, cron: `0 */${n} * * *` };
    return { ok: false, error: "Hour interval must be 1-23" };
  }

  m = raw.match(/^(?:every )?weekdays?(?: at (.+))?$/);
  if (m) {
    const tm = m[1] ? parseClockTo24h(m[1]) : { hour: 9, minute: 0 };
    if (!tm) return { ok: false, error: "Could not parse time for weekdays" };
    return { ok: true, cron: `${tm.minute} ${tm.hour} * * 1-5` };
  }

  m = raw.match(
    /^(?:every )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?: at (.+))?$/,
  );
  if (m) {
    const dayKey = m[1];
    if (!dayKey) return { ok: false, error: "Unknown weekday" };
    const dow = WEEKDAY_MAP[dayKey];
    if (dow === undefined) return { ok: false, error: "Unknown weekday" };
    const tm = m[2] ? parseClockTo24h(m[2]) : { hour: 0, minute: 0 };
    if (!tm) return { ok: false, error: "Could not parse time" };
    return { ok: true, cron: `${tm.minute} ${tm.hour} * * ${dow}` };
  }

  m = raw.match(
    /^monthly on (?:the )?(\d{1,2}|first)(?:st|nd|rd|th)?(?: at (.+))?$/,
  );
  if (m) {
    const rawDom = m[1];
    if (rawDom === undefined)
      return { ok: false, error: "Could not read day of month" };
    const dom = rawDom === "first" ? 1 : Number(rawDom);
    if (dom < 1 || dom > 31)
      return { ok: false, error: "Day of month must be 1-31" };
    const tm = m[2] ? parseClockTo24h(m[2]) : { hour: 0, minute: 0 };
    if (!tm) return { ok: false, error: "Could not parse time" };
    return { ok: true, cron: `${tm.minute} ${tm.hour} ${dom} * *` };
  }

  m = raw.match(/^(?:every )?day at (.+)$/);
  if (m) {
    const timePart = m[1];
    if (timePart === undefined)
      return { ok: false, error: "Could not parse time after 'day at'" };
    const tm = parseClockTo24h(timePart);
    if (!tm) return { ok: false, error: "Could not parse time after 'day at'" };
    return { ok: true, cron: `${tm.minute} ${tm.hour} * * *` };
  }

  return {
    ok: false,
    error:
      'Try phrases like "every 5 minutes", "weekdays at 9am", "monday at 3:30 pm", "day at 14:00", or "monthly on the 15 at 8:00".',
  };
}
