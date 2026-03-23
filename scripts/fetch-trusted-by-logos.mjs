#!/usr/bin/env node
/**
 * Re-download curated institution SVGs from Wikimedia Commons (explicit File: titles only).
 *
 * Run: node scripts/fetch-trusted-by-logos.mjs
 *
 * Does not use Commons search (search often returns wrong coats of arms). Add or change
 * entries only after verifying the file on commons.wikimedia.org.
 *
 * Wordmarks maintained by hand (not in this map): toronto, mcgill, hku, nus, ntu, sydney, jhu
 */
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public/trusted-by/logos");

const UA =
  "tablecn-logo-fetch/1.0 (https://csvcn.com; educational project; respects rate limits)";

/** @type {Record<string, string>} Verified Commons titles (omit hand-curated / wordmark IDs). */
const idToTitle = {
  mit: "File:MIT logo.svg",
  stanford: "File:Stanford wordmark (2012).svg",
  princeton: "File:Princeton University Shield.svg",
  caltech: "File:Caltech Logo.svg",
  columbia: "File:Columbia University 1754 updated.svg",
  chicago: "File:University of Chicago wordmark.svg",
  duke: "File:Duke University logo.svg",
  cmu: "File:Carnegie Mellon University wordmark.svg",
  gatech: "File:Georgia Tech logo.svg",
  nu: "File:Northwestern University old wordmark.svg",
  cambridge: "File:University of Cambridge coat of arms.svg",
  imperial: "File:Imperial logo.svg",
  ucl: "File:UCL Crest.svg",
  eth: "File:ETH Zürich Logo black.svg",
  epfl: "File:Logo EPFL 2019.svg",
  tum: "File:Logo of the Technical University of Munich.svg",
  sorbonne: "File:Logo of Sorbonne University.svg",
  kuleuven: "File:KU Leuven logo.svg",
  tsinghua: "File:Tsinghua University Logo.svg",
  peking: "File:Peking University seal.svg",
  utokyo: "File:University of Tokyo logo, basic, horizontal (2004–2024).svg",
  kaist: "File:KAIST logo.svg",
  snu: "File:Seoul national university logotype.svg",
  melbourne: "File:Arms of the University of Melbourne.svg",
  anu: "File:Arms of the Australian National University.svg",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function resolveImageUrl(title) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  u.searchParams.set("action", "query");
  u.searchParams.set("format", "json");
  u.searchParams.set("prop", "imageinfo");
  u.searchParams.set("iiprop", "url");
  u.searchParams.set("titles", title);
  const data = await fetchJson(u.toString());
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing != null) return null;
  return page.imageinfo?.[0]?.url ?? null;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Download ${res.status}`);
  await mkdir(dirname(destPath), { recursive: true });
  await pipeline(res.body, createWriteStream(destPath));
}

async function main() {
  const failures = [];
  for (const [id, title] of Object.entries(idToTitle)) {
    try {
      await sleep(3000);
      const url = await resolveImageUrl(title);
      if (!url) {
        failures.push({ id, title, reason: "missing" });
        console.error(`SKIP ${id}: ${title}`);
        continue;
      }
      await sleep(1000);
      await downloadFile(url, join(outDir, `${id}.svg`));
      console.log(`OK ${id}`);
    } catch (e) {
      failures.push({ id, reason: String(e) });
      console.error(`FAIL ${id}`, e);
    }
  }
  if (failures.length) {
    console.error("Failures:", failures);
    process.exitCode = 1;
  }
}

main();
