/**
 * Trending mesh presets: writes `public/data/trending-mesh-gradients.json` (used by the app)
 * and `public/data/trending-mesh-gradients.csv` (editable source of truth you can round-trip).
 *
 * Does **not** read or write `best-palettes.csv` or `best-gradients.csv`.
 *
 * Usage:
 *   pnpm generate:trending-mesh
 *     → regenerate 500 presets, write JSON + CSV
 *   pnpm exec tsx scripts/generate-trending-mesh-gradients.ts --from-csv
 *     → read CSV only, rebuild JSON (after hand-editing CSV)
 *   pnpm exec tsx scripts/generate-trending-mesh-gradients.ts --json-to-csv
 *     → read existing JSON, write CSV only (no regeneration)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Papa from "papaparse";

import { repositionCirclesAvoidOverlap } from "../src/lib/mesh-gradient/circle-layout";
import { createMulberry32 } from "../src/lib/mesh-gradient/mulberry32";
import { generateHarmoniousMeshPalette } from "../src/lib/mesh-gradient/palette";
import type {
  TrendingMeshGradientFile,
  TrendingMeshGradientItem,
} from "../src/lib/mesh-gradient/trending-mesh-types";
import type { CircleProps } from "../src/lib/mesh-gradient/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const OUT_JSON = path.join(DATA_DIR, "trending-mesh-gradients.json");
const OUT_CSV = path.join(DATA_DIR, "trending-mesh-gradients.csv");

const COUNT = 500;
const SEED_PRIME = 1_000_003;

const CSV_COLUMNS = [
  "id",
  "name",
  "backgroundColor",
  "blur",
  "saturation",
  "contrast",
  "brightness",
  "grainIntensity",
  "circles",
] as const;

function generateItems(): TrendingMeshGradientItem[] {
  const items: TrendingMeshGradientItem[] = [];

  for (let i = 0; i < COUNT; i++) {
    const rnd = createMulberry32((i + 1) * SEED_PRIME);
    const { backgroundColor, circleColors } =
      generateHarmoniousMeshPalette(rnd);

    const circles = repositionCirclesAvoidOverlap(
      circleColors.map((color) => ({
        color,
        cx: rnd() * 100,
        cy: rnd() * 100,
      })),
      rnd,
    );

    items.push({
      id: i + 1,
      name: `Trending mesh ${i + 1}`,
      backgroundColor,
      circles,
      blur: 600,
      saturation: 100,
      contrast: 100,
      brightness: 100,
      grainIntensity: 25,
    });
  }

  return items;
}

function itemsToCsvRows(items: TrendingMeshGradientItem[]) {
  return items.map((item) => ({
    id: String(item.id),
    name: item.name,
    backgroundColor: item.backgroundColor,
    blur: String(item.blur),
    saturation: String(item.saturation),
    contrast: String(item.contrast),
    brightness: String(item.brightness),
    grainIntensity: String(item.grainIntensity),
    circles: JSON.stringify(item.circles),
  }));
}

async function writeJson(payload: TrendingMeshGradientFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(OUT_JSON, `${JSON.stringify(payload)}\n`, "utf8");
}

async function writeCsv(items: TrendingMeshGradientItem[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const csv = Papa.unparse(itemsToCsvRows(items), {
    columns: [...CSV_COLUMNS],
    header: true,
    newline: "\n",
  });
  await fs.writeFile(OUT_CSV, `${csv}\n`, "utf8");
}

function parseCsvToItems(text: string): TrendingMeshGradientItem[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => String(h).trim(),
  });

  if (parsed.errors.length > 0) {
    const msg = parsed.errors.map((e) => e.message).join("; ");
    throw new Error(`CSV parse error: ${msg}`);
  }

  const items: TrendingMeshGradientItem[] = [];

  for (const r of parsed.data) {
    if (!r || Object.keys(r).length === 0) continue;

    const id = Number(r.id);
    const blur = Number(r.blur);
    const saturation = Number(r.saturation);
    const contrast = Number(r.contrast);
    const brightness = Number(r.brightness);
    const grainIntensity = Number(r.grainIntensity);
    const name = String(r.name ?? "").trim();
    const backgroundColor = String(r.backgroundColor ?? "").trim();
    const circlesRaw = r.circles;

    if (
      !Number.isFinite(id) ||
      !name ||
      !backgroundColor ||
      circlesRaw == null ||
      circlesRaw === ""
    ) {
      continue;
    }

    let circles: CircleProps[];
    try {
      const parsedCircles = JSON.parse(circlesRaw) as unknown;
      if (!Array.isArray(parsedCircles)) throw new Error("circles not array");
      circles = parsedCircles.map((raw) => {
        const c = raw as { color?: string; cx?: number; cy?: number };
        return {
          color: String(c.color ?? "#000000"),
          cx: Number(c.cx),
          cy: Number(c.cy),
        };
      });
      if (
        circles.some((c) => !Number.isFinite(c.cx) || !Number.isFinite(c.cy))
      ) {
        throw new Error("invalid cx/cy");
      }
    } catch {
      throw new Error(`Invalid circles JSON for row id=${r.id}`);
    }

    items.push({
      id,
      name,
      backgroundColor,
      circles,
      blur: Number.isFinite(blur) ? blur : 600,
      saturation: Number.isFinite(saturation) ? saturation : 100,
      contrast: Number.isFinite(contrast) ? contrast : 100,
      brightness: Number.isFinite(brightness) ? brightness : 100,
      grainIntensity: Number.isFinite(grainIntensity) ? grainIntensity : 25,
    });
  }

  items.sort((a, b) => a.id - b.id);
  return items;
}

async function modeFromCsv() {
  const text = await fs.readFile(OUT_CSV, "utf8");
  const items = parseCsvToItems(text);
  if (items.length === 0) {
    throw new Error(`No valid rows in ${OUT_CSV}`);
  }
  const payload: TrendingMeshGradientFile = { version: 1, items };
  await writeJson(payload);
  console.log({ mode: "from-csv", wroteJson: OUT_JSON, count: items.length });
}

async function modeJsonToCsv() {
  const raw = await fs.readFile(OUT_JSON, "utf8");
  const data = JSON.parse(raw) as TrendingMeshGradientFile;
  if (!Array.isArray(data.items)) {
    throw new Error("Invalid JSON: missing items array");
  }
  await writeCsv(data.items);
  console.log({
    mode: "json-to-csv",
    wroteCsv: OUT_CSV,
    count: data.items.length,
  });
}

async function modeGenerate() {
  const items = generateItems();
  const payload: TrendingMeshGradientFile = { version: 1, items };
  await writeJson(payload);
  await writeCsv(items);
  console.log({
    mode: "generate",
    wroteJson: OUT_JSON,
    wroteCsv: OUT_CSV,
    count: items.length,
    note: "Did not modify best-palettes.csv or best-gradients.csv",
  });
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--from-csv")) {
    await modeFromCsv();
    return;
  }
  if (argv.includes("--json-to-csv")) {
    await modeJsonToCsv();
    return;
  }
  await modeGenerate();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
