import { describe, expect, it } from "vitest";

import {
  formatUuidBulk,
  generateNilUuid,
  generateUuid,
  generateUuidV1,
  generateUuidV4,
  generateUuidV7,
} from "./uuid-generate";

function fixedBytes(values: number[]): Uint8Array {
  const u = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    u[i] = values[i] ?? 0;
  }
  return u;
}

describe("generateNilUuid", () => {
  it("returns canonical nil", () => {
    expect(generateNilUuid()).toBe("00000000-0000-0000-0000-000000000000");
  });
});

describe("generateUuidV4", () => {
  it("sets version 4 and variant bits with fixed random payload", () => {
    const r = fixedBytes([
      0, 1, 2, 3, 4, 5, 0, 0, 0, 0, 10, 11, 12, 13, 14, 15,
    ]);
    const u = generateUuidV4({ randomBytes16: r });
    expect(u).toMatch(
      /^00010203-0405-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-0a0b0c0d0e0f$/,
    );
  });
});

describe("generateUuidV7", () => {
  it("embeds timestamp in first 48 bits (big-endian)", () => {
    const r = fixedBytes([
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x0f, 0xaa, 0x3f, 0xbb, 0xcc, 0xdd,
      0xee, 0xff, 0x00, 0x11,
    ]);
    const u = generateUuidV7({ nowMs: 1_700_000_000_000, randomBytes16: r });
    // 1_700_000_000_000 ms → 0x018bcfe56800 in 48-bit big-endian
    expect(u.startsWith("018bcfe5-6800-")).toBe(true);
    expect(u).toMatch(/^018bcfe5-6800-7faa-bfbb-ccddeeff0011$/);
  });
});

describe("generateUuidV1", () => {
  it("is stable for fixed clock seq (bytes 0–1) and node (bytes 2–7)", () => {
    const r = fixedBytes([
      0x80, 0x12, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const u = generateUuidV1({ nowMs: 1_700_000_000_000, randomBytes16: r });
    expect(u).toMatch(/^04afc000-833b-11ee-8012-aabbccddeeff$/);
  });
});

describe("generateUuid", () => {
  it("dispatches versions", () => {
    expect(generateUuid("nil")).toBe(generateNilUuid());
    expect(
      generateUuid("v4", { randomBytes16: fixedBytes(Array(16).fill(0)) }),
    ).toMatch(/^00000000-0000-4000-8000-000000000000$/);
  });
});

describe("formatUuidBulk", () => {
  it("formats separators", () => {
    const ids = ["a", "b"];
    expect(formatUuidBulk(ids, "newline")).toBe("a\nb");
    expect(formatUuidBulk(ids, "comma")).toBe("a,b");
    expect(formatUuidBulk(ids, "comma-space")).toBe("a, b");
    expect(formatUuidBulk(ids, "json")).toBe('["a","b"]\n');
  });
});
