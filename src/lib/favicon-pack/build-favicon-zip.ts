import { zipSync } from "fflate";

import { buildIcoFromPngEntries } from "./build-ico-from-pngs";
import {
  loadImageFromFile,
  renderFaviconPngMap,
} from "./render-square-png";

const WEB_MANIFEST_JSON = JSON.stringify(
  {
    name: "",
    short_name: "",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
  },
  null,
  2,
);

export interface BuildFaviconZipResult {
  /** Suggested download filename (no extension) */
  baseName: string;
  zipBytes: Uint8Array;
}

function baseNameFromFileName(name: string): string {
  const leaf = name.replace(/\.[a-z0-9]+$/i, "").trim();
  const safe = leaf.replace(/[^\w\-]+/g, "-").slice(0, 64);
  return safe || "favicon";
}

/**
 * Generates favicon_io-style assets and returns a ZIP (all processing in-browser).
 * Uses a single downscaled square master (max 512px) then parallel PNG exports.
 */
export async function buildFaviconZipFromImageFile(
  file: File,
): Promise<BuildFaviconZipResult> {
  const img = await loadImageFromFile(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (w < 1 || h < 1) {
    throw new Error("Image has invalid dimensions");
  }

  const png = await renderFaviconPngMap(img, w, h);

  const ico = buildIcoFromPngEntries([
    { width: 16, height: 16, data: png[16] },
    { width: 32, height: 32, data: png[32] },
  ]);

  const encoder = new TextEncoder();
  const manifestBytes = encoder.encode(`${WEB_MANIFEST_JSON}\n`);

  const zipBytes = zipSync({
    "favicon.ico": ico,
    "favicon-16x16.png": png[16],
    "favicon-32x32.png": png[32],
    "apple-touch-icon.png": png[180],
    "android-chrome-192x192.png": png[192],
    "android-chrome-512x512.png": png[512],
    "site.webmanifest": manifestBytes,
  });

  return {
    baseName: baseNameFromFileName(file.name),
    zipBytes,
  };
}
