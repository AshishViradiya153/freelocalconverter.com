/**
 * Overwrites `toolMeta`, `pageMeta`, and `imageConvertPair.keywordsLine` in every
 * non-English messages/*.json with the current English copy so locales match
 * before `translate-messages-to-locale.mjs`.
 *
 * Run after: `pnpm run messages:seed-tool-meta` and editing `messages/en.json` SEO.
 * Then: `node scripts/translate-messages-to-locale.mjs all --delay-ms=300`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");
const enPath = path.join(messagesDir, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

if (!en.toolMeta || !en.pageMeta) {
  console.error("en.json must define toolMeta and pageMeta");
  process.exit(1);
}

const toolMeta = structuredClone(en.toolMeta);
const pageMeta = structuredClone(en.pageMeta);

for (const name of fs.readdirSync(messagesDir)) {
  if (!name.endsWith(".json") || name === "en.json") continue;
  const filePath = path.join(messagesDir, name);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  data.toolMeta = structuredClone(toolMeta);
  data.pageMeta = structuredClone(pageMeta);
  if (en.imageConvertPair?.keywordsLine && data.imageConvertPair) {
    data.imageConvertPair.keywordsLine = en.imageConvertPair.keywordsLine;
  }
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log("reset toolMeta + pageMeta:", name);
}
