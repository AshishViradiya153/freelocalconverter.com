export function hslToHex(h: number, s: number, l: number): string {
  const hue = h / 360;
  const sat = s / 100;
  const light = l / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue * 6) % 2) - 1));
  const m = light - c / 2;

  let r: number;
  let g: number;
  let b: number;
  if (hue < 1 / 6) [r, g, b] = [c, x, 0];
  else if (hue < 2 / 6) [r, g, b] = [x, c, 0];
  else if (hue < 3 / 6) [r, g, b] = [0, c, x];
  else if (hue < 4 / 6) [r, g, b] = [0, x, c];
  else if (hue < 5 / 6) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface HarmoniousMeshPalette {
  backgroundColor: string;
  circleColors: string[];
}

/**
 * Port of Gradii `handlePaletteChange` color logic: random harmonic schemes in HSL → hex stops + contrasting background.
 */
export function generateHarmoniousMeshPalette(
  random: () => number = Math.random,
): HarmoniousMeshPalette {
  const schemes = [
    { hueStep: 30, count: Math.floor(random() * 6) + 3 },
    { hueStep: 120, count: Math.floor(random() * 4) + 3 },
    { hueStep: 180, count: Math.floor(random() * 4) + 2 },
    { hueStep: 60, count: Math.floor(random() * 6) + 3 },
    { hueStep: 90, count: Math.floor(random() * 4) + 3 },
    { hueStep: 45, count: Math.floor(random() * 5) + 3 },
  ];

  const scheme = schemes[Math.floor(random() * schemes.length)] ?? schemes[0];
  if (!scheme) {
    return {
      backgroundColor: "#001220",
      circleColors: ["#0066cc", "#ff6600", "#001220"],
    };
  }
  const baseHue = random() * 360;

  const satRanges = [
    { min: 70, max: 90 },
    { min: 40, max: 60 },
    { min: 85, max: 100 },
    { min: 55, max: 75 },
  ];

  const lightRanges = [
    { min: 40, max: 60 },
    { min: 60, max: 80 },
    { min: 20, max: 40 },
    { min: 30, max: 70 },
  ];

  const bgHue = (baseHue + 180) % 360;
  const bgSat = 20 + random() * 40;
  const bgLight = random() > 0.5 ? 10 + random() * 20 : 80 + random() * 15;

  const backgroundColor = hslToHex(bgHue, bgSat, bgLight);

  const satRange =
    satRanges[Math.floor(random() * satRanges.length)] ?? satRanges[0];
  const lightRange =
    lightRanges[Math.floor(random() * lightRanges.length)] ?? lightRanges[0];
  if (!satRange || !lightRange) {
    return { backgroundColor, circleColors: [hslToHex(baseHue, 70, 50)] };
  }

  const baseColors = Array.from({ length: scheme.count }, (_, i) => {
    const hue = (baseHue + i * scheme.hueStep) % 360;
    const sat = satRange.min + random() * (satRange.max - satRange.min);
    const light = lightRange.min + random() * (lightRange.max - lightRange.min);
    return { h: hue, s: sat, l: light };
  });

  const colors = baseColors.flatMap((base) => {
    const variations = [base];
    if (random() > 0.3) {
      variations.push({
        h: (base.h + 15 - random() * 30) % 360,
        s: Math.max(20, Math.min(100, base.s + (random() * 30 - 15))),
        l: Math.max(10, Math.min(90, base.l + (random() * 40 - 20))),
      });
    }
    return variations;
  });

  const circleColors = colors.map(({ h, s, l }) => hslToHex(h, s, l));

  return { backgroundColor, circleColors };
}
