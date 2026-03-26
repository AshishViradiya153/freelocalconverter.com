import fs from "node:fs";
import path from "node:path";

function isPlainObject(v) {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function syncFromEn(enValue, localeValue) {
  // If enValue is an object, locale must be an object with same keys.
  if (isPlainObject(enValue)) {
    const out = {};
    const src = isPlainObject(localeValue) ? localeValue : {};

    for (const [k, enChild] of Object.entries(enValue)) {
      out[k] = syncFromEn(enChild, src[k]);
    }

    return out;
  }

  // For leaves: keep locale translation if present, otherwise fallback to en leaf.
  if (typeof localeValue === "string" && localeValue.length > 0) return localeValue;
  if (typeof localeValue === "number" || typeof localeValue === "boolean") return localeValue;
  return enValue;
}

function main() {
  const messagesDir = path.resolve(process.cwd(), "messages");
  const files = fs
    .readdirSync(messagesDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const enPath = path.join(messagesDir, "en.json");
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

  for (const file of files) {
    if (file === "en.json") continue;
    const fullPath = path.join(messagesDir, file);
    const locale = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    const synced = syncFromEn(en, locale);
    fs.writeFileSync(fullPath, `${JSON.stringify(synced, null, 2)}\n`, "utf8");
  }

  // Ensure en itself ends with newline and consistent formatting.
  fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`, "utf8");
}

main();

