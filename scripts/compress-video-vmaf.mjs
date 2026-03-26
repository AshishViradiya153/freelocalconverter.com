#!/usr/bin/env node
/**
 * VMAF-guided video compression.
 *
 * Goal: reduce file size while keeping perceptual quality ~unchanged.
 * Approach: encode with a more efficient codec (default AV1), measure VMAF vs source,
 * then binary-search CRF to hit a target VMAF with the smallest output.
 *
 * Usage:
 *   node scripts/compress-video-vmaf.mjs --in input.mp4 --out output.mp4
 *
 * Options:
 *   --codec av1|hevc           (default: av1)
 *   --targetVmaf 97            (default: 97)
 *   --minCrf 18 --maxCrf 45    (defaults: 18..45)
 *   --preset 10                (svt-av1 preset; default: 10)
 *   --sampleFps 30             (default: 30)
 *   --sampleWidth 960          (default: 960)
 *
 * Notes:
 * - This cannot guarantee “zero quality loss”, but VMAF≥97 is typically visually
 *   indistinguishable for screen-recording style content.
 * - Input is left unchanged (resolution/fps preserved) unless you add extra flags.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function parseArgs(argv) {
  const out = {
    in: null,
    out: null,
    codec: "av1",
    targetVmaf: 97,
    minCrf: 18,
    maxCrf: 45,
    preset: 10,
    sampleFps: 30,
    sampleWidth: 960,
  };

  function read(flag) {
    const idx = argv.indexOf(flag);
    if (idx === -1) return null;
    return argv[idx + 1] ?? null;
  }

  const inPath = read("--in");
  const outPath = read("--out");
  if (inPath) out.in = inPath;
  if (outPath) out.out = outPath;

  const codec = read("--codec");
  if (codec) out.codec = codec;
  const targetVmaf = Number(read("--targetVmaf"));
  if (Number.isFinite(targetVmaf)) out.targetVmaf = targetVmaf;
  const minCrf = Number(read("--minCrf"));
  if (Number.isFinite(minCrf)) out.minCrf = minCrf;
  const maxCrf = Number(read("--maxCrf"));
  if (Number.isFinite(maxCrf)) out.maxCrf = maxCrf;
  const preset = Number(read("--preset"));
  if (Number.isFinite(preset)) out.preset = preset;
  const sampleFps = Number(read("--sampleFps"));
  if (Number.isFinite(sampleFps)) out.sampleFps = sampleFps;
  const sampleWidth = Number(read("--sampleWidth"));
  if (Number.isFinite(sampleWidth)) out.sampleWidth = sampleWidth;

  if (!out.in || !out.out) {
    throw new Error("Missing --in or --out");
  }
  if (out.codec !== "av1" && out.codec !== "hevc") {
    throw new Error("Unsupported --codec (use av1 or hevc)");
  }
  if (!(out.minCrf < out.maxCrf)) {
    throw new Error("--minCrf must be < --maxCrf");
  }

  return out;
}

function run(cmd, args) {
  return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString(
    "utf8",
  );
}

function fileSize(p) {
  return fs.statSync(p).size;
}

function encodeOnce(opts, crf, outPath) {
  const common = ["-y", "-hide_banner", "-loglevel", "error", "-i", opts.in, "-an"];
  if (opts.codec === "av1") {
    run("ffmpeg", [
      ...common,
      "-c:v",
      "libsvtav1",
      "-preset",
      String(opts.preset),
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuv420p",
      outPath,
    ]);
    return;
  }
  // hevc
  run("ffmpeg", [
    ...common,
    "-c:v",
    "libx265",
    "-crf",
    String(crf),
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    outPath,
  ]);
}

function vmafScore(opts, encodedPath, logPath) {
  // Compare at a fixed sampling rate & width for speed; relative VMAF remains useful.
  const f = [
    `[0:v]fps=${opts.sampleFps},scale=${opts.sampleWidth}:-2:flags=bicubic,format=yuv420p[ref]`,
    `[1:v]fps=${opts.sampleFps},scale=${opts.sampleWidth}:-2:flags=bicubic,format=yuv420p[dist]`,
    `[dist][ref]libvmaf=log_fmt=json:log_path=${logPath}`,
  ].join(";");

  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    opts.in,
    "-i",
    encodedPath,
    "-lavfi",
    f,
    "-f",
    "null",
    "-",
  ]);

  const j = JSON.parse(fs.readFileSync(logPath, "utf8"));
  const mean = j.pooled_metrics?.vmaf?.mean ?? null;
  if (!Number.isFinite(mean)) throw new Error("Failed to read VMAF mean");
  return mean;
}

function pickTempFile(name) {
  return path.join(os.tmpdir(), `${name}-${crypto.randomUUID()}.mp4`);
}

function pickTempJson(name) {
  return path.join(os.tmpdir(), `${name}-${crypto.randomUUID()}.json`);
}

function formatPct(x) {
  return `${Math.round(x * 10) / 10}%`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const srcSize = fileSize(opts.in);

  let lo = opts.minCrf;
  let hi = opts.maxCrf;
  let best = null;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const tempOut = pickTempFile(`encode-${opts.codec}-crf${mid}`);
    const tempLog = pickTempJson(`vmaf-${mid}`);

    encodeOnce(opts, mid, tempOut);
    const vmaf = vmafScore(opts, tempOut, tempLog);
    const size = fileSize(tempOut);

    process.stdout.write(
      JSON.stringify(
        {
          crf: mid,
          vmaf: Math.round(vmaf * 1000) / 1000,
          size_bytes: size,
          size_reduction: formatPct(((srcSize - size) / srcSize) * 100),
        },
        null,
        0,
      ) + "\n",
    );

    if (vmaf >= opts.targetVmaf) {
      // High quality: try higher CRF (smaller file)
      if (!best || size < best.size) best = { crf: mid, vmaf, size, tempOut };
      lo = mid + 1;
    } else {
      // Too lossy: try lower CRF (bigger file)
      hi = mid - 1;
      try {
        fs.unlinkSync(tempOut);
      } catch { }
    }
  }

  if (!best) {
    throw new Error(
      `Could not reach targetVmaf=${opts.targetVmaf} within CRF ${opts.minCrf}..${opts.maxCrf}`,
    );
  }

  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.copyFileSync(best.tempOut, opts.out);
  const finalSize = fileSize(opts.out);

  process.stdout.write(
    JSON.stringify(
      {
        chosen: {
          codec: opts.codec,
          crf: best.crf,
          vmaf: Math.round(best.vmaf * 1000) / 1000,
          out: opts.out,
          size_bytes: finalSize,
          size_reduction: formatPct(((srcSize - finalSize) / srcSize) * 100),
        },
      },
      null,
      2,
    ) + "\n",
  );
}

main().catch((e) => {
  console.error(e?.stack || String(e));
  process.exitCode = 1;
});

