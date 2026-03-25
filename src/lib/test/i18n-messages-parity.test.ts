import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function flattenKeys(
  value: unknown,
  prefix = "",
  out = new Set<string>(),
): Set<string> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const next = prefix ? `${prefix}.${key}` : key;
      flattenKeys(child, next, out);
    }
    return out;
  }

  out.add(prefix);
  return out;
}

describe("i18n message parity", () => {
  it("all locale message files contain the same keys as en.json", () => {
    const messagesDir = path.resolve(process.cwd(), "messages");
    const files = fs
      .readdirSync(messagesDir)
      .filter((file) => file.endsWith(".json"))
      .sort();

    const enPath = path.join(messagesDir, "en.json");
    const en = JSON.parse(fs.readFileSync(enPath, "utf8")) as unknown;
    const enKeys = flattenKeys(en);

    const failures: Array<{ file: string; missing: string[]; extra: string[] }> =
      [];

    for (const file of files) {
      if (file === "en.json") continue;
      const fullPath = path.join(messagesDir, file);
      const json = JSON.parse(fs.readFileSync(fullPath, "utf8")) as unknown;
      const keys = flattenKeys(json);

      const missing = [...enKeys].filter((k) => !keys.has(k)).sort();
      const extra = [...keys].filter((k) => !enKeys.has(k)).sort();
      if (missing.length > 0 || extra.length > 0) {
        failures.push({ file, missing, extra });
      }
    }

    expect(failures).toEqual([]);
  });
});

