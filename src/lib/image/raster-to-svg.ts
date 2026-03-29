/**
 * Raster → SVG via [Vision Cortex VTracer](https://github.com/visioncortex/vtracer) (Rust/WASM).
 *
 * Config must match `vtracer-wasm` `src/lib.rs` (serde camelCase, see that crate, not the CLI JSON).
 */

export type SvgTracePreset = "fast" | "balanced" | "high";

export interface RasterTraceOptions {
  preset?: SvgTracePreset;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

const PRESET_CAPS: Record<
  SvgTracePreset,
  { maxDim: number; maxPixels: number }
> = {
  fast: { maxDim: 768, maxPixels: 520_000 },
  balanced: { maxDim: 1024, maxPixels: 1_050_000 },
  high: { maxDim: 2048, maxPixels: 4_200_000 },
};

/**
 * Downscale dimensions for tracing while preserving aspect ratio.
 * Display size stays the full image size for the final SVG viewport.
 */
export function getTraceDimensions(
  width: number,
  height: number,
  preset: SvgTracePreset,
): {
  tracedWidth: number;
  tracedHeight: number;
  displayWidth: number;
  displayHeight: number;
} {
  const displayWidth = Math.max(1, Math.floor(width));
  const displayHeight = Math.max(1, Math.floor(height));
  const caps = PRESET_CAPS[preset];

  const scale = Math.min(
    caps.maxDim / Math.max(displayWidth, displayHeight),
    Math.sqrt(caps.maxPixels / (displayWidth * displayHeight)),
    1,
  );

  const tracedWidth = Math.max(1, Math.round(displayWidth * scale));
  const tracedHeight = Math.max(
    1,
    Math.round((tracedWidth * displayHeight) / displayWidth),
  );

  return { tracedWidth, tracedHeight, displayWidth, displayHeight };
}

export function getVtracerConfig(
  preset: SvgTracePreset,
): Record<string, unknown> {
  const splineBase = {
    binary: false,
    mode: "spline",
    hierarchical: "stacked",
    lengthThreshold: 4,
    maxIterations: 10,
    pathPrecision: 2,
    cornerThreshold: degToRad(60),
    spliceThreshold: degToRad(45),
  };

  if (preset === "fast") {
    return {
      ...splineBase,
      filterSpeckle: 64,
      colorPrecision: 5,
      layerDifference: 24,
      cornerThreshold: degToRad(90),
    };
  }

  if (preset === "balanced") {
    return {
      ...splineBase,
      filterSpeckle: 16,
      colorPrecision: 2,
      layerDifference: 16,
    };
  }

  return {
    ...splineBase,
    filterSpeckle: 100,
    colorPrecision: 0,
    layerDifference: 48,
    cornerThreshold: degToRad(180),
    spliceThreshold: degToRad(45),
  };
}

let vtracerLoad: Promise<typeof import("vtracer-wasm")> | null = null;

async function loadVtracer(): Promise<typeof import("vtracer-wasm")> {
  if (typeof window === "undefined") {
    throw new Error("SVG vectorization runs in the browser only.");
  }
  if (!vtracerLoad) {
    vtracerLoad = import("vtracer-wasm").then(async (mod) => {
      const wasmUrl = `${window.location.origin}/wasm/vtracer.wasm`;
      await mod.default({ module_or_path: fetch(wasmUrl) });
      return mod;
    });
  }
  return vtracerLoad;
}

/**
 * VTracer emits: `<?xml…?>`, then `<!-- Generator: visioncortex VTracer … -->`, then `<svg …>`.
 * Stripping only the XML declaration leaves a comment first, so we must remove that preamble too.
 */
export function normalizeTracerSvgOutput(svg: string): string {
  let s = svg.trim().replace(/^\uFEFF/, "");
  s = s.replace(/^<\?xml[\s\S]*?\?>\s*/i, "");
  while (/^<!--/.test(s)) {
    s = s.replace(/^<!--[\s\S]*?-->\s*/, "");
  }
  s = s.trimStart();
  if (!/^<\s*svg\b/i.test(s)) {
    throw new Error("Vector tracer returned invalid SVG output.");
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${s}`;
}

/**
 * Paths are in **traced** pixel space (same as the canvas passed to VTracer). If we only set
 * `width`/`height` to the **original** image size without `viewBox`, user units no longer match
 * path coordinates → wrong scale, letterboxing, or seam-like “borders”. We set
 * `viewBox="0 0 tracedW tracedH"` so the graphic scales cleanly to the download dimensions.
 * Use `preserveAspectRatio="none"` so the viewBox always fills `width`/`height`. `meet` would
 * letterbox when integer traced size drifts slightly from the display aspect ratio (thin “borders”).
 */
export function applyTracerSvgViewport(
  svg: string,
  displayW: number,
  displayH: number,
  tracedW: number,
  tracedH: number,
): string {
  const w = Math.round(displayW);
  const h = Math.round(displayH);
  const vbW = Math.max(1, Math.round(tracedW));
  const vbH = Math.max(1, Math.round(tracedH));
  return svg.replace(/<svg([^>]*)>/i, (_full, inner: string) => {
    const cleaned = String(inner)
      .replace(/\s+width="[^"]*"/gi, "")
      .replace(/\s+height="[^"]*"/gi, "")
      .replace(/\s+viewBox="[^"]*"/gi, "")
      .replace(/\s+preserveAspectRatio="[^"]*"/gi, "");
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="none" shape-rendering="geometricPrecision"${cleaned}>`;
  });
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Tight RGBA buffer length = width × height × 4 (copy so WASM always sees a dense Vec). */
function canvasToRgbaBytes(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not read canvas pixels for SVG tracing.");
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const expected = width * height * 4;
  if (imageData.data.byteLength < expected) {
    throw new Error("Unexpected ImageData size for SVG tracing.");
  }
  return new Uint8Array(
    imageData.data.buffer,
    imageData.data.byteOffset,
    expected,
  );
}

function scaleCanvasTo(
  source: HTMLCanvasElement,
  tw: number,
  th: number,
): HTMLCanvasElement {
  const out = createCanvas(tw, th);
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Could not create trace canvas.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, tw, th);
  return out;
}

export async function traceRasterCanvasToSvg(
  canvas: HTMLCanvasElement,
  options?: RasterTraceOptions,
): Promise<string> {
  const preset = options?.preset ?? "balanced";
  const width = Math.max(1, Math.floor(canvas.width));
  const height = Math.max(1, Math.floor(canvas.height));

  const { tracedWidth, tracedHeight, displayWidth, displayHeight } =
    getTraceDimensions(width, height, preset);

  const traceCanvas =
    tracedWidth === width && tracedHeight === height
      ? canvas
      : scaleCanvasTo(canvas, tracedWidth, tracedHeight);

  const w = traceCanvas.width;
  const h = traceCanvas.height;
  const pixels = canvasToRgbaBytes(traceCanvas);
  if (pixels.length !== w * h * 4) {
    throw new Error("Pixel buffer size does not match canvas dimensions.");
  }

  const mod = await loadVtracer();
  const config = getVtracerConfig(preset);
  const svgRaw = mod.to_svg(pixels, w, h, config);
  const normalized = normalizeTracerSvgOutput(svgRaw);
  return applyTracerSvgViewport(normalized, displayWidth, displayHeight, w, h);
}
