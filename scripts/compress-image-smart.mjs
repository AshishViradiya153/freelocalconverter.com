import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

function parseArgs(argv) {
  const args = {
    in: "",
    out: "",
    minSsim: 0.985,
    maxMetricPixels: 2_000_000,
  };

  function read(flag) {
    const idx = argv.indexOf(flag);
    if (idx === -1) return null;
    return argv[idx + 1] ?? null;
  }

  const inPath = read("--in");
  const outPath = read("--out");
  const minSsimRaw = read("--minSsim");
  const maxMetricPixelsRaw = read("--maxMetricPixels");
  const minSsim = minSsimRaw === null ? Number.NaN : Number(minSsimRaw);
  const maxMetricPixels = maxMetricPixelsRaw === null ? Number.NaN : Number(maxMetricPixelsRaw);

  if (inPath) args.in = inPath;
  if (outPath) args.out = outPath;
  if (Number.isFinite(minSsim)) args.minSsim = minSsim;
  if (Number.isFinite(maxMetricPixels)) args.maxMetricPixels = maxMetricPixels;

  if (!args.in || !args.out) throw new Error("Missing --in or --out");
  return args;
}

function toLuma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function resolveMetricSize(width, height, maxPixels) {
  const pixels = width * height;
  if (pixels <= maxPixels) return { width, height };
  const scale = Math.sqrt(maxPixels / pixels);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

function calcSsimLuma(rgbaA, rgbaB) {
  // Global SSIM approximation over luminance channel.
  const c1 = 6.5025;
  const c2 = 58.5225;
  const n = rgbaA.length / 4;

  let meanA = 0;
  let meanB = 0;

  for (let i = 0; i < rgbaA.length; i += 4) {
    meanA += toLuma(rgbaA[i], rgbaA[i + 1], rgbaA[i + 2]);
    meanB += toLuma(rgbaB[i], rgbaB[i + 1], rgbaB[i + 2]);
  }

  meanA /= n;
  meanB /= n;

  let varA = 0;
  let varB = 0;
  let covAB = 0;

  for (let i = 0; i < rgbaA.length; i += 4) {
    const la = toLuma(rgbaA[i], rgbaA[i + 1], rgbaA[i + 2]) - meanA;
    const lb = toLuma(rgbaB[i], rgbaB[i + 1], rgbaB[i + 2]) - meanB;
    varA += la * la;
    varB += lb * lb;
    covAB += la * lb;
  }

  const denom = n - 1;
  if (denom > 0) {
    varA /= denom;
    varB /= denom;
    covAB /= denom;
  }

  const num = (2 * meanA * meanB + c1) * (2 * covAB + c2);
  const den = (meanA * meanA + meanB * meanB + c1) * (varA + varB + c2);
  return den === 0 ? 0 : num / den;
}

async function getRawRgba(buffer, width, height) {
  const { data } = await sharp(buffer)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

async function encodeCandidate(inputBuffer, candidate) {
  if (candidate.format === "jpeg") {
    return sharp(inputBuffer).jpeg({
      quality: candidate.quality,
      mozjpeg: true,
      chromaSubsampling: "4:4:4",
    }).toBuffer();
  }

  if (candidate.format === "webp") {
    return sharp(inputBuffer).webp({
      quality: candidate.quality,
      effort: 6,
      smartSubsample: true,
    }).toBuffer();
  }

  if (candidate.format === "avif") {
    return sharp(inputBuffer).avif({
      quality: candidate.quality,
      effort: 9,
      chromaSubsampling: "4:4:4",
    }).toBuffer();
  }

  if (candidate.format === "png") {
    return sharp(inputBuffer).png({
      compressionLevel: 9,
      palette: true,
      quality: candidate.quality,
      effort: 10,
      dither: 1,
    }).toBuffer();
  }

  throw new Error(`Unsupported format ${candidate.format}`);
}

function makeCandidates(hasAlpha) {
  const list = [];
  for (const quality of [95, 90, 85, 80, 75, 70, 65, 60]) {
    if (!hasAlpha) list.push({ format: "jpeg", quality });
    list.push({ format: "webp", quality });
    list.push({ format: "avif", quality });
    list.push({ format: "png", quality });
  }
  return list;
}

function withExt(outPath, ext) {
  const parsed = path.parse(outPath);
  return path.join(parsed.dir, `${parsed.name}.${ext}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputBuffer = fs.readFileSync(args.in);
  const srcStat = fs.statSync(args.in);
  const srcMeta = await sharp(inputBuffer).metadata();
  const width = srcMeta.width ?? 0;
  const height = srcMeta.height ?? 0;
  if (!width || !height) throw new Error("Cannot read input dimensions");

  const metricSize = resolveMetricSize(width, height, args.maxMetricPixels);
  const srcMetricRaw = await getRawRgba(inputBuffer, metricSize.width, metricSize.height);
  const hasAlpha = Boolean(srcMeta.hasAlpha);
  const candidates = makeCandidates(hasAlpha);

  let best = null;
  const results = [];

  for (const candidate of candidates) {
    try {
      const encoded = await encodeCandidate(inputBuffer, candidate);
      const encodedRaw = await getRawRgba(encoded, metricSize.width, metricSize.height);
      const ssim = calcSsimLuma(srcMetricRaw, encodedRaw);
      const result = {
        ...candidate,
        ssim: Number(ssim.toFixed(5)),
        sizeBytes: encoded.byteLength,
      };
      results.push(result);

      if (ssim >= args.minSsim) {
        if (!best || encoded.byteLength < best.sizeBytes) {
          best = {
            ...result,
            encoded,
          };
        }
      }
    } catch {
      // Some encoders can fail for specific images/settings, skip safely.
    }
  }

  if (!best) {
    throw new Error(
      `No candidate reached minSsim=${args.minSsim}. Try lower threshold (e.g. --minSsim 0.97).`,
    );
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  const outPath = withExt(args.out, best.format);
  fs.writeFileSync(outPath, best.encoded);

  const summary = {
    input: args.in,
    output: outPath,
    selected: {
      format: best.format,
      quality: best.quality,
      ssim: best.ssim,
      sizeBytes: best.sizeBytes,
      sizeReductionPct: Number((((srcStat.size - best.sizeBytes) / srcStat.size) * 100).toFixed(2)),
    },
    source: {
      sizeBytes: srcStat.size,
      width,
      height,
      hasAlpha,
    },
    metric: {
      minSsim: args.minSsim,
      width: metricSize.width,
      height: metricSize.height,
    },
    topCandidates: results
      .filter((item) => item.ssim >= args.minSsim)
      .sort((a, b) => a.sizeBytes - b.sizeBytes)
      .slice(0, 8),
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
