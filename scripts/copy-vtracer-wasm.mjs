#!/usr/bin/env node
/**
 * Copies vtracer WASM into `public/wasm/` so the client can fetch it same-origin.
 *
 * The published package names the file `vtracer.wasm`, but `vtracer.js` falls back to
 * `new URL('vtracer_bg.wasm', import.meta.url)` when init gets no path. Turbopack/Next
 * still resolves that static URL at build time — so we also place `vtracer_bg.wasm` next
 * to `vtracer.js` (same bytes as `vtracer.wasm`).
 */

import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const pkgDir = path.join(root, "node_modules", "vtracer-wasm");
const src = path.join(pkgDir, "vtracer.wasm");
const outDir = path.join(root, "public", "wasm");
const destPublic = path.join(outDir, "vtracer.wasm");
const destBundlerAlias = path.join(pkgDir, "vtracer_bg.wasm");

async function main() {
  await mkdir(outDir, { recursive: true });
  await copyFile(src, destPublic);
  await copyFile(src, destBundlerAlias);
  // eslint-disable-next-line no-console
  console.log(`Copied vtracer.wasm to ${destPublic} and ${destBundlerAlias}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e?.stack || String(e));
  process.exitCode = 1;
});
