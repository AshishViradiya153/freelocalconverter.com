import type { CircleProps } from "./types";

function fnv1a32(input: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

export function meshGrainSeedFromVisualState(input: {
  backgroundColor: string;
  circles: CircleProps[];
  blur: number;
  saturation: number;
  contrast: number;
  brightness: number;
  grainIntensity: number;
}): number {
  const parts = [
    input.backgroundColor.toLowerCase(),
    String(input.blur),
    String(input.saturation),
    String(input.contrast),
    String(input.brightness),
    String(input.grainIntensity),
    ...input.circles.map(
      (c) => `${c.color.toLowerCase()}|${c.cx}|${c.cy}`,
    ),
  ];
  return fnv1a32(parts.join("~"));
}
