import { describe, expect, it } from "vitest";

import {
  applyTracerSvgViewport,
  getTraceDimensions,
  getVtracerConfig,
  normalizeTracerSvgOutput,
} from "@/lib/image/raster-to-svg";

describe("getTraceDimensions", () => {
  it("keeps modest sizes at full resolution for balanced", () => {
    const d = getTraceDimensions(800, 600, "balanced");
    expect(d.displayWidth).toBe(800);
    expect(d.displayHeight).toBe(600);
    expect(d.tracedWidth).toBe(800);
    expect(d.tracedHeight).toBe(600);
  });

  it("downscales large images for fast preset", () => {
    const d = getTraceDimensions(4000, 3000, "fast");
    expect(d.displayWidth).toBe(4000);
    expect(d.displayHeight).toBe(3000);
    expect(Math.max(d.tracedWidth, d.tracedHeight)).toBeLessThanOrEqual(768);
    expect(d.tracedWidth * d.tracedHeight).toBeLessThan(4000 * 3000);
  });

  it("allows a larger trace for high than fast at same input", () => {
    const fast = getTraceDimensions(3000, 2000, "fast");
    const high = getTraceDimensions(3000, 2000, "high");
    expect(fast.tracedWidth * fast.tracedHeight).toBeLessThan(
      high.tracedWidth * high.tracedHeight,
    );
  });

  it("keeps traced aspect ratio aligned with display (avoids meet letterboxing)", () => {
    const d = getTraceDimensions(1000, 500, "fast");
    const rDisplay = d.displayWidth / d.displayHeight;
    const rTraced = d.tracedWidth / d.tracedHeight;
    expect(Math.abs(rDisplay - rTraced)).toBeLessThan(1e-9);
  });
});

describe("applyTracerSvgViewport", () => {
  it("adds viewBox so traced paths scale to display size without framing", () => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><path d="M0 0"/></svg>`;
    const out = applyTracerSvgViewport(svg, 400, 200, 100, 50);
    expect(out).toContain('viewBox="0 0 100 50"');
    expect(out).toContain('width="400"');
    expect(out).toContain('height="200"');
    expect(out).toContain('preserveAspectRatio="none"');
  });
});

describe("normalizeTracerSvgOutput", () => {
  it("accepts VTracer output with xml then generator comment then svg", () => {
    const raw = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: visioncortex VTracer 0.6.0 -->
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="10" height="10">
</svg>`;
    const out = normalizeTracerSvgOutput(raw);
    expect(out).toContain("<svg");
    expect(out).toMatch(/^<\?xml version="1.0"/);
    expect(out).not.toContain("Generator:");
  });
});

describe("getVtracerConfig", () => {
  it("matches wasm Config shape (binary, radians, colorPrecision < 8)", () => {
    const balanced = getVtracerConfig("balanced");
    expect(balanced).toMatchObject({
      binary: false,
      mode: "spline",
      hierarchical: "stacked",
    });
    expect(balanced.colorPrecision).toBeLessThan(8);
    expect(balanced.colorPrecision).toBeGreaterThanOrEqual(0);
    expect(typeof balanced.cornerThreshold).toBe("number");
    expect(typeof balanced.spliceThreshold).toBe("number");
  });

  it("never uses colorPrecision 8 (would panic in visioncortex runner)", () => {
    const high = getVtracerConfig("high");
    expect((high.colorPrecision as number) < 8).toBe(true);
  });

  it("uses higher photo-oriented settings for high preset", () => {
    const balanced = getVtracerConfig("balanced");
    const high = getVtracerConfig("high");
    expect(
      (high.layerDifference as number) > (balanced.layerDifference as number),
    ).toBe(true);
    expect(
      (high.filterSpeckle as number) > (balanced.filterSpeckle as number),
    ).toBe(true);
  });

  it("uses coarser settings for fast than balanced", () => {
    const fast = getVtracerConfig("fast");
    const balanced = getVtracerConfig("balanced");
    expect(
      (fast.filterSpeckle as number) > (balanced.filterSpeckle as number),
    ).toBe(true);
    expect(
      (fast.colorPrecision as number) > (balanced.colorPrecision as number),
    ).toBe(true);
  });
});
