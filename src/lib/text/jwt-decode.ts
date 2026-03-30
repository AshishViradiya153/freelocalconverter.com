/**
 * Decodes JWS compact JWTs (header.payload.signature) per RFC 7515 / 7519.
 * Does not verify signatures - callers must treat payload as untrusted until verified server-side.
 */

export type JwtSecurityAlert = {
  level: "critical" | "warning" | "info";
  code: string;
  message: string;
};

export type JwtTimeClaim = {
  seconds: number;
  isoUtc: string;
  /** exp: true if now >= exp */
  expired?: boolean;
  /** nbf: true if now < nbf */
  notYetValid?: boolean;
};

export type JwtDecodeSuccess = {
  ok: true;
  headerPretty: string;
  payloadPretty: string;
  signatureB64url: string;
  signatureByteLength: number;
  headerAlg: string | null;
  headerTyp: string | null;
  headerKid: string | null;
  alerts: JwtSecurityAlert[];
  exp: JwtTimeClaim | null;
  iat: JwtTimeClaim | null;
  nbf: JwtTimeClaim | null;
};

export type JwtDecodeFailure = {
  ok: false;
  error: string;
};

export type JwtDecodeResult = JwtDecodeSuccess | JwtDecodeFailure;

const UNVERIFIED_MESSAGE =
  "Signatures are not verified here. Anyone can forge a JWT’s header and payload; only verification with a shared secret (HMAC) or public key (RSA, ECDSA, EdDSA) proves integrity. Treat decoded claims as untrusted until your backend validates the token.";

const ALG_NONE_MESSAGE =
  'Algorithm "none" means no signature. Reject these tokens in production APIs - they are trivially forgeable.';

function decodeBase64UrlToBytes(segment: string): Uint8Array | null {
  const trimmed = segment.trim();
  if (!trimmed) return new Uint8Array(0);
  try {
    const base64 = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

function decodeBase64UrlToUtf8(segment: string): string | null {
  const bytes = decodeBase64UrlToBytes(segment);
  if (bytes === null) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch {
      return null;
    }
  }
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumericDateSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toTimeClaim(
  seconds: number,
  nowSec: number,
  role: "exp" | "iat" | "nbf",
): JwtTimeClaim {
  const ms = seconds * 1000;
  const isoUtc = new Date(ms).toISOString();
  if (role === "exp") {
    return { seconds, isoUtc, expired: nowSec >= seconds };
  }
  if (role === "nbf") {
    return { seconds, isoUtc, notYetValid: nowSec < seconds };
  }
  return { seconds, isoUtc };
}

export function normalizeJwtInput(raw: string): string {
  let s = raw.replace(/^\uFEFF/, "").trim();
  if (/^Bearer\s+/i.test(s)) {
    s = s.replace(/^Bearer\s+/i, "").trim();
  }
  s = s.replace(/\s+/g, "");
  return s;
}

export function decodeJwt(
  rawInput: string,
  options?: { nowMs?: number },
): JwtDecodeResult {
  const compact = normalizeJwtInput(rawInput);
  if (!compact) {
    return {
      ok: false,
      error: "Paste a JWT (three Base64URL segments separated by dots).",
    };
  }

  const parts = compact.split(".");
  if (parts.length === 5) {
    return {
      ok: false,
      error:
        "This token has five segments (JWE / encrypted JWT). This tool decodes signed JWS JWTs with exactly three segments (header.payload.signature).",
    };
  }
  if (parts.length !== 3) {
    return {
      ok: false,
      error:
        "Expected a JWS compact JWT: header.payload.signature (three segments separated by dots).",
    };
  }

  const [headerSeg, payloadSeg, signatureSeg] = parts;
  if (!headerSeg || !payloadSeg) {
    return {
      ok: false,
      error: "Invalid JWT: header or payload segment is empty.",
    };
  }

  const headerText = decodeBase64UrlToUtf8(headerSeg);
  if (headerText === null) {
    return {
      ok: false,
      error: "Invalid header: could not decode Base64URL or UTF-8.",
    };
  }

  let headerObj: unknown;
  try {
    headerObj = JSON.parse(headerText) as unknown;
  } catch {
    return { ok: false, error: "Invalid header: not valid JSON." };
  }
  if (
    headerObj === null ||
    typeof headerObj !== "object" ||
    Array.isArray(headerObj)
  ) {
    return { ok: false, error: "Invalid header: expected a JSON object." };
  }
  const header = headerObj as Record<string, unknown>;

  const payloadText = decodeBase64UrlToUtf8(payloadSeg);
  if (payloadText === null) {
    return {
      ok: false,
      error: "Invalid payload: could not decode Base64URL or UTF-8.",
    };
  }

  let payloadValue: unknown;
  try {
    payloadValue = JSON.parse(payloadText) as unknown;
  } catch {
    return { ok: false, error: "Invalid payload: not valid JSON." };
  }

  const sigBytes = decodeBase64UrlToBytes(signatureSeg);
  if (sigBytes === null) {
    return {
      ok: false,
      error: "Invalid signature segment: not valid Base64URL.",
    };
  }

  const nowSec = Math.floor((options?.nowMs ?? Date.now()) / 1000);

  const headerAlg = optionalString(header.alg);
  const headerTyp = optionalString(header.typ);
  const headerKid = optionalString(header.kid);

  const alerts: JwtSecurityAlert[] = [
    { level: "info", code: "unverified", message: UNVERIFIED_MESSAGE },
  ];

  if (headerAlg?.toLowerCase() === "none") {
    alerts.unshift({
      level: "critical",
      code: "alg_none",
      message: ALG_NONE_MESSAGE,
    });
  }

  const payloadRecord =
    payloadValue !== null &&
    typeof payloadValue === "object" &&
    !Array.isArray(payloadValue)
      ? (payloadValue as Record<string, unknown>)
      : null;

  let exp: JwtTimeClaim | null = null;
  let iat: JwtTimeClaim | null = null;
  let nbf: JwtTimeClaim | null = null;

  if (payloadRecord) {
    const expSec = readNumericDateSeconds(payloadRecord.exp);
    const iatSec = readNumericDateSeconds(payloadRecord.iat);
    const nbfSec = readNumericDateSeconds(payloadRecord.nbf);
    if (expSec !== null) {
      exp = toTimeClaim(expSec, nowSec, "exp");
      if (exp.expired) {
        alerts.push({
          level: "warning",
          code: "expired",
          message:
            "The exp claim is in the past - many servers will reject this token. This does not prove the signature was valid.",
        });
      }
    }
    if (iatSec !== null) iat = toTimeClaim(iatSec, nowSec, "iat");
    if (nbfSec !== null) {
      nbf = toTimeClaim(nbfSec, nowSec, "nbf");
      if (nbf.notYetValid) {
        alerts.push({
          level: "warning",
          code: "nbf_future",
          message:
            "The nbf (not before) time is still in the future - the token may not be accepted yet.",
        });
      }
    }
  }

  return {
    ok: true,
    headerPretty: JSON.stringify(headerObj, null, 2),
    payloadPretty: JSON.stringify(payloadValue, null, 2),
    signatureB64url: signatureSeg,
    signatureByteLength: sigBytes.length,
    headerAlg,
    headerTyp,
    headerKid,
    alerts,
    exp,
    iat,
    nbf,
  };
}
