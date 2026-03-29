/**
 * RFC 4648 Base64 and Base64URL encode/decode with UTF-8 text and raw bytes.
 * Whitespace in decode input is ignored (PEM-style pasted lines).
 */

export interface Base64EncodeFormatOptions {
  /** RFC 4648 Base64URL alphabet; padding omitted on output. */
  urlSafe: boolean;
  /** Insert newlines every N characters (0 = single line). */
  lineWidth: number;
}

function clampLineWidth(w: number): number {
  if (!Number.isFinite(w) || w < 0) return 0;
  return Math.min(120, Math.floor(w));
}

/** Map URL-safe symbols to standard Base64 before padding and atob. */
export function normalizeBase64ForDecode(
  input: string,
  urlSafe: boolean,
): string {
  let s = input.replace(/\s/g, "");
  if (urlSafe) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
  }
  return s;
}

export function addBase64Padding(segment: string): string {
  const pad = (4 - (segment.length % 4)) % 4;
  if (pad === 0) return segment;
  return segment + "=".repeat(pad);
}

/** Standard Base64 alphabet only (after URL-safe normalization). */
export function isValidStandardBase64Padded(s: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0;
}

export function tryAtobToBytes(paddedStandard: string): Uint8Array | null {
  if (!isValidStandardBase64Padded(paddedStandard)) return null;
  try {
    const binary = atob(paddedStandard);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

const BINARY_CHUNK = 0x8000;

/**
 * Standard Base64 from raw bytes (uses btoa in chunks to limit string pressure).
 */
export function bytesToStandardBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += BINARY_CHUNK) {
    const end = Math.min(i + BINARY_CHUNK, bytes.length);
    for (let j = i; j < end; j++) {
      const b = bytes[j];
      if (b !== undefined) binary += String.fromCharCode(b);
    }
  }
  return btoa(binary);
}

export function standardToUrlSafeBase64(standard: string): string {
  return standard.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function wrapBase64Lines(b64: string, lineWidth: number): string {
  const w = clampLineWidth(lineWidth);
  if (w <= 0) return b64;
  const flat = b64.replace(/\s/g, "");
  const lines: string[] = [];
  for (let i = 0; i < flat.length; i += w) {
    lines.push(flat.slice(i, i + w));
  }
  return lines.join("\n");
}

export function utf8StringToBase64(
  text: string,
  options: Base64EncodeFormatOptions,
): string {
  const bytes = new TextEncoder().encode(text);
  return bytesToBase64(bytes, options);
}

export function bytesToBase64(
  bytes: Uint8Array,
  options: Base64EncodeFormatOptions,
): string {
  let out = bytesToStandardBase64(bytes);
  if (options.urlSafe) {
    out = standardToUrlSafeBase64(out);
  }
  const lw = clampLineWidth(options.lineWidth);
  if (lw > 0) {
    return wrapBase64Lines(out, lw);
  }
  return out;
}

export type Base64DecodeSuccess = {
  ok: true;
  bytes: Uint8Array;
  /** Present only when bytes are valid UTF-8. */
  utf8Text: string | null;
};

export type Base64DecodeFailure = {
  ok: false;
  error: string;
};

export type Base64DecodeResult = Base64DecodeSuccess | Base64DecodeFailure;

export function decodeBase64(
  rawInput: string,
  urlSafe: boolean,
): Base64DecodeResult {
  const normalized = normalizeBase64ForDecode(rawInput, urlSafe);
  if (!normalized) {
    return {
      ok: false,
      error: "Paste Base64 text or load a .b64 / .txt file.",
    };
  }
  const padded = addBase64Padding(normalized);
  const bytes = tryAtobToBytes(padded);
  if (!bytes) {
    return {
      ok: false,
      error:
        "Invalid Base64: check for wrong characters, bad padding, or disable URL-safe if this is standard Base64.",
    };
  }
  let utf8Text: string | null = null;
  try {
    utf8Text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    utf8Text = null;
  }
  return { ok: true, bytes, utf8Text };
}

export function bytesToHexPreview(bytes: Uint8Array, maxBytes = 48): string {
  const n = Math.min(maxBytes, bytes.length);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const b = bytes[i];
    if (b === undefined) break;
    parts.push(b.toString(16).padStart(2, "0"));
  }
  const head = parts.join(" ");
  if (bytes.length > maxBytes) return `${head} …`;
  return head;
}
