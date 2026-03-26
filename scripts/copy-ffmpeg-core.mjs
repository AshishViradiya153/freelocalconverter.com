#!/usr/bin/env node
/**
 * Copies ffmpeg.wasm core assets into `public/ffmpeg-core/` so the app can load
 * them from the same origin (more reliable than CDNs; avoids adblock/CSP issues).
 */

import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const srcDir = path.join(root, "node_modules", "@ffmpeg", "core", "dist");
const outDir = path.join(root, "public", "ffmpeg-core");

async function main() {
  await mkdir(outDir, { recursive: true });
  await cp(srcDir, outDir, { recursive: true });
  // eslint-disable-next-line no-console
  console.log(`Copied ffmpeg core assets to ${outDir}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e?.stack || String(e));
  process.exitCode = 1;
});

