import { describe, expect, it } from "vitest";
import {
  htmlToMarkdown,
  markdownToHtml,
  markdownToSafeHtml,
  sanitizeToolHtml,
} from "./markdown-html-transform";

describe("markdownToHtml", () => {
  it("returns empty string for empty input", () => {
    const r = markdownToHtml("");
    expect(r).toEqual({ ok: true, text: "" });
  });

  it("renders headings and lists", () => {
    const r = markdownToHtml("# Title\n\n- a\n- b");
    expect(r.ok).toBe(true);
    expect(r.text).toContain("<h1");
    expect(r.text).toContain("Title");
    expect(r.text).toContain("<ul");
    expect(r.text).toContain("<li");
  });

  it("supports GFM tables (pairs with CSV → Markdown workflows)", () => {
    const md = "| a | b |\n|---|---|\n| 1 | 2 |";
    const r = markdownToHtml(md);
    expect(r.ok).toBe(true);
    expect(r.text).toContain("<table");
    expect(r.text).toContain("<thead");
    expect(r.text).toContain("<tbody");
  });

  it("renders fenced code blocks", () => {
    const r = markdownToHtml("```ts\nconst x = 1\n```");
    expect(r.ok).toBe(true);
    expect(r.text).toContain("<pre>");
    expect(r.text).toContain("language-ts");
    expect(r.text).toContain("const x = 1");
  });

  it("strips BOM", () => {
    const r = markdownToHtml("\uFEFF# Hi");
    expect(r.ok).toBe(true);
    expect(r.text).toContain("Hi");
  });
});

describe("sanitizeToolHtml", () => {
  it("strips script tags", () => {
    const clean = sanitizeToolHtml("<p>ok</p><script>alert(1)</script>");
    expect(clean).toContain("ok");
    expect(clean.toLowerCase()).not.toContain("script");
  });
});

describe("markdownToSafeHtml", () => {
  it("combines parse and sanitize", () => {
    const r = markdownToSafeHtml("[x](javascript:alert(1))");
    expect(r.ok).toBe(true);
    expect(r.text.toLowerCase()).not.toContain("javascript:");
  });
});

describe("htmlToMarkdown", () => {
  it("returns empty for empty input", () => {
    expect(htmlToMarkdown("")).toEqual({ ok: true, text: "" });
  });

  it("converts headings and paragraphs", () => {
    const r = htmlToMarkdown("<h2>Hi</h2><p>Body</p>");
    expect(r.ok).toBe(true);
    expect(r.text).toContain("## Hi");
    expect(r.text).toContain("Body");
  });

  it("round-trips GFM-style tables through md → html → md", () => {
    const md = "| Col | Val |\n| --- | --- |\n| a | b |";
    const toHtml = markdownToHtml(md);
    expect(toHtml.ok).toBe(true);
    const back = htmlToMarkdown(toHtml.text);
    expect(back.ok).toBe(true);
    expect(back.text).toContain("Col");
    expect(back.text).toContain("Val");
    expect(back.text).toContain("|");
  });
});
