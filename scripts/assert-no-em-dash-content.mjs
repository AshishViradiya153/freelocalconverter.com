/**
 * Fails if U+2014 (em dash) appears in product copy under `messages/` or `src/`.
 * Prefer commas, periods, colons, or " - " for breaks humans actually type.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EM_DASH = "\u2014";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const roots = [
  path.join(__dirname, "..", "messages"),
  path.join(__dirname, "..", "src"),
];

const SKIP_DIR = new Set(["node_modules", ".next", "dist"]);

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIR.has(name)) continue;
      walk(p, acc);
    } else if (/\.(json|ts|tsx|mdx)$/.test(name)) {
      acc.push(p);
    }
  }
}

const files = [];
for (const root of roots) {
  if (fs.existsSync(root)) walk(root, files);
}

const hits = [];
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  if (text.includes(EM_DASH)) hits.push(f);
}

if (hits.length > 0) {
  console.error("Em dash (U+2014) is not allowed in messages/ or src/ copy:\n");
  for (const f of hits) console.error(`  ${f}`);
  process.exit(1);
}
