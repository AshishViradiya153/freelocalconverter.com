import { createHash } from "node:crypto";
import type { PseoPageRecord } from "./types";

function fingerprint(page: PseoPageRecord): string {
  const payload = [
    page.title,
    page.heroHeading,
    page.intro.join(" "),
    page.sections
      .map((s) => `${s.heading}:${s.paragraphs.join(" ")}`)
      .join("|"),
  ].join("\n");
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Detect accidental duplicate bodies across different URLs (copy-paste errors).
 */
export function assertContentFingerprintsUnique(
  pages: readonly PseoPageRecord[],
) {
  const byHash = new Map<string, string>();
  for (const p of pages) {
    const fp = fingerprint(p);
    const existing = byHash.get(fp);
    if (existing && existing !== p.id) {
      throw new Error(
        `pSEO duplicate body fingerprint: pages "${existing}" and "${p.id}" are too similar`,
      );
    }
    byHash.set(fp, p.id);
  }
}

export function minWordCountForPage(page: PseoPageRecord): number {
  const text = [
    ...page.intro,
    ...page.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
    ...page.faqs.flatMap((f) => [f.question, f.answer]),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

const MIN_WORDS = 350;

export function assertMinimumWordCount(pages: readonly PseoPageRecord[]) {
  for (const p of pages) {
    const n = minWordCountForPage(p);
    if (n < MIN_WORDS) {
      throw new Error(
        `pSEO thin content: page "${p.id}" has about ${n} words (minimum ${MIN_WORDS})`,
      );
    }
  }
}
