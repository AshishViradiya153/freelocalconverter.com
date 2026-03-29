/**
 * Ensures every messages/*.json (except en) contains all keys from en.json.
 * For missing keys, copies the English string (build-time fill). Run after adding keys to en.json.
 * Locale-specific translations are preserved where they already exist.
 *
 * After this, `src/i18n/request.ts` can load only the active locale file with no runtime merge.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Same semantics as former runtime merge: English base, locale overrides win. */
function mergeEnBase(enTree, localeTree) {
  if (!isPlainObject(enTree)) return structuredClone(enTree);
  const locale = isPlainObject(localeTree) ? localeTree : {};
  const out = {};
  for (const [key, enVal] of Object.entries(enTree)) {
    const locVal = locale[key];
    if (isPlainObject(enVal)) {
      out[key] = mergeEnBase(enVal, locVal);
      continue;
    }
    if (locVal !== undefined && locVal !== null && locVal !== "") {
      out[key] = locVal;
      continue;
    }
    out[key] = enVal;
  }
  return out;
}

const enPath = path.join(messagesDir, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

for (const name of fs.readdirSync(messagesDir)) {
  if (!name.endsWith(".json") || name === "en.json") continue;
  const filePath = path.join(messagesDir, name);
  const localeData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const merged = mergeEnBase(en, localeData);
  fs.writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log("synced", name);
}
