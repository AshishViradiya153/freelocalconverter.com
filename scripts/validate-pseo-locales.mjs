/**
 * Ensures every messages/*.json has the same `pseo` string leaves as en.json.
 * Catches missing keys before `next build` (e.g. pseo.relatedImageConvertTitle).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

function leafKeys(obj, prefix = "") {
  const out = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.push(p);
    else out.push(...leafKeys(v, p));
  }
  return out;
}

const enPath = path.join(messagesDir, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const expected = leafKeys(en.pseo).sort();
if (expected.length === 0) {
  console.error("en.json: pseo has no string leaves");
  process.exit(1);
}

let failed = false;
for (const name of fs.readdirSync(messagesDir)) {
  if (!name.endsWith(".json")) continue;
  const data = JSON.parse(
    fs.readFileSync(path.join(messagesDir, name), "utf8"),
  );
  if (!data.pseo) {
    console.error(`${name}: missing pseo`);
    failed = true;
    continue;
  }
  const actual = leafKeys(data.pseo).sort();
  const expSet = new Set(expected);
  const actSet = new Set(actual);
  const missing = expected.filter((k) => !actSet.has(k));
  const extra = actual.filter((k) => !expSet.has(k));
  const empty = actual.filter((k) => {
    const parts = k.split(".");
    let o = data.pseo;
    for (const part of parts) o = o?.[part];
    return typeof o === "string" && o.trim() === "";
  });
  if (missing.length || extra.length || empty.length) {
    console.error(`${name}:`);
    if (missing.length) console.error("  missing keys:", missing.join(", "));
    if (extra.length) console.error("  extra keys:", extra.join(", "));
    if (empty.length) console.error("  empty strings:", empty.join(", "));
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(
  `pseo OK: ${expected.length} keys × ${fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json")).length} locales`,
);
