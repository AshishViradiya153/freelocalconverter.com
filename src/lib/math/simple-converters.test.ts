import { describe, expect, it } from "vitest";
import {
  celsiusToFahrenheit,
  decimalToFraction,
  degreesToRadians,
  fahrenheitToCelsius,
  formatFractionResult,
  parseFractionOrDecimal,
  radiansToDegrees,
} from "./simple-converters";

describe("celsiusToFahrenheit / fahrenheitToCelsius", () => {
  it("round-trips at key points", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(fahrenheitToCelsius(212)).toBe(100);
  });

  it("inverts approximately", () => {
    const c = -40;
    expect(fahrenheitToCelsius(celsiusToFahrenheit(c))).toBeCloseTo(c, 10);
  });
});

describe("degreesToRadians / radiansToDegrees", () => {
  it("converts π and 180", () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 12);
    expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 12);
    expect(degreesToRadians(0)).toBe(0);
  });
});

describe("decimalToFraction", () => {
  it("handles integers", () => {
    const r = decimalToFraction(7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.whole).toBe(7);
      expect(r.numerator).toBe(0);
      expect(formatFractionResult(r)).toBe("7");
    }
  });

  it("handles 0.375", () => {
    const r = decimalToFraction(0.375);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.improperNumerator).toBe(3);
      expect(r.improperDenominator).toBe(8);
    }
  });

  it("handles negative mixed", () => {
    const r = decimalToFraction(-3.5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(formatFractionResult(r)).toBe("-3 1/2");
    }
  });

  it("clamps values extremely close to 1", () => {
    const r = decimalToFraction(0.9999999999999999);
    expect(r.ok).toBe(true);
    if (r.ok) expect(formatFractionResult(r)).toBe("1");
  });

  it("clamps values extremely close to integers (negative)", () => {
    const r = decimalToFraction(-1.0000000000000002);
    expect(r.ok).toBe(true);
    if (r.ok) expect(formatFractionResult(r)).toBe("-1");
  });
});

describe("parseFractionOrDecimal", () => {
  it("parses decimals", () => {
    const p = parseFractionOrDecimal("3.25");
    expect(p.ok).toBe(true);
    if (p.ok) expect(p.value).toBe(3.25);
  });

  it("parses a/b", () => {
    const p = parseFractionOrDecimal("3/4");
    expect(p.ok).toBe(true);
    if (p.ok) expect(p.value).toBe(0.75);
  });

  it("parses mixed", () => {
    const p = parseFractionOrDecimal("1 3/4");
    expect(p.ok).toBe(true);
    if (p.ok) expect(p.value).toBe(1.75);
  });

  it("parses negative fraction", () => {
    const p = parseFractionOrDecimal("-2/5");
    expect(p.ok).toBe(true);
    if (p.ok) expect(p.value).toBeCloseTo(-0.4);
  });
});
