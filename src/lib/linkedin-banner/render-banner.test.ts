import { describe, expect, it } from "vitest";
import {
  type BannerDesignInput,
  DEFAULT_BANNER_TEMPLATE_TWEAKS,
  DEFAULT_HEADLINE_FONT,
  DEFAULT_SUB_FONT,
  DEFAULT_TAG_FONT,
  LINKEDIN_BANNER_FORMATS,
  normalizedTemplateTweaks,
  renderLinkedInBannerCanvas,
} from "@/lib/linkedin-banner/render-banner";

function minimalDesign(
  overrides: Partial<BannerDesignInput> = {},
): BannerDesignInput {
  return {
    templateId: "hero",
    headline: "Headline",
    subheadline: "Subheadline line",
    tag: "TAG",
    tagFont: { ...DEFAULT_TAG_FONT },
    headlineFont: { ...DEFAULT_HEADLINE_FONT },
    subheadlineFont: { ...DEFAULT_SUB_FONT },
    colorA: "#2563eb",
    colorB: "#7c3aed",
    solidColor: "#0f172a",
    backgroundMode: "gradient",
    angleDeg: 118,
    textColorMode: "auto",
    customTextColor: "#ffffff",
    showGrid: false,
    noiseOpacity: 0,
    templateTweaks: { ...DEFAULT_BANNER_TEMPLATE_TWEAKS },
    ...overrides,
  };
}

describe("normalizedTemplateTweaks", () => {
  it("returns defaults when partial is undefined", () => {
    expect(normalizedTemplateTweaks()).toEqual(DEFAULT_BANNER_TEMPLATE_TWEAKS);
  });

  it("merges partial values and clamps splitLeftPercent", () => {
    expect(
      normalizedTemplateTweaks({ splitLeftPercent: 999 }).splitLeftPercent,
    ).toBe(48);
    expect(
      normalizedTemplateTweaks({ splitLeftPercent: 10 }).splitLeftPercent,
    ).toBe(30);
    expect(
      normalizedTemplateTweaks({ splitLeftPercent: 40 }).splitLeftPercent,
    ).toBe(40);
  });

  it("clamps editorialBarScale and orbitStrokeOpacity", () => {
    expect(
      normalizedTemplateTweaks({ editorialBarScale: 0 }).editorialBarScale,
    ).toBe(0.65);
    expect(
      normalizedTemplateTweaks({ editorialBarScale: 99 }).editorialBarScale,
    ).toBe(1.85);
    expect(
      normalizedTemplateTweaks({ orbitStrokeOpacity: 0 }).orbitStrokeOpacity,
    ).toBe(0.12);
    expect(
      normalizedTemplateTweaks({ orbitStrokeOpacity: 1 }).orbitStrokeOpacity,
    ).toBe(0.42);
  });
});

describe("renderLinkedInBannerCanvas", () => {
  it("produces a canvas matching requested dimensions for each format", () => {
    for (const fmt of Object.values(LINKEDIN_BANNER_FORMATS)) {
      const canvas = renderLinkedInBannerCanvas({
        width: fmt.width,
        height: fmt.height,
        design: minimalDesign(),
        logo: null,
      });
      expect(canvas.width).toBe(fmt.width);
      expect(canvas.height).toBe(fmt.height);
    }
  });

  it("renders split + solid and gradient paths without throwing", () => {
    const w = LINKEDIN_BANNER_FORMATS.profileCover.width;
    const h = LINKEDIN_BANNER_FORMATS.profileCover.height;
    const solid = renderLinkedInBannerCanvas({
      width: w,
      height: h,
      design: minimalDesign({
        templateId: "split",
        backgroundMode: "solid",
      }),
      logo: null,
    });
    expect(solid.width).toBe(w);
    expect(solid.height).toBe(h);

    const gradient = renderLinkedInBannerCanvas({
      width: w,
      height: h,
      design: minimalDesign({
        templateId: "split",
        backgroundMode: "gradient",
      }),
      logo: null,
    });
    expect(gradient.width).toBe(w);
  });
});
