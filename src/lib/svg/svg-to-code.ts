/**
 * SVG → JSX / React / pretty XML. Runs in the browser or Vitest (jsdom).
 */

export type SvgToCodeMode = "jsx" | "react" | "pretty";

export interface SvgToCodeOk {
  ok: true;
  text: string;
}

export interface SvgToCodeErr {
  ok: false;
  error: string;
}

export type SvgToCodeResult = SvgToCodeOk | SvgToCodeErr;

const VOID_SVG_TAGS = new Set([
  "path",
  "circle",
  "ellipse",
  "line",
  "rect",
  "polyline",
  "polygon",
  "image",
  "use",
  "stop",
  "animate",
  "animatemotion",
  "animatetransform",
  "set",
  "view",
]);

function isSvgWhitespaceText(parent: Element, text: string): boolean {
  if (/[^\s\r\n]/.test(text)) return false;
  const p = parent.tagName.toLowerCase();
  return p !== "text" && p !== "tspan" && p !== "title" && p !== "desc";
}

function hyphenToCamel(s: string): string {
  return s.replace(/-([a-z])/gi, (_, c: string) => c.toUpperCase());
}

export function toJsxPropName(name: string): string {
  if (name === "class") return "className";
  if (name === "for") return "htmlFor";
  if (name.startsWith("data-") || name.startsWith("aria-")) return name;
  if (name.includes(":")) {
    const idx = name.indexOf(":");
    const prefix = name.slice(0, idx);
    const rest = name.slice(idx + 1);
    const restCamel = hyphenToCamel(rest);
    return prefix + restCamel.charAt(0).toUpperCase() + restCamel.slice(1);
  }
  return hyphenToCamel(name);
}

function escapeJsxAttributeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "&quot;");
}

function parseInlineStyle(styleText: string): string | null {
  const declarations = styleText
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(":");
      if (idx <= 0) return null;
      const key = entry.slice(0, idx).trim();
      const value = entry.slice(idx + 1).trim();
      if (!key || !value) return null;
      return { key: toJsxPropName(key), value };
    })
    .filter((entry): entry is { key: string; value: string } => Boolean(entry));

  if (declarations.length === 0) return null;
  const body = declarations
    .map(
      ({ key, value }) =>
        `${key}: "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
    )
    .join(", ");
  return `{{ ${body} }}`;
}

function escapeJsxText(text: string): string {
  let out = "";
  for (const ch of text) {
    if (ch === "{") out += "{'{'}";
    else if (ch === "}") out += "{'}'}";
    else if (ch === "<") out += "&lt;";
    else if (ch === "&") out += "&amp;";
    else out += ch;
  }
  return out;
}

function serializeAttributes(el: Element, forJsx: boolean): string {
  const names = el.getAttributeNames().sort();
  let s = "";
  for (const name of names) {
    const value = el.getAttribute(name);
    if (value === null) continue;
    const prop = forJsx ? toJsxPropName(name) : name;
    if (forJsx && prop === "style") {
      const styleObj = parseInlineStyle(value);
      if (styleObj) {
        s += ` style=${styleObj}`;
        continue;
      }
    }
    const escaped = forJsx
      ? escapeJsxAttributeValue(value)
      : value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    s += ` ${prop}="${escaped}"`;
  }
  return s;
}

function elementToXml(el: Element, depth: number): string {
  const indent = "  ".repeat(depth);
  const tag = el.tagName.toLowerCase();
  const attrs = serializeAttributes(el, false);
  const childElements = [...el.childNodes].filter(
    (n) => n.nodeType === Node.ELEMENT_NODE,
  ) as Element[];
  const _textNodes = [...el.childNodes].filter(
    (n) => n.nodeType === Node.TEXT_NODE,
  );

  let body = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent ?? "";
      if (isSvgWhitespaceText(el, t)) continue;
      body += `${indent}  ${escapeXmlText(t)}\n`;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      body += `${elementToXml(node as Element, depth + 1)}\n`;
    }
  }

  if (!body.trim() && childElements.length === 0) {
    return `${indent}<${tag}${attrs} />`;
  }

  body = body.trimEnd();
  return `${indent}<${tag}${attrs}>\n${body}\n${indent}</${tag}>`;
}

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function elementToJsx(el: Element, depth: number): string {
  const indent = "  ".repeat(depth);
  const tag = el.tagName.toLowerCase();
  const attrs = serializeAttributes(el, true);

  const innerParts: string[] = [];
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent ?? "";
      if (isSvgWhitespaceText(el, t)) continue;
      innerParts.push(`${indent}  ${escapeJsxText(t)}`);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      innerParts.push(elementToJsx(node as Element, depth + 1));
    }
  }

  const inner = innerParts.join("\n");
  const isVoid = VOID_SVG_TAGS.has(tag) && innerParts.length === 0;

  if (isVoid) {
    return `${indent}<${tag}${attrs} />`;
  }

  return `${indent}<${tag}${attrs}>\n${inner}\n${indent}</${tag}>`;
}

function parseSvgRoot(svgText: string): SVGSVGElement | null {
  const trimmed = svgText.trim();
  if (!trimmed) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, "image/svg+xml");
  const root = doc.documentElement;
  const parserError = doc.querySelector("parsererror");
  if (parserError) return null;
  if (!root || !(root instanceof SVGSVGElement)) return null;
  return root;
}

function sanitizeComponentName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "");
  if (!cleaned) return "SvgIcon";
  const first = cleaned.charAt(0);
  if (/[0-9]/.test(first)) return `Svg${cleaned}`;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function svgToCode(
  input: string,
  options: { mode: SvgToCodeMode; componentName?: string },
): SvgToCodeResult {
  if (!input.trim()) {
    return { ok: true, text: "" };
  }

  const root = parseSvgRoot(input);
  if (!root) {
    return {
      ok: false,
      error: "Could not parse SVG. Paste valid SVG markup (root <svg>).",
    };
  }

  if (options.mode === "pretty") {
    const xml = elementToXml(root, 0);
    return { ok: true, text: `<?xml version="1.0" encoding="UTF-8"?>\n${xml}` };
  }

  if (options.mode === "jsx") {
    return { ok: true, text: elementToJsx(root, 0) };
  }

  const name = sanitizeComponentName(options.componentName ?? "SvgIcon");
  const attrs = serializeAttributes(root, true);
  const childrenLines: string[] = [];
  for (const node of root.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent ?? "";
      if (isSvgWhitespaceText(root, t)) continue;
      childrenLines.push(`      ${escapeJsxText(t)}`);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      childrenLines.push(elementToJsx(node as Element, 3));
    }
  }

  const reactSource =
    childrenLines.length === 0
      ? `import type { SVGProps } from "react";

export function ${name}(props: SVGProps<SVGSVGElement>) {
  return (
    <svg${attrs} {...props} />
  );
}
`
      : `import type { SVGProps } from "react";

export function ${name}(props: SVGProps<SVGSVGElement>) {
  return (
    <svg${attrs} {...props}>
${childrenLines.join("\n")}
    </svg>
  );
}
`;

  return { ok: true, text: reactSource };
}
