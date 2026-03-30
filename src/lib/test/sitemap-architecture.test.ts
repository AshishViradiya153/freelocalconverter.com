import { describe, expect, it } from "vitest";
import {
  getPseoSitemapChunkCount,
  pseoSitemapIndexUrl,
} from "@/lib/pseo/sitemap";
import { buildRootSitemapIndexLocators } from "@/lib/sitemap/root-index";
import { staticChildSitemapUrl } from "@/lib/sitemap/site-urls";

describe("sitemap architecture (100k+ scale)", () => {
  it("root index lists static urlset first", () => {
    const locs = buildRootSitemapIndexLocators();
    expect(locs[0]).toBe(staticChildSitemapUrl());
  });

  it("root index includes programmatic sitemap index when chunks exist", () => {
    const locs = buildRootSitemapIndexLocators();
    const chunkCount = getPseoSitemapChunkCount();
    if (chunkCount === 0) {
      expect(locs).toEqual([staticChildSitemapUrl()]);
      return;
    }
    expect(locs).toEqual([staticChildSitemapUrl(), pseoSitemapIndexUrl()]);
  });
});
