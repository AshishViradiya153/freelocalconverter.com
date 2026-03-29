/**
 * Fills strings that still match English in messages/{locale}.json.
 * Preserves `{name}`, `{mb}`, `|`, `\n`, and skips pure technical tokens (CSV, JSON, …).
 *
 * Usage:
 *   node scripts/translate-messages-to-locale.mjs de
 *   node scripts/translate-messages-to-locale.mjs de --dry-run
 *   node scripts/translate-messages-to-locale.mjs de --delay-ms=400
 *   node scripts/translate-messages-to-locale.mjs de --provider=mymemory
 *
 * Providers:
 *   gtx (default) — Google Translate web client endpoint; no API key; reasonable for batch scripts.
 *   libre — POST to LIBRETRANSLATE_URL (e.g. https://libretranslate.com/translate) + optional LIBRETRANSLATE_API_KEY.
 *   mymemory — MyMemory; often returns HTTP 429 when quota is exhausted; set MYMEMORY_EMAIL for more quota.
 *   auto — try gtx, then libre (if URL set), then MyMemory.
 *
 * @see https://mymemory.translated.net/doc/spec.php
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

const LANGPAIR = {
  zh: "en|zh-CN",
  es: "en|es",
  pt: "en|pt",
  fr: "en|fr",
  de: "en|de",
  nl: "en|nl",
  it: "en|it",
  ja: "en|ja",
  tr: "en|tr",
  az: "en|az",
  ko: "en|ko",
  ar: "en|ar",
  fa: "en|fa",
  ru: "en|ru",
  he: "en|iw",
  el: "en|el",
};

/** Google `gtx` client `tl` parameter. */
const LOCALE_TO_GTX = {
  zh: "zh-CN",
  es: "es",
  pt: "pt",
  fr: "fr",
  de: "de",
  nl: "nl",
  it: "it",
  ja: "ja",
  tr: "tr",
  az: "az",
  ko: "ko",
  ar: "ar",
  fa: "fa",
  ru: "ru",
  he: "iw",
  el: "el",
};

const LOCALE_TO_LIBRE = {
  zh: "zh",
  es: "es",
  pt: "pt",
  fr: "fr",
  de: "de",
  nl: "nl",
  it: "it",
  ja: "ja",
  tr: "tr",
  az: "az",
  ko: "ko",
  ar: "ar",
  fa: "fa",
  ru: "ru",
  he: "he",
  el: "el",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Keep identical to English (industry-standard or non-translatable). */
const SKIP_EXACT = new Set(
  [
    "JSON",
    "CSV",
    "PDF",
    "LTR",
    "RTL",
    "Excel",
    "OpenAPI",
    "GraphQL",
    "cURL",
    "Axios",
    "Parquet",
    "Markdown",
    "HEIC",
    "JPG",
    "PNG",
    "WebP",
    "AVIF",
    "DOCX",
    "XLSX",
    "SVG",
    "JSX",
    "WCAG",
    "AA",
    "AAA",
    "ERP",
    "HTTP",
    "API",
    "ZIP",
    "MD",
  ].map((s) => s.toLowerCase()),
);

function shouldSkipPath(pathStr, val) {
  const t = val.trim();
  if (!t) return true;
  if (SKIP_EXACT.has(t.toLowerCase())) return true;
  if (pathStr.startsWith("nav.") && t.includes("→")) return true;
  if (pathStr.endsWith(".keywords") && t.length < 12 && !/\s/.test(t))
    return true;
  return false;
}

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function flattenStrings(obj, prefix = "") {
  const out = [];
  if (!isPlainObject(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.push([p, v]);
    else out.push(...flattenStrings(v, p));
  }
  return out;
}

function setAt(obj, dotPath, value) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!isPlainObject(cur[part])) cur[part] = {};
    cur = cur[part];
  }
  cur[parts[parts.length - 1]] = value;
}

const TOKEN_RE = /\{[^{}]+\}/g;

function maskPlaceholders(s) {
  const map = new Map();
  let i = 0;
  const masked = s.replace(TOKEN_RE, (m) => {
    const id = `⟦${i++}⟧`;
    map.set(id, m);
    return id;
  });
  return { masked, map };
}

function unmaskPlaceholders(s, map) {
  let out = s;
  for (const [id, original] of map) {
    out = out.split(id).join(original);
  }
  return out;
}

function parseGtxTranslation(json) {
  const row = json?.[0];
  if (!Array.isArray(row)) return "";
  let acc = "";
  for (const seg of row) {
    if (seg && typeof seg[0] === "string") acc += seg[0];
  }
  return acc;
}

async function translateViaGtx(masked, locale) {
  const tl = LOCALE_TO_GTX[locale];
  if (!tl) throw new Error(`No gtx target for locale "${locale}"`);

  const maxChunk = 1400;
  const chunks = [];
  for (let i = 0; i < masked.length; i += maxChunk) {
    chunks.push(masked.slice(i, i + maxChunk));
  }

  let combined = "";
  for (const chunk of chunks) {
    const maxAttempts = 6;
    let chunkAttempts = 0;
    let piece = "";
    while (chunkAttempts < maxAttempts) {
      const url = new URL(
        "https://translate.googleapis.com/translate_a/single",
      );
      url.searchParams.set("client", "gtx");
      url.searchParams.set("sl", "en");
      url.searchParams.set("tl", tl);
      url.searchParams.set("dt", "t");
      url.searchParams.set("q", chunk);

      const res = await fetch(url.toString());
      if (res.status === 429 || res.status === 503) {
        chunkAttempts++;
        const waitMs = Math.min(90_000, 2000 * 2 ** Math.min(chunkAttempts, 5));
        console.warn(`  gtx HTTP ${res.status} — backing off ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }
      if (!res.ok) {
        throw new Error(`gtx HTTP ${res.status}`);
      }

      let json;
      try {
        json = JSON.parse(await res.text());
      } catch {
        throw new Error("gtx: invalid JSON");
      }

      piece = parseGtxTranslation(json);
      if (!piece) throw new Error("gtx: empty translation");
      break;
    }
    if (chunkAttempts >= maxAttempts && !piece) {
      throw new Error("gtx: too many retries");
    }
    combined += piece;
    await sleep(120);
  }

  return combined;
}

function isQuotaOrRateLimitResponse(data, translated) {
  if (data?.responseStatus === 429 || data?.responseStatus === 503) return true;
  if (data?.quotaFinished === true) return true;
  if (
    typeof translated === "string" &&
    translated.includes("MYMEMORY WARNING")
  ) {
    return true;
  }
  return false;
}

async function translateViaLibre(masked, locale) {
  const endpoint = process.env.LIBRETRANSLATE_URL;
  if (!endpoint) {
    throw new Error("LIBRETRANSLATE_URL not set");
  }

  const target = LOCALE_TO_LIBRE[locale];
  if (!target) throw new Error(`No LibreTranslate target for "${locale}"`);

  const key = process.env.LIBRETRANSLATE_API_KEY;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: masked.slice(0, 2500),
      source: "en",
      target,
      format: "text",
      ...(key ? { api_key: key } : {}),
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LibreTranslate HTTP ${res.status}: ${t.slice(0, 100)}`);
  }

  const data = await res.json();
  if (typeof data.translatedText !== "string" || !data.translatedText) {
    throw new Error("LibreTranslate: empty response");
  }
  return data.translatedText;
}

async function translateViaMyMemory(masked, langpair) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", masked.slice(0, 450));
  url.searchParams.set("langpair", langpair);
  const email = process.env.MYMEMORY_EMAIL;
  if (email) url.searchParams.set("de", email);

  const maxAttempts = 8;
  let attempt = 0;

  while (attempt < maxAttempts) {
    const res = await fetch(url.toString());

    if (res.status === 429 || res.status === 503) {
      attempt++;
      const waitMs = Math.min(120_000, 4000 * 2 ** Math.min(attempt, 5));
      console.warn(
        `  MyMemory HTTP ${res.status} — backing off ${waitMs}ms (${attempt}/${maxAttempts})`,
      );
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      throw new Error(`MyMemory HTTP ${res.status}`);
    }

    const data = await res.json();
    const translated = data?.responseData?.translatedText;

    if (isQuotaOrRateLimitResponse(data, translated)) {
      attempt++;
      const waitMs = Math.min(180_000, 8000 * 2 ** Math.min(attempt, 4));
      console.warn(
        `  MyMemory quota — backing off ${waitMs}ms (${attempt}/${maxAttempts})`,
      );
      await sleep(waitMs);
      continue;
    }

    if (typeof translated !== "string") {
      throw new Error("MyMemory: bad response");
    }

    return translated;
  }

  throw new Error("MyMemory: too many retries");
}

/**
 * @param {"gtx" | "libre" | "mymemory" | "auto"} provider
 */
async function translateLine(text, locale, langpair, provider) {
  const { masked, map } = maskPlaceholders(text);
  if (!masked.trim()) return text;

  const runGtx = async () => {
    const raw = await translateViaGtx(masked, locale);
    return unmaskPlaceholders(raw, map);
  };

  const runLibre = async () => {
    const raw = await translateViaLibre(masked, locale);
    return unmaskPlaceholders(raw, map);
  };

  const runMem = async () => {
    const raw = await translateViaMyMemory(masked, langpair);
    return unmaskPlaceholders(raw, map);
  };

  if (provider === "mymemory") return runMem();
  if (provider === "libre") return runLibre();
  if (provider === "gtx") return runGtx();

  // auto
  try {
    return await runGtx();
  } catch (e) {
    console.warn("  gtx failed:", e.message);
  }
  if (process.env.LIBRETRANSLATE_URL) {
    try {
      return await runLibre();
    } catch (e) {
      console.warn("  libre failed:", e.message);
    }
  }
  return runMem();
}

function parseDelayMs(args) {
  const raw = args.find((a) => a.startsWith("--delay-ms="));
  if (raw) {
    const n = Number(raw.slice("--delay-ms=".length));
    if (Number.isFinite(n) && n >= 100) return n;
  }
  return 400;
}

function parseProvider(args) {
  const raw = args.find((a) => a.startsWith("--provider="));
  const v = raw?.slice("--provider=".length).toLowerCase();
  if (v === "mymemory" || v === "libre" || v === "gtx" || v === "auto")
    return v;
  return "gtx";
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const delayMs = parseDelayMs(args);
  const provider = parseProvider(args);
  const targets = args.filter((a) => !a.startsWith("--"));

  if (targets.length === 0) {
    console.error(
      "Usage: node scripts/translate-messages-to-locale.mjs <locale|all> [--dry-run] [--delay-ms=400] [--provider=gtx|libre|mymemory|auto]",
    );
    process.exit(1);
  }

  const en = JSON.parse(
    fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"),
  );
  const enFlat = Object.fromEntries(flattenStrings(en));

  const locales =
    targets[0] === "all"
      ? Object.keys(LANGPAIR)
      : targets.filter((t) => LANGPAIR[t]);

  if (locales.length === 0) {
    console.error(
      "Unknown locale(s). Known:",
      Object.keys(LANGPAIR).join(", "),
    );
    process.exit(1);
  }

  console.log({
    provider,
    delayMsBetweenRequests: delayMs,
    MYMEMORY_EMAIL: !!process.env.MYMEMORY_EMAIL,
    LIBRETRANSLATE_URL: !!process.env.LIBRETRANSLATE_URL,
  });

  for (const locale of locales) {
    const langpair = LANGPAIR[locale];
    const filePath = path.join(messagesDir, `${locale}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const flat = flattenStrings(data);
    const toTranslate = flat.filter(
      ([pathStr, val]) =>
        enFlat[pathStr] === val && !shouldSkipPath(pathStr, val),
    );

    console.log({ locale, identicalToEn: toTranslate.length });

    let done = 0;
    for (const [pathStr, val] of toTranslate) {
      if (dryRun) {
        console.log("  would translate:", pathStr.slice(0, 60));
        continue;
      }
      try {
        const next = await translateLine(val, locale, langpair, provider);
        if (next && next !== val) {
          setAt(data, pathStr, next);
          done++;
          fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
        }
      } catch (e) {
        console.error("  fail:", pathStr, e.message);
        await sleep(Math.max(delayMs, 8000));
      }
      await sleep(delayMs);
    }

    if (!dryRun) {
      fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
      console.log("  updated", locale, "translated", done);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
