import { describe, expect, it } from "vitest";
import { pseoPages } from "@/lib/pseo/registry";
import {
  buildProgrammaticSitemapUrls,
  getPseoSitemapChunk,
  getPseoSitemapChunkCount,
  PSEO_SITEMAP_CHUNK_SIZE,
} from "@/lib/pseo/sitemap";
import { pickRelatedPseoPages } from "@/lib/seo/linking";

describe("pSEO sitemap chunks", () => {
  it("chunked getPseoSitemapChunk matches full programmatic URL order and coverage", () => {
    const full = buildProgrammaticSitemapUrls();
    const chunkCount = getPseoSitemapChunkCount();
    if (full.length === 0) {
      expect(chunkCount).toBe(0);
      return;
    }
    expect(chunkCount).toBe(Math.ceil(full.length / PSEO_SITEMAP_CHUNK_SIZE));

    const rebuilt: { url: string; lastModified?: string | Date }[] = [];
    for (let c = 0; c < chunkCount; c++) {
      const chunk = getPseoSitemapChunk(c);
      expect(chunk.length).toBeGreaterThan(0);
      if (c < chunkCount - 1) {
        expect(chunk.length).toBe(PSEO_SITEMAP_CHUNK_SIZE);
      }
      rebuilt.push(...chunk);
    }

    expect(rebuilt.length).toBe(full.length);
    for (let i = 0; i < full.length; i++) {
      expect(rebuilt[i]?.url).toBe(full[i]?.url);
      const a = rebuilt[i]?.lastModified;
      const b = full[i]?.lastModified;
      const ta = a instanceof Date ? a.toISOString() : String(a);
      const tb = b instanceof Date ? b.toISOString() : String(b);
      expect(ta).toBe(tb);
    }
  });

  it("returns empty array for out-of-range chunk index", () => {
    const chunkCount = getPseoSitemapChunkCount();
    if (chunkCount === 0) return;
    expect(getPseoSitemapChunk(chunkCount)).toEqual([]);
    expect(getPseoSitemapChunk(-1)).toEqual([]);
  });
});

describe("pickRelatedPseoPages (indexed linking)", () => {
  it("includes explicit relatedSlugs of same route type", () => {
    const page = pseoPages.find(
      (p) => p.route.type === "guide" && p.relatedSlugs.length > 0,
    );
    if (!page || page.route.type !== "guide") return;

    const related = pickRelatedPseoPages(pseoPages, page, 20);
    for (const slug of page.relatedSlugs) {
      const match = pseoPages.find((x) => x.slug === slug && x.route.type === "guide");
      if (match) {
        expect(related.some((r) => r.id === match.id)).toBe(true);
      }
    }
  });

  it("returns only guides when current is a guide", () => {
    const guide = pseoPages.find((p) => p.route.type === "guide");
    if (!guide) return;
    const related = pickRelatedPseoPages(pseoPages, guide, 50);
    for (const r of related) {
      expect(r.route.type).toBe("guide");
    }
  });

  it("fills same-category tools after explicit relatedSlugs (cross-category slugs allowed)", () => {
    const tool = pseoPages.find(
      (p) => p.route.type === "tool" && p.relatedSlugs.length === 0,
    );
    if (!tool || tool.route.type !== "tool") return;
    const cat = tool.route.category;
    const related = pickRelatedPseoPages(pseoPages, tool, 50);
    for (const r of related) {
      expect(r.route.type).toBe("tool");
      if (r.route.type === "tool") {
        expect(r.route.category).toBe(cat);
      }
    }
  });
});
