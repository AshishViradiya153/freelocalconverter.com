import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  ALL_TOOL_PAGE_SLUGS,
  getToolPageDescription,
} from "@/lib/seo/tool-page-metadata";

const IMAGE_CONVERT_PAIR_KEYS = [
  "subtitle",
  "intro1",
  "intro2",
  "faq1Question",
  "faq1Answer",
  "faq2Question",
  "faq2Answer",
  "faq3Question",
  "faq3Answer",
  "keywordsLine",
] as const;

describe("buildPageMetadata", () => {
  it("includes x-default hreflang pointing at default locale URL", () => {
    const meta = buildPageMetadata({
      locale: "de",
      pathname: "/compare",
      title: "T",
      description: "D",
    });
    const langs = meta.alternates?.languages;
    expect(langs).toBeDefined();
    expect(langs?.["x-default"]).toBe("https://csveditoronline.org/compare");
    expect(langs?.en).toBe("https://csveditoronline.org/compare");
    expect(langs?.de).toBe("https://csveditoronline.org/de/compare");
  });

  it("omits hreflang map when alternateLocales is false", () => {
    const meta = buildPageMetadata({
      locale: "en",
      pathname: "/foo",
      title: "T",
      description: "D",
      alternateLocales: false,
    });
    expect(meta.alternates?.languages).toBeUndefined();
  });
});

describe("getToolPageDescription", () => {
  it("includes the title in the English template", () => {
    expect(getToolPageDescription("en", "CSV Compare")).toContain("CSV Compare");
  });
});

describe("messages SEO namespaces (en.json)", () => {
  it("defines title, description, keywords for every tool page slug", () => {
    const enPath = path.resolve(process.cwd(), "messages/en.json");
    const en = JSON.parse(fs.readFileSync(enPath, "utf8")) as {
      toolMeta?: Record<
        string,
        { title?: string; description?: string; keywords?: string }
      >;
    };
    expect(en.toolMeta).toBeDefined();
    for (const slug of ALL_TOOL_PAGE_SLUGS) {
      const block = en.toolMeta?.[slug];
      expect(block, `toolMeta.${slug}`).toBeDefined();
      expect(block!.title?.trim(), `${slug}.title`).toBeTruthy();
      expect(block!.description?.trim(), `${slug}.description`).toBeTruthy();
      expect(block!.keywords?.trim(), `${slug}.keywords`).toBeTruthy();
    }
  });

  it("defines imageConvertPair copy and keywordsLine", () => {
    const enPath = path.resolve(process.cwd(), "messages/en.json");
    const en = JSON.parse(fs.readFileSync(enPath, "utf8")) as {
      imageConvertPair?: Record<string, string>;
    };
    expect(en.imageConvertPair).toBeDefined();
    for (const key of IMAGE_CONVERT_PAIR_KEYS) {
      const v = en.imageConvertPair?.[key]?.trim();
      expect(v, `imageConvertPair.${key}`).toBeTruthy();
    }
  });
});
