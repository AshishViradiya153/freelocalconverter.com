import DOMPurify from "isomorphic-dompurify";
import { Marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

export interface MarkdownHtmlTransformResult {
  ok: boolean;
  text: string;
  error?: string;
}

/** ~512 KiB; keeps parsing responsive in the browser */
export const MARKDOWN_HTML_MAX_INPUT_CHARS = 512 * 1024;

function stripBom(input: string): string {
  return input.replace(/^\uFEFF/, "");
}

function errorToMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message || error.name || fallback;
  if (typeof error === "string" && error.trim()) return error.trim();
  return fallback;
}

const markdownParser = new Marked();
markdownParser.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
});

let turndownSingleton: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!turndownSingleton) {
    turndownSingleton = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "*",
      strongDelimiter: "**",
    });
    turndownSingleton.use(gfm);
  }
  return turndownSingleton;
}

export function sanitizeToolHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
  });
}

export function markdownToHtml(input: string): MarkdownHtmlTransformResult {
  const raw = stripBom(input).trimEnd();
  if (!raw) return { ok: true, text: "" };
  if (raw.length > MARKDOWN_HTML_MAX_INPUT_CHARS) {
    return {
      ok: false,
      text: "",
      error: `Input is too large (max ${MARKDOWN_HTML_MAX_INPUT_CHARS.toLocaleString()} characters).`,
    };
  }
  try {
    const html = markdownParser.parse(raw, { async: false });
    if (typeof html !== "string") {
      return {
        ok: false,
        text: "",
        error: "Markdown parser returned an unexpected result.",
      };
    }
    return { ok: true, text: html };
  } catch (e) {
    return {
      ok: false,
      text: "",
      error: errorToMessage(e, "Invalid or unsupported Markdown."),
    };
  }
}

export function markdownToSafeHtml(input: string): MarkdownHtmlTransformResult {
  const parsed = markdownToHtml(input);
  if (!parsed.ok) return parsed;
  return { ok: true, text: sanitizeToolHtml(parsed.text) };
}

export function htmlToMarkdown(input: string): MarkdownHtmlTransformResult {
  const raw = stripBom(input).trimEnd();
  if (!raw) return { ok: true, text: "" };
  if (raw.length > MARKDOWN_HTML_MAX_INPUT_CHARS) {
    return {
      ok: false,
      text: "",
      error: `Input is too large (max ${MARKDOWN_HTML_MAX_INPUT_CHARS.toLocaleString()} characters).`,
    };
  }
  try {
    const td = getTurndown();
    const md = td.turndown(raw);
    return { ok: true, text: md };
  } catch (e) {
    return {
      ok: false,
      text: "",
      error: errorToMessage(e, "Could not convert HTML to Markdown."),
    };
  }
}
