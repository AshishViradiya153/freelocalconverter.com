import { describe, expect, it } from "vitest";
import { localeNavPseoExtras } from "@/i18n/locale-nav-pseo-extras";
import { routing, type AppLocale } from "@/i18n/routing";

describe("locale nav + pSEO extras", () => {
  it("defines overrides for every non-default routing locale", () => {
    const expected = routing.locales.filter(
      (l): l is AppLocale => l !== routing.defaultLocale,
    );
    for (const locale of expected) {
      expect(
        localeNavPseoExtras,
        `Missing localeNavPseoExtras for "${locale}"`,
      ).toHaveProperty(locale);
    }
    expect(Object.keys(localeNavPseoExtras).length).toBe(expected.length);
  });
});
