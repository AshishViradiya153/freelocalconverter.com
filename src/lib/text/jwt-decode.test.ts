import { describe, expect, it } from "vitest";

import { decodeJwt, normalizeJwtInput } from "./jwt-decode";

/** Build minimal base64url (UTF-8 JSON) without Node Buffer for jsdom. */
function b64urlJson(value: unknown): string {
  const json = JSON.stringify(value);
  const utf8 = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < utf8.length; i++) {
    const b = utf8[i];
    if (b !== undefined) bin += String.fromCharCode(b);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeJwt(
  header: Record<string, unknown>,
  payload: unknown,
  signature: string,
): string {
  return `${b64urlJson(header)}.${b64urlJson(payload)}.${signature}`;
}

describe("normalizeJwtInput", () => {
  it("strips Bearer prefix and whitespace", () => {
    expect(normalizeJwtInput("  Bearer  abc.def.ghi  \n")).toBe("abc.def.ghi");
  });

  it("removes BOM", () => {
    expect(normalizeJwtInput("\uFEFFaa.bb.cc")).toBe("aa.bb.cc");
  });
});

describe("decodeJwt", () => {
  it("decodes a valid three-segment JWT", () => {
    const jwt = makeJwt(
      { alg: "HS256", typ: "JWT" },
      { sub: "user-1", exp: 2_000_000_000 },
      "c2ln", // "sig" in base64 -> will decode to 3 bytes
    );
    const r = decodeJwt(jwt, { nowMs: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.headerAlg).toBe("HS256");
    expect(r.headerTyp).toBe("JWT");
    expect(JSON.parse(r.headerPretty).alg).toBe("HS256");
    expect(JSON.parse(r.payloadPretty).sub).toBe("user-1");
    expect(r.signatureB64url).toBe("c2ln");
    expect(r.signatureByteLength).toBe(3);
    expect(r.alerts.some((a) => a.code === "unverified")).toBe(true);
  });

  it("flags alg none as critical", () => {
    const jwt = makeJwt({ alg: "none", typ: "JWT" }, { sub: "x" }, "");
    const r = decodeJwt(jwt);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const critical = r.alerts.filter((a) => a.level === "critical");
    expect(critical.some((a) => a.code === "alg_none")).toBe(true);
  });

  it("parses exp and marks expired with fixed clock", () => {
    const jwt = makeJwt({ alg: "HS256", typ: "JWT" }, { exp: 1_000 }, "eA");
    const r = decodeJwt(jwt, { nowMs: 2_000_000 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.exp?.expired).toBe(true);
    expect(r.alerts.some((a) => a.code === "expired")).toBe(true);
  });

  it("parses nbf not yet valid", () => {
    const jwt = makeJwt(
      { alg: "HS256", typ: "JWT" },
      { nbf: 9_000_000_000 },
      "eA",
    );
    const r = decodeJwt(jwt, { nowMs: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nbf?.notYetValid).toBe(true);
    expect(r.alerts.some((a) => a.code === "nbf_future")).toBe(true);
  });

  it("rejects JWE five-part token", () => {
    const r = decodeJwt("a.b.c.d.e");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.toLowerCase()).toContain("five");
  });

  it("rejects wrong segment count", () => {
    const r = decodeJwt("a.b");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("three");
  });

  it("rejects invalid header base64", () => {
    const r = decodeJwt("!!!.eyJhIjoxfQ.eA");
    expect(r.ok).toBe(false);
  });

  it("rejects non-object header", () => {
    const jwt = `${b64urlJson([1, 2])}.${b64urlJson({})}.eA`;
    const r = decodeJwt(jwt);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.toLowerCase()).toContain("object");
  });

  it("accepts non-object payload (JSON string)", () => {
    const jwt = makeJwt({ alg: "HS256", typ: "JWT" }, "plain-string", "eA");
    const r = decodeJwt(jwt);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.payloadPretty).toBe('"plain-string"');
  });

  it("reads kid from header", () => {
    const jwt = makeJwt({ alg: "RS256", typ: "JWT", kid: "key-42" }, {}, "");
    const r = decodeJwt(jwt);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.headerKid).toBe("key-42");
  });
});
