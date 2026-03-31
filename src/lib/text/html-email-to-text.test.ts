import { describe, expect, it } from "vitest";
import { htmlEmailToText } from "./html-email-to-text";

describe("htmlEmailToText", () => {
  it("returns empty for empty input", () => {
    expect(
      htmlEmailToText("", {
        includeLinks: true,
        collapseWhitespace: true,
        maxBlankLines: 1,
      }),
    ).toBe("");
  });

  it("strips scripts and styles", () => {
    const out = htmlEmailToText(
      "<style>p{color:red}</style><p>Hello</p><script>alert(1)</script>",
      { includeLinks: false, collapseWhitespace: true, maxBlankLines: 1 },
    );
    expect(out).toContain("Hello");
    expect(out.toLowerCase()).not.toContain("alert");
    expect(out.toLowerCase()).not.toContain("color");
  });

  it("turns <br> into newlines", () => {
    const out = htmlEmailToText("<p>a<br>b</p>", {
      includeLinks: false,
      collapseWhitespace: true,
      maxBlankLines: 1,
    });
    expect(out).toContain("a\nb");
  });

  it("adds link URL in parentheses (label differs)", () => {
    const out = htmlEmailToText('<p><a href="https://example.com">Site</a></p>', {
      includeLinks: true,
      collapseWhitespace: true,
      maxBlankLines: 1,
    });
    expect(out).toContain("Site (https://example.com)");
  });

  it("does not duplicate link when label equals href", () => {
    const out = htmlEmailToText(
      '<p><a href="https://example.com">https://example.com</a></p>',
      { includeLinks: true, collapseWhitespace: true, maxBlankLines: 1 },
    );
    expect(out).toBe("https://example.com");
  });

  it("formats list items with '- '", () => {
    const out = htmlEmailToText("<ul><li>One</li><li>Two</li></ul>", {
      includeLinks: false,
      collapseWhitespace: true,
      maxBlankLines: 1,
    });
    expect(out).toContain("- One");
    expect(out).toContain("- Two");
  });

  it("collapses blank lines to configured maximum", () => {
    const out = htmlEmailToText("<div>a</div><div>b</div><div>c</div>", {
      includeLinks: false,
      collapseWhitespace: true,
      maxBlankLines: 0,
    });
    expect(out).not.toContain("\n\n");
  });
});

