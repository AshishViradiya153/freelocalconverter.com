import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { buildLlmsTxtBody, LLMS_SECTIONS } from "@/lib/seo/llms-txt-body";
import { normalizeSiteBase } from "@/lib/seo/paths";

describe("buildLlmsTxtBody", () => {
  it("starts with site title and includes tagline and locale guidance", () => {
    const body = buildLlmsTxtBody();
    expect(body.startsWith(`# ${siteConfig.name}\n`)).toBe(true);
    expect(body).toContain(siteConfig.description);
    expect(body).toContain("localePrefix: as-needed");
    const nonDefault = routing.locales.filter(
      (l) => l !== routing.defaultLocale,
    );
    for (const locale of nonDefault) {
      expect(body).toContain(locale);
    }
  });

  it("includes GitHub source link", () => {
    const body = buildLlmsTxtBody();
    expect(body).toContain(siteConfig.links.github);
  });

  it("lists every configured path as an absolute URL under the site base", () => {
    const base = normalizeSiteBase();
    const body = buildLlmsTxtBody();

    for (const section of LLMS_SECTIONS) {
      for (const item of section.items) {
        const expected = item.path === "/" ? `${base}/` : `${base}${item.path}`;
        expect(body, `${section.heading} → ${item.path}`).toContain(
          `](${expected})`,
        );
      }
    }
  });
});
