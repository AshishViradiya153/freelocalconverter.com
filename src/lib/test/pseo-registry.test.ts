import { describe, expect, it } from "vitest";
import { pseoPages } from "@/lib/pseo/registry";

describe("pSEO registry", () => {
  it("loads validated structured pages", () => {
    expect(pseoPages.length).toBeGreaterThanOrEqual(6);
  });

  it("has unique slugs for addressable URLs", () => {
    const slugs = pseoPages.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
