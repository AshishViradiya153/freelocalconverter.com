import { describe, expect, it } from "vitest";

import {
  addBase64Padding,
  bytesToBase64,
  bytesToHexPreview,
  decodeBase64,
  normalizeBase64ForDecode,
  utf8StringToBase64,
} from "./base64-transform";

describe("utf8StringToBase64 / decodeBase64 roundtrip", () => {
  it("roundtrips ASCII", () => {
    const enc = utf8StringToBase64("Hello", {
      urlSafe: false,
      lineWidth: 0,
    });
    const dec = decodeBase64(enc, false);
    expect(dec.ok).toBe(true);
    if (!dec.ok) return;
    expect(dec.utf8Text).toBe("Hello");
  });

  it("roundtrips Unicode (UTF-8)", () => {
    const s = "你好 🔐 €";
    const enc = utf8StringToBase64(s, { urlSafe: false, lineWidth: 0 });
    const dec = decodeBase64(enc, false);
    expect(dec.ok).toBe(true);
    if (!dec.ok) return;
    expect(dec.utf8Text).toBe(s);
  });

  it("roundtrips URL-safe mode", () => {
    const enc = utf8StringToBase64(">?/", { urlSafe: true, lineWidth: 0 });
    expect(enc).not.toContain("+");
    expect(enc).not.toContain("/");
    expect(enc.endsWith("=")).toBe(false);
    const dec = decodeBase64(enc, true);
    expect(dec.ok).toBe(true);
    if (!dec.ok) return;
    expect(dec.utf8Text).toBe(">?/");
  });

  it("ignores whitespace when decoding", () => {
    const inner = utf8StringToBase64("x", { urlSafe: false, lineWidth: 0 });
    const spaced = `${inner.slice(0, 2)}\n\r ${inner.slice(2)}`;
    const dec = decodeBase64(spaced, false);
    expect(dec.ok).toBe(true);
    if (!dec.ok) return;
    expect(dec.utf8Text).toBe("x");
  });

  it("wraps lines without breaking decode after normalize", () => {
    const enc = utf8StringToBase64("abcdefgh", {
      urlSafe: false,
      lineWidth: 4,
    });
    expect(enc.includes("\n")).toBe(true);
    const dec = decodeBase64(enc, false);
    expect(dec.ok).toBe(true);
    if (!dec.ok) return;
    expect(dec.utf8Text).toBe("abcdefgh");
  });
});

describe("decodeBase64 binary", () => {
  it("returns null utf8Text for non-UTF-8 bytes", () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0xfd]);
    const b64 = bytesToBase64(bytes, { urlSafe: false, lineWidth: 0 });
    const dec = decodeBase64(b64, false);
    expect(dec.ok).toBe(true);
    if (!dec.ok) return;
    expect(dec.utf8Text).toBe(null);
    expect(dec.bytes.length).toBe(3);
  });
});

describe("decodeBase64 errors", () => {
  it("fails on invalid alphabet", () => {
    const r = decodeBase64("@@@@", false);
    expect(r.ok).toBe(false);
  });

  it("fails on empty after strip", () => {
    const r = decodeBase64("   \n", false);
    expect(r.ok).toBe(false);
  });
});

describe("helpers", () => {
  it("addBase64Padding", () => {
    expect(addBase64Padding("ab")).toBe("ab==");
    expect(addBase64Padding("abc")).toBe("abc=");
    expect(addBase64Padding("abcd")).toBe("abcd");
  });

  it("normalizeBase64ForDecode maps url-safe", () => {
    expect(normalizeBase64ForDecode("a-b_c", true)).toBe("a+b/c");
  });

  it("bytesToHexPreview truncates with ellipsis", () => {
    const u = new Uint8Array([0x0a, 0xff]);
    expect(bytesToHexPreview(u, 1)).toContain("…");
  });
});
