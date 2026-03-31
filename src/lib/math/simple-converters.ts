function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function simplifyFractionPair(
  numerator: number,
  denominator: number,
): { numerator: number; denominator: number } {
  if (denominator === 0) {
    return { numerator: 0, denominator: 1 };
  }
  const g = gcd(numerator, denominator);
  let n = numerator / g;
  let d = denominator / g;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  return { numerator: n, denominator: d };
}

/** °C → °F */
export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

/** °F → °C */
export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

/** Degrees → radians */
export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Radians → degrees */
export function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Best rational approximation of the fractional part in (0, 1) with denominator ≤ maxDenominator
 * (continued-fraction convergents).
 */
function fractionalPartToRational(
  fractionalPart: number,
  maxDenominator: number,
): { numerator: number; denominator: number } {
  let hPrev = 0;
  let h = 1;
  let kPrev = 1;
  let k = 0;
  let t = fractionalPart;

  for (let i = 0; i < 64; i++) {
    const a = Math.floor(t + 1e-15);
    const hNext = a * h + hPrev;
    const kNext = a * k + kPrev;
    if (kNext > maxDenominator) break;
    hPrev = h;
    h = hNext;
    kPrev = k;
    k = kNext;
    if (Math.abs(fractionalPart - h / k) < 1e-14) break;
    const fp = t - a;
    if (fp < 1e-15) break;
    t = 1 / fp;
  }

  return simplifyFractionPair(h, k);
}

export interface DecimalToFractionOk {
  ok: true;
  sign: -1 | 1;
  whole: number;
  numerator: number;
  denominator: number;
  improperNumerator: number;
  improperDenominator: number;
}

export interface DecimalToFractionErr {
  ok: false;
  message: string;
}

export type DecimalToFractionResult = DecimalToFractionOk | DecimalToFractionErr;

export function decimalToFraction(
  value: number,
  maxDenominator = 1_000_000,
): DecimalToFractionResult {
  if (!Number.isFinite(value)) {
    return { ok: false, message: "Enter a finite number." };
  }

  const sign: -1 | 1 = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  const whole = Math.floor(abs);
  let frac = abs - whole;

  const EPS = 1e-12;
  if (frac < EPS) {
    const imp = simplifyFractionPair(sign * whole, 1);
    return {
      ok: true,
      sign,
      whole: Math.abs(imp.numerator),
      numerator: 0,
      denominator: 1,
      improperNumerator: imp.numerator,
      improperDenominator: imp.denominator,
    };
  }
  if (1 - frac < EPS) {
    const nextWhole = whole + 1;
    const imp = simplifyFractionPair(sign * nextWhole, 1);
    return {
      ok: true,
      sign,
      whole: Math.abs(imp.numerator),
      numerator: 0,
      denominator: 1,
      improperNumerator: imp.numerator,
      improperDenominator: imp.denominator,
    };
  }

  const { numerator: fn, denominator: fd } = fractionalPartToRational(
    frac,
    maxDenominator,
  );
  const improperNum = sign * (whole * fd + fn);
  const imp = simplifyFractionPair(improperNum, fd);

  return {
    ok: true,
    sign,
    whole,
    numerator: fn,
    denominator: fd,
    improperNumerator: imp.numerator,
    improperDenominator: imp.denominator,
  };
}

export function formatFractionResult(r: DecimalToFractionOk): string {
  const signStr = r.sign < 0 ? "-" : "";
  if (r.numerator === 0) {
    return `${signStr}${r.whole}`;
  }
  if (r.whole === 0) {
    return `${signStr}${r.numerator}/${r.denominator}`;
  }
  return `${signStr}${r.whole} ${r.numerator}/${r.denominator}`;
}

export interface FractionParseOk {
  ok: true;
  value: number;
}

export interface FractionParseErr {
  ok: false;
  message: string;
}

export type FractionParseResult = FractionParseOk | FractionParseErr;

/**
 * Accepts decimals (e.g. 0.375) or fractions: 3/4, -7/8, 1 3/4, -2 1/2
 */
export function parseFractionOrDecimal(input: string): FractionParseResult {
  const s = input.trim();
  if (!s) {
    return { ok: false, message: "Enter a number or fraction." };
  }

  const slash = s.indexOf("/");
  if (slash === -1) {
    const n = Number(s.replace(",", "."));
    if (!Number.isFinite(n)) {
      return { ok: false, message: "Could not parse as a number." };
    }
    return { ok: true, value: n };
  }

  const fracPart = s.slice(slash);
  const fracMatch = fracPart.match(/^\s*\/\s*(\d+)\s*$/);
  if (!fracMatch?.[1]) {
    return { ok: false, message: "Use the form a/b or whole a/b." };
  }
  const den = Number(fracMatch[1]);
  if (den === 0) {
    return { ok: false, message: "Denominator cannot be zero." };
  }

  const beforeSlash = s.slice(0, slash).trim();
  const wholeAndNum = beforeSlash.match(/^(-?)\s*(?:(\d+)\s+)?(\d+)\s*$/);
  if (!wholeAndNum) {
    return { ok: false, message: "Could not parse fraction." };
  }
  const neg = wholeAndNum[1] === "-" ? -1 : 1;
  const whole = wholeAndNum[2] ? Number(wholeAndNum[2]) : 0;
  const num = Number(wholeAndNum[3]);
  if (!Number.isFinite(whole) || !Number.isFinite(num)) {
    return { ok: false, message: "Could not parse fraction." };
  }

  const value = neg * (whole + num / den);
  if (!Number.isFinite(value)) {
    return { ok: false, message: "Invalid fraction." };
  }
  return { ok: true, value };
}
