/**
 * RFC 4122 UUID v1/v4 and RFC 9562 UUID v7 generation using Web Crypto.
 * All randomness from crypto.getRandomValues (or injectable for tests).
 */

export type UuidVersion = "v1" | "v4" | "v7" | "nil";

/** 100-ns intervals between UUID epoch (1582-10-15 UTC) and Unix epoch. */
const UUID_EPOCH_OFFSET_100NS = 122_192_928_000_000_000n;

export interface UuidGenerateOptions {
  /** Milliseconds since Unix epoch (v1 / v7). Defaults to `Date.now()`. */
  nowMs?: number;
  /** Return uppercase hex (GUID style in some ecosystems). */
  uppercase?: boolean;
  /** Supply 16 random bytes (for deterministic tests). */
  randomBytes16?: Uint8Array;
}

function getRandom16(): Uint8Array {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("crypto.getRandomValues is not available");
  }
  return crypto.getRandomValues(new Uint8Array(16));
}

function bytesToUuid(
  bytes: Uint8Array,
  uppercase: boolean | undefined,
): string {
  const h = (i: number) => {
    const b = bytes[i];
    if (b === undefined) throw new Error("uuid: expected 16 bytes");
    return b.toString(16).padStart(2, "0");
  };
  const parts = [
    `${h(0)}${h(1)}${h(2)}${h(3)}`,
    `${h(4)}${h(5)}`,
    `${h(6)}${h(7)}`,
    `${h(8)}${h(9)}`,
    `${h(10)}${h(11)}${h(12)}${h(13)}${h(14)}${h(15)}`,
  ];
  const s = parts.join("-");
  return uppercase ? s.toUpperCase() : s;
}

/** All-zero nil UUID. */
export function generateNilUuid(options?: { uppercase?: boolean }): string {
  const s = "00000000-0000-0000-0000-000000000000";
  return options?.uppercase ? s.toUpperCase() : s;
}

/** RFC 4122 UUID v4 (random). */
export function generateUuidV4(options?: UuidGenerateOptions): string {
  const bytes = options?.randomBytes16
    ? new Uint8Array(options.randomBytes16)
    : getRandom16();
  const b6 = bytes[6];
  const b8 = bytes[8];
  if (b6 === undefined || b8 === undefined)
    throw new Error("uuid: expected 16 random bytes");
  bytes[6] = (b6 & 0x0f) | 0x40;
  bytes[8] = (b8 & 0x3f) | 0x80;
  return bytesToUuid(bytes, options?.uppercase);
}

/**
 * RFC 9562 UUID v7: 48-bit Unix ms in big-endian, version 7, random bits.
 */
export function generateUuidV7(options?: UuidGenerateOptions): string {
  const nowMs = options?.nowMs ?? Date.now();
  const t = BigInt(nowMs);
  const bytes = options?.randomBytes16
    ? new Uint8Array(options.randomBytes16)
    : getRandom16();

  bytes[0] = Number((t >> 40n) & 0xffn);
  bytes[1] = Number((t >> 32n) & 0xffn);
  bytes[2] = Number((t >> 24n) & 0xffn);
  bytes[3] = Number((t >> 16n) & 0xffn);
  bytes[4] = Number((t >> 8n) & 0xffn);
  bytes[5] = Number(t & 0xffn);
  const v7b6 = bytes[6];
  const v7b8 = bytes[8];
  if (v7b6 === undefined || v7b8 === undefined)
    throw new Error("uuid: expected 16 random bytes");
  bytes[6] = (v7b6 & 0x0f) | 0x70;
  bytes[8] = (v7b8 & 0x3f) | 0x80;

  return bytesToUuid(bytes, options?.uppercase);
}

/**
 * RFC 4122 UUID v1: Gregorian timestamp in 100-ns ticks + random clock seq and node.
 */
export function generateUuidV1(options?: UuidGenerateOptions): string {
  const nowMs = options?.nowMs ?? Date.now();
  const ticks = BigInt(nowMs) * 10_000n + UUID_EPOCH_OFFSET_100NS;

  const tl = Number(ticks & 0xffffffffn);
  const tm = Number((ticks >> 32n) & 0xffffn);
  const th = Number((ticks >> 48n) & 0x0fffn);

  const rnd = options?.randomBytes16
    ? new Uint8Array(options.randomBytes16)
    : getRandom16();

  const bytes = new Uint8Array(16);
  bytes[0] = (tl >>> 24) & 0xff;
  bytes[1] = (tl >>> 16) & 0xff;
  bytes[2] = (tl >>> 8) & 0xff;
  bytes[3] = tl & 0xff;
  bytes[4] = (tm >>> 8) & 0xff;
  bytes[5] = tm & 0xff;
  const timeHiAndVer = (th & 0x0fff) | 0x1000;
  bytes[6] = (timeHiAndVer >>> 8) & 0xff;
  bytes[7] = timeHiAndVer & 0xff;

  const r0 = rnd[0];
  const r1 = rnd[1];
  if (r0 === undefined || r1 === undefined)
    throw new Error("uuid: expected 16 random bytes");
  const clock = ((r0 << 8) | r1) & 0x3fff;
  bytes[8] = 0x80 | ((clock >>> 8) & 0x3f);
  bytes[9] = clock & 0xff;
  for (let i = 0; i < 6; i++) {
    const rb = rnd[2 + i];
    if (rb === undefined) throw new Error("uuid: expected 16 random bytes");
    bytes[10 + i] = rb;
  }

  return bytesToUuid(bytes, options?.uppercase);
}

export function generateUuid(
  version: UuidVersion,
  options?: UuidGenerateOptions,
): string {
  switch (version) {
    case "nil":
      return generateNilUuid(options);
    case "v1":
      return generateUuidV1(options);
    case "v4":
      return generateUuidV4(options);
    case "v7":
      return generateUuidV7(options);
    default: {
      const _x: never = version;
      return _x;
    }
  }
}

export const UUID_VERSION_LABELS: Record<UuidVersion, string> = {
  v4: "Version 4 (random)",
  v7: "Version 7 (Unix time + random, RFC 9562)",
  v1: "Version 1 (time-based, random node)",
  nil: "Nil (all zeros)",
};

export type UuidBulkSeparator = "newline" | "comma" | "comma-space" | "json";

export function formatUuidBulk(
  uuids: readonly string[],
  separator: UuidBulkSeparator,
): string {
  if (uuids.length === 0) return "";
  switch (separator) {
    case "newline":
      return uuids.join("\n");
    case "comma":
      return uuids.join(",");
    case "comma-space":
      return uuids.join(", ");
    case "json":
      return `${JSON.stringify(uuids)}\n`;
    default: {
      const _s: never = separator;
      return _s;
    }
  }
}
