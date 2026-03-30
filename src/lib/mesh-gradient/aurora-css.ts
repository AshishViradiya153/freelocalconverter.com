import type { AuroraBlob } from "@/lib/mesh-gradient/aurora-types";
import { blobBorderRadius } from "@/lib/mesh-gradient/aurora-types";

function fmt(n: number, digits = 2): string {
  return Number(n.toFixed(digits)).toString();
}

export function generateAuroraCss(input: {
  baseColor: string;
  blur: number;
  noiseOpacity: number;
  blobs: AuroraBlob[];
}): string {
  const { baseColor, blur, noiseOpacity, blobs } = input;
  return `/* Aurora mesh gradient */
.gradient-container {
  background-color: ${baseColor};
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.gradient-blur-layer {
  position: absolute;
  inset: -20%;
  filter: blur(${blur}px);
}

${blobs
  .map(
    (b, i) => `.blob-${i} {
  position: absolute;
  left: ${fmt(b.x)}%;
  top: ${fmt(b.y)}%;
  width: ${fmt(b.size)}%;
  height: ${fmt(b.size)}%;
  background-color: ${b.color};
  opacity: ${fmt(b.opacity, 3)};
  z-index: ${b.zIndex};
  transform: translate(-50%, -50%);
  border-radius: ${blobBorderRadius(b.shape)};
}`,
  )
  .join("\n")}

.noise-overlay {
  position: absolute;
  inset: 0;
  opacity: ${noiseOpacity};
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}`;
}
