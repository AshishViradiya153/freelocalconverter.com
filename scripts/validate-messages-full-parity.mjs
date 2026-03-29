/**
 * Fails if any locale is missing keys present in en.json or has empty string leaves.
 * Run: `node scripts/validate-messages-full-parity.mjs`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @returns {string[]} dot paths to string leaves */
function stringLeafPaths(obj, prefix = "") {
  const out = [];
  if (!isPlainObject(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out.push(p);
      continue;
    }
    if (isPlainObject(v)) out.push(...stringLeafPaths(v, p));
  }
  return out;
}

function getAt(obj, dotPath) {
  let cur = obj;
  for (const part of dotPath.split(".")) {
    cur = cur?.[part];
  }
  return cur;
}

const enPath = path.join(messagesDir, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const expectedPaths = stringLeafPaths(en).sort();

let failed = false;
for (const name of fs.readdirSync(messagesDir)) {
  if (!name.endsWith(".json") || name === "en.json") continue;
  const data = JSON.parse(
    fs.readFileSync(path.join(messagesDir, name), "utf8"),
  );
  const missing = [];
  const empty = [];
  for (const pathStr of expectedPaths) {
    const v = getAt(data, pathStr);
    if (typeof v !== "string") missing.push(pathStr);
    else if (v.trim() === "") empty.push(pathStr);
  }
  const extra = stringLeafPaths(data).filter((p) => !expectedPaths.includes(p));
  if (missing.length || empty.length || extra.length) {
    console.error(`${name}:`);
    if (missing.length)
      console.error(
        "  missing:",
        missing.slice(0, 20).join(", "),
        missing.length > 20 ? `… (+${missing.length - 20})` : "",
      );
    if (empty.length)
      console.error(
        "  empty:",
        empty.slice(0, 20).join(", "),
        empty.length > 20 ? `… (+${empty.length - 20})` : "",
      );
    if (extra.length)
      console.error(
        "  extra (not in en):",
        extra.slice(0, 15).join(", "),
        extra.length > 15 ? `… (+${extra.length - 15})` : "",
      );
    failed = true;
  }
}

if (failed) {
  console.error(
    "\nFix: run `node scripts/sync-messages-from-en.mjs` then translate new strings.",
  );
  process.exit(1);
}
console.log(
  `messages parity OK: ${expectedPaths.length} string leaves × ${fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json")).length - 1} locales`,
);
