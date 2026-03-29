import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import { buildOrganizationJsonLd } from "@/lib/seo/schema";

describe("buildOrganizationJsonLd", () => {
  it("includes logo ImageObject, sameAs with github, and stable @id", () => {
    const base = siteConfig.url.replace(/\/$/, "");
    const json = buildOrganizationJsonLd() as Record<string, unknown>;

    expect(json["@type"]).toBe("Organization");
    expect(json["@id"]).toBe(`${base}/#organization`);
    expect(json.logo).toEqual({
      "@type": "ImageObject",
      url: `${base}${siteConfig.brandLogoPath}`,
    });
    expect(json.sameAs).toEqual([siteConfig.links.github.trim()]);
    expect(json.contactPoint).toBeUndefined();
  });
});
