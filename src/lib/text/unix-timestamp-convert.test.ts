import { describe, expect, it } from "vitest";

import {
  formatUnixInstant,
  parseDatetimeLocalValue,
  parseUnixTimestampInput,
  wallInTimeZoneFromUtc,
  wallToDatetimeLocalValue,
  zonedWallTimeToUtcMs,
} from "./unix-timestamp-convert";

describe("parseUnixTimestampInput", () => {
  it("parses seconds in auto mode for 10-digit value", () => {
    const r = parseUnixTimestampInput("1700000000", "auto");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.unitUsed).toBe("s");
    expect(r.ms).toBe(1700000000000);
  });

  it("parses milliseconds in auto mode when digit count > 10", () => {
    const r = parseUnixTimestampInput("1700000000123", "auto");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.unitUsed).toBe("ms");
    expect(r.ms).toBe(1700000000123);
  });

  it("forces seconds when unit is s", () => {
    const r = parseUnixTimestampInput("1700000000123", "s");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ms).toBe(1700000000123000);
  });

  it("forces ms when unit is ms", () => {
    const r = parseUnixTimestampInput("1700000000", "ms");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ms).toBe(1700000000);
  });

  it("trims and strips quotes", () => {
    const r = parseUnixTimestampInput(`  "0"  `, "auto");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ms).toBe(0);
  });

  it("rejects empty", () => {
    const r = parseUnixTimestampInput("   ", "auto");
    expect(r.ok).toBe(false);
  });
});

describe("zonedWallTimeToUtcMs", () => {
  it("maps UTC wall time to same instant", () => {
    const wall = {
      y: 2024,
      mo: 6,
      d: 1,
      h: 12,
      mi: 0,
      s: 0,
    };
    const ms = zonedWallTimeToUtcMs(wall, "UTC");
    expect(ms).toBe(Date.UTC(2024, 5, 1, 12, 0, 0));
  });

  it("maps America/New_York summer wall noon to 16:00 UTC", () => {
    const wall = {
      y: 2024,
      mo: 6,
      d: 1,
      h: 12,
      mi: 0,
      s: 0,
    };
    const ms = zonedWallTimeToUtcMs(wall, "America/New_York");
    expect(ms).toBe(Date.UTC(2024, 5, 1, 16, 0, 0));
  });
});

describe("parseDatetimeLocalValue / wall roundtrip", () => {
  it("parses datetime-local string", () => {
    expect(parseDatetimeLocalValue("2024-06-01T12:00")).toEqual({
      y: 2024,
      mo: 6,
      d: 1,
      h: 12,
      mi: 0,
      s: 0,
    });
  });

  it("roundtrips wall from UTC instant", () => {
    const ms = Date.UTC(2024, 5, 1, 16, 30, 45);
    const w = wallInTimeZoneFromUtc(ms, "UTC");
    if ("error" in w) throw new Error(w.error);
    expect(wallToDatetimeLocalValue(w)).toBe("2024-06-01T16:30:45");
  });
});

describe("formatUnixInstant", () => {
  it("formats epoch zero in UTC", () => {
    const r = formatUnixInstant(0, "UTC", "en");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.utcIso).toBe("1970-01-01T00:00:00.000Z");
    expect(r.value.seconds).toBe("0");
    expect(r.value.millis).toBe("0");
  });
});
