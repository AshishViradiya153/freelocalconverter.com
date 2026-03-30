import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchHtmlInBrowser,
  mergePreviewDescription,
  mergePreviewImage,
  mergePreviewTitle,
  parseOpenGraphFromHtml,
  parseUrlSafe,
} from "./parse-html-meta";

describe("parseUrlSafe", () => {
  it("accepts public https URL", () => {
    const u = parseUrlSafe("https://example.com/path?q=1");
    expect(u?.href).toBe("https://example.com/path?q=1");
  });

  it("rejects localhost", () => {
    expect(parseUrlSafe("http://localhost:3000/")).toBeNull();
  });

  it("rejects 127.0.0.1", () => {
    expect(parseUrlSafe("http://127.0.0.1/")).toBeNull();
  });

  it("rejects non-http(s) protocols", () => {
    expect(parseUrlSafe("file:///etc/passwd")).toBeNull();
    expect(parseUrlSafe("javascript:alert(1)")).toBeNull();
  });
});

describe("parseOpenGraphFromHtml", () => {
  it("fails on empty input", () => {
    const r = parseOpenGraphFromHtml("   ", null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Paste HTML");
  });

  it("fails when HTML exceeds max size", () => {
    const huge = "x".repeat(2_500_001);
    const r = parseOpenGraphFromHtml(huge, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("too large");
  });

  it("reads title, og and twitter meta (content before property)", () => {
    const html = `<!DOCTYPE html><html><head>
      <title>  Doc title  </title>
      <meta content="OG Title" property="og:title">
      <meta property="og:description" content="OG Desc">
      <meta name="twitter:card" content="summary_large_image">
      <meta content="Tw Title" name="twitter:title">
    </head><body></body></html>`;
    const r = parseOpenGraphFromHtml(html, null);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.title).toBe("Doc title");
    expect(r.data.ogTitle).toBe("OG Title");
    expect(r.data.ogDescription).toBe("OG Desc");
    expect(r.data.twitterCard).toBe("summary_large_image");
    expect(r.data.twitterTitle).toBe("Tw Title");
  });

  it("resolves relative og:image with base URL", () => {
    const html = `<html><head>
      <meta property="og:image" content="/assets/cover.png">
    </head></html>`;
    const r = parseOpenGraphFromHtml(
      html,
      "https://blog.example.com/posts/hello/",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.ogImage).toBe("https://blog.example.com/assets/cover.png");
    expect(r.data.ogImages).toEqual([
      "https://blog.example.com/assets/cover.png",
    ]);
    expect(r.data.finalUrl).toBe("https://blog.example.com/posts/hello/");
    expect(r.data.ogUrl).toBe("https://blog.example.com/posts/hello/");
  });

  it("uses og:url when present", () => {
    const html = `<html><head>
      <meta property="og:url" content="/canonical">
    </head></html>`;
    const r = parseOpenGraphFromHtml(html, "https://x.com/y/");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.ogUrl).toBe("https://x.com/canonical");
  });

  it("dedupes repeated og:image values", () => {
    const html = `<html><head>
      <meta property="og:image" content="https://cdn.example.com/a.png">
      <meta property="og:image" content="https://cdn.example.com/a.png">
      <meta property="og:image" content="https://cdn.example.com/b.png">
    </head></html>`;
    const r = parseOpenGraphFromHtml(html, null);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.ogImages).toEqual([
      "https://cdn.example.com/a.png",
      "https://cdn.example.com/b.png",
    ]);
  });

  it("merges twitter:image and twitter:image:src without duplicate URLs", () => {
    const html = `<html><head>
      <meta name="twitter:image" content="/i.png">
      <meta name="twitter:image:src" content="/i.png">
    </head></html>`;
    const r = parseOpenGraphFromHtml(html, "https://site.test/");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.twitterImages).toEqual(["https://site.test/i.png"]);
    expect(r.data.twitterImage).toBe("https://site.test/i.png");
  });

  it("reads og:site_name", () => {
    const html = `<html><head>
      <meta property="og:site_name" content="My Site">
    </head></html>`;
    const r = parseOpenGraphFromHtml(html, null);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.ogSiteName).toBe("My Site");
  });
});

describe("mergePreview*", () => {
  it("mergePreviewTitle prefers og over twitter over document title", () => {
    expect(
      mergePreviewTitle({
        finalUrl: null,
        title: "T",
        ogTitle: "OG",
        ogDescription: null,
        ogImage: null,
        ogImages: [],
        ogUrl: null,
        ogSiteName: null,
        twitterCard: null,
        twitterTitle: "TW",
        twitterDescription: null,
        twitterImage: null,
        twitterImages: [],
      }),
    ).toBe("OG");
    expect(
      mergePreviewTitle({
        finalUrl: null,
        title: "T",
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogImages: [],
        ogUrl: null,
        ogSiteName: null,
        twitterCard: null,
        twitterTitle: "TW",
        twitterDescription: null,
        twitterImage: null,
        twitterImages: [],
      }),
    ).toBe("TW");
    expect(
      mergePreviewTitle({
        finalUrl: null,
        title: "T",
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogImages: [],
        ogUrl: null,
        ogSiteName: null,
        twitterCard: null,
        twitterTitle: null,
        twitterDescription: null,
        twitterImage: null,
        twitterImages: [],
      }),
    ).toBe("T");
  });

  it("mergePreviewImage prefers og over twitter", () => {
    expect(
      mergePreviewImage({
        finalUrl: null,
        title: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: "https://a/og.png",
        ogImages: ["https://a/og.png"],
        ogUrl: null,
        ogSiteName: null,
        twitterCard: null,
        twitterTitle: null,
        twitterDescription: null,
        twitterImage: "https://a/tw.png",
        twitterImages: ["https://a/tw.png"],
      }),
    ).toBe("https://a/og.png");
    expect(
      mergePreviewImage({
        finalUrl: null,
        title: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogImages: [],
        ogUrl: null,
        ogSiteName: null,
        twitterCard: null,
        twitterTitle: null,
        twitterDescription: null,
        twitterImage: "https://a/tw.png",
        twitterImages: ["https://a/tw.png"],
      }),
    ).toBe("https://a/tw.png");
  });

  it("mergePreviewDescription prefers og over twitter", () => {
    expect(
      mergePreviewDescription({
        finalUrl: null,
        title: null,
        ogTitle: null,
        ogDescription: "OGD",
        ogImage: null,
        ogImages: [],
        ogUrl: null,
        ogSiteName: null,
        twitterCard: null,
        twitterTitle: null,
        twitterDescription: "TWD",
        twitterImage: null,
        twitterImages: [],
      }),
    ).toBe("OGD");
  });
});

describe("fetchHtmlInBrowser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns error for invalid URL", async () => {
    const r = await fetchHtmlInBrowser("not-a-url");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("valid http");
  });

  it("returns error for blocked host", async () => {
    const r = await fetchHtmlInBrowser("http://127.0.0.1/secret");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("valid http");
  });

  it("returns html and finalUrl when fetch succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        url: "https://example.com/landing",
        text: async () => "<html><title>OK</title></html>",
      }),
    );
    const r = await fetchHtmlInBrowser("https://example.com/start");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.html).toContain("OK");
    expect(r.finalUrl).toBe("https://example.com/landing");
  });

  it("returns error when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "",
      }),
    );
    const r = await fetchHtmlInBrowser("https://example.com/missing");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("HTTP 404");
  });

  it("maps AbortError from fetch to timeout message (same as abort timeout)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")),
    );
    const r = await fetchHtmlInBrowser("https://example.com/slow");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Request timed out.");
  });

  it("returns CORS hint when fetch throws generic error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed")));
    const r = await fetchHtmlInBrowser("https://example.com/x");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("CORS");
  });
});
