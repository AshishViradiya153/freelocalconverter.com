import type { AppLocale } from "@/i18n/routing";

/** URL slug for output formats (matches encoder options in the app). */
export type ImageConvertOutputSlug =
  | "png"
  | "jpg"
  | "webp"
  | "avif"
  | "gif"
  | "bmp"
  | "tiff"
  | "ico"
  | "svg";

/** Input-side slugs include HEIC (no HEIC output in the browser tool). */
export type ImageConvertFromSlug = ImageConvertOutputSlug | "heic";

export type ImageConvertPair = {
  from: ImageConvertFromSlug;
  to: ImageConvertOutputSlug;
  pairSlug: string;
};

const OUTPUT_SLUGS: ImageConvertOutputSlug[] = [
  "png",
  "jpg",
  "webp",
  "avif",
  "gif",
  "bmp",
  "tiff",
  "ico",
  "svg",
];

const FROM_SLUGS: ImageConvertFromSlug[] = [...OUTPUT_SLUGS, "heic"];

/** Uppercase-style labels for H1 / titles (file-type acronyms). */
export const FORMAT_DISPLAY: Record<ImageConvertFromSlug, string> = {
  png: "PNG",
  jpg: "JPG",
  webp: "WebP",
  avif: "AVIF",
  gif: "GIF",
  bmp: "BMP",
  tiff: "TIFF",
  ico: "ICO",
  heic: "HEIC",
  svg: "SVG",
};

const ALIAS_FROM = new Map<string, ImageConvertFromSlug>([
  ["jpeg", "jpg"],
  ["tif", "tiff"],
  ["heif", "heic"],
]);

const ALIAS_TO = new Map<string, ImageConvertOutputSlug>([
  ["jpeg", "jpg"],
  ["tif", "tiff"],
]);

function isOutputSlug(s: string): s is ImageConvertOutputSlug {
  return (OUTPUT_SLUGS as readonly string[]).includes(s);
}

function isFromSlug(s: string): s is ImageConvertFromSlug {
  return (FROM_SLUGS as readonly string[]).includes(s as ImageConvertFromSlug);
}

export function buildImageConvertPairSlug(
  from: ImageConvertFromSlug,
  to: ImageConvertOutputSlug,
): string {
  return `${from}-to-${to}`;
}

export function getAllImageConvertPairs(): ImageConvertPair[] {
  const out: ImageConvertPair[] = [];
  for (const from of FROM_SLUGS) {
    for (const to of OUTPUT_SLUGS) {
      if (from === to) continue;
      out.push({
        from,
        to,
        pairSlug: buildImageConvertPairSlug(from, to),
      });
    }
  }
  out.sort((a, b) => a.pairSlug.localeCompare(b.pairSlug));
  return out;
}

/**
 * Parses `jpg-to-png` style segments; accepts aliases (jpeg, tif, heif).
 */
export function parseImageConvertPairParam(
  param: string,
): ImageConvertPair | null {
  const m = /^([a-z0-9]+)-to-([a-z0-9]+)$/.exec(param.trim().toLowerCase());
  if (!m) return null;
  const rawFrom = ALIAS_FROM.get(m[1]) ?? m[1];
  const rawTo = ALIAS_TO.get(m[2]) ?? m[2];
  if (!isFromSlug(rawFrom) || !isOutputSlug(rawTo)) return null;
  if (rawFrom === rawTo) return null;
  return {
    from: rawFrom,
    to: rawTo,
    pairSlug: buildImageConvertPairSlug(rawFrom, rawTo),
  };
}

export function imageConvertPairTitle(
  locale: AppLocale,
  from: ImageConvertFromSlug,
  to: ImageConvertOutputSlug,
): string {
  const left = FORMAT_DISPLAY[from];
  const right = FORMAT_DISPLAY[to];

  switch (locale) {
    case "zh":
      return `${left} 转 ${right}`;
    case "ja":
      return `${left} から ${right}`;
    case "ko":
      return `${left}에서 ${right}`;
    case "tr":
      return `${left}'den ${right}'e`;
    case "az":
      return `${left}-dən ${right}-ə`;
    case "ar":
      return `${left} إلى ${right}`;
    case "fa":
      return `${left} به ${right}`;
    case "he":
      return `${left} ל-${right}`;
    case "el":
      return `${left} σε ${right}`;
    case "de":
      return `${left} zu ${right}`;
    case "fr":
      return `${left} vers ${right}`;
    case "it":
      return `Da ${left} a ${right}`;
    case "nl":
      return `${left} naar ${right}`;
    case "pt":
      return `${left} para ${right}`;
    case "es":
      return `${left} a ${right}`;
    case "ru":
      return `Из ${left} в ${right}`;
    default:
      return `${left} to ${right}`;
  }
}

export function formatDisplayLabel(
  slug: ImageConvertFromSlug | ImageConvertOutputSlug,
): string {
  return FORMAT_DISPLAY[slug as ImageConvertFromSlug];
}

export function toAppOutputFormat(
  slug: ImageConvertOutputSlug,
): "png" | "jpeg" | "webp" | "avif" | "gif" | "bmp" | "tiff" | "ico" | "svg" {
  if (slug === "jpg") return "jpeg";
  return slug;
}

export function buildImageConvertPairKeywords(
  from: ImageConvertFromSlug,
  to: ImageConvertOutputSlug,
): string[] {
  const f = from === "jpg" ? "jpg" : from;
  const t = to === "jpg" ? "jpg" : to;
  const fAlt = from === "jpg" ? "jpeg" : from;
  const tAlt = to === "jpg" ? "jpeg" : to;
  const base = [
    `${f} to ${t}`,
    `convert ${f} to ${t}`,
    `${f} to ${t} converter`,
    `${f} to ${t} online`,
    `free ${f} to ${t}`,
    `browser ${f} to ${t}`,
  ];
  const extra =
    fAlt !== f || tAlt !== t
      ? [`${fAlt} to ${tAlt}`, `convert ${fAlt} to ${tAlt}`]
      : [];
  return [...base, ...extra];
}
