import { describe, expect, it } from "vitest";

import {
  describeCronExpression,
  getNextCronRuns,
  humanPhraseToCron,
  parseCronExpression,
} from "./cron-schedule";

describe("parseCronExpression", () => {
  it("parses five-field cron with stars", () => {
    const r = parseCronExpression("* * * * *");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cron.normalized).toBe("* * * * *");
  });

  it("accepts leading zeros in fields", () => {
    const r = parseCronExpression("09 08 * * *");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cron.minutes).toContain(9);
    expect(r.cron.hours).toContain(8);
  });

  it("parses steps and ranges", () => {
    const r = parseCronExpression("*/15 9-17 * * 1-5");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cron.minutes).toEqual([0, 15, 30, 45]);
    expect(r.cron.hours[0]).toBe(9);
    expect(r.cron.hours.at(-1)).toBe(17);
    expect(r.cron.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
  });

  it("parses month and dow names", () => {
    const r = parseCronExpression("0 0 * JAN MON");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cron.months).toEqual([1]);
    expect(r.cron.daysOfWeek).toEqual([1]);
  });

  it("normalizes 7 to Sunday in DOW", () => {
    const r = parseCronExpression("0 0 * * 7");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cron.daysOfWeek).toEqual([0]);
  });

  it("expands @daily macro", () => {
    const r = parseCronExpression("@daily");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cron.minutes).toEqual([0]);
    expect(r.cron.hours).toEqual([0]);
    expect(r.cron.normalized).toBe("@daily");
  });

  it("rejects wrong field count", () => {
    const r = parseCronExpression("* * * *");
    expect(r.ok).toBe(false);
  });
});

describe("getNextCronRuns (Vixie DOM/DOW OR)", () => {
  it("returns every minute for * * * * *", () => {
    const p = parseCronExpression("* * * * *");
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const from = new Date("2026-03-15T12:00:00.000Z");
    const runs = getNextCronRuns(p.cron, from, 3, { utc: true });
    expect(runs.map((d) => d.toISOString())).toEqual([
      "2026-03-15T12:01:00.000Z",
      "2026-03-15T12:02:00.000Z",
      "2026-03-15T12:03:00.000Z",
    ]);
  });

  it("fires 0 0 1 * 1 on the next 1st when no earlier Monday applies (DOM OR DOW)", () => {
    const p = parseCronExpression("0 0 1 * 1");
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const from = new Date("2026-03-31T00:00:00.000Z");
    const runs = getNextCronRuns(p.cron, from, 1, { utc: true });
    expect(runs[0]?.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("fires on Monday before next 1st when schedule is 1st OR Monday", () => {
    const p = parseCronExpression("0 0 1 * 1");
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const from = new Date("2026-03-05T00:00:00.000Z");
    const runs = getNextCronRuns(p.cron, from, 1, { utc: true });
    expect(runs[0]?.toISOString()).toBe("2026-03-09T00:00:00.000Z");
  });

  it("uses real calendar dates for February 29 (leap years)", () => {
    const p = parseCronExpression("0 0 29 2 *");
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const from = new Date("2027-06-01T00:00:00.000Z");
    const runs = getNextCronRuns(p.cron, from, 1, { utc: true });
    expect(runs[0]?.toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });
});

describe("humanPhraseToCron", () => {
  it("maps common phrases", () => {
    expect(humanPhraseToCron("every 5 minutes")).toEqual({
      ok: true,
      cron: "*/5 * * * *",
    });
    expect(humanPhraseToCron("weekdays at 9am")).toEqual({
      ok: true,
      cron: "0 9 * * 1-5",
    });
    expect(humanPhraseToCron("monday at 3:30 pm")).toEqual({
      ok: true,
      cron: "30 15 * * 1",
    });
  });

  it("parses monthly with ordinal", () => {
    const r = humanPhraseToCron("monthly on the 15th at 8:00 am");
    expect(r).toEqual({ ok: true, cron: "0 8 15 * *" });
  });
});

describe("describeCronExpression", () => {
  it("describes every minute", () => {
    const p = parseCronExpression("* * * * *");
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(describeCronExpression(p.cron)).toContain("every minute");
  });

  it("describes weekday 9am preset", () => {
    const p = parseCronExpression("0 9 * * 1-5");
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(describeCronExpression(p.cron)).toContain("weekdays");
  });
});
