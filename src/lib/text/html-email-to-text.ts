export interface HtmlEmailToTextOptions {
  includeLinks: boolean;
  collapseWhitespace: boolean;
  maxBlankLines: number;
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function collapseBlankLines(text: string, maxBlankLines: number): string {
  if (maxBlankLines < 0) return text;
  const blank = "\n".repeat(maxBlankLines + 2);
  const replacement = "\n".repeat(maxBlankLines + 1);
  let out = text;
  while (out.includes(blank)) out = out.replaceAll(blank, replacement);
  return out;
}

export function htmlEmailToText(
  rawHtml: string,
  opts: HtmlEmailToTextOptions,
): string {
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");

  for (const el of Array.from(
    doc.querySelectorAll("script,style,noscript,template"),
  )) {
    el.remove();
  }

  for (const br of Array.from(doc.querySelectorAll("br"))) {
    br.replaceWith(doc.createTextNode("\n"));
  }

  for (const hr of Array.from(doc.querySelectorAll("hr"))) {
    hr.replaceWith(doc.createTextNode("\n\n---\n\n"));
  }

  const blockSelector =
    "p,div,section,article,header,footer,main,aside,table,thead,tbody,tfoot,tr,td,th,blockquote,pre,ul,ol,li,h1,h2,h3,h4,h5,h6";

  for (const el of Array.from(doc.querySelectorAll(blockSelector))) {
    const tag = el.tagName.toLowerCase();
    const prefix = tag === "li" ? "\n- " : "\n\n";
    const suffix = tag === "li" ? "" : "\n\n";
    el.prepend(doc.createTextNode(prefix));
    el.append(doc.createTextNode(suffix));
  }

  if (opts.includeLinks) {
    for (const a of Array.from(doc.querySelectorAll("a[href]"))) {
      const href = a.getAttribute("href")?.trim();
      if (!href) continue;
      const label = (a.textContent ?? "").trim();
      const safeHref = href.replace(/\s+/g, "");
      if (!label) {
        a.replaceWith(doc.createTextNode(safeHref));
        continue;
      }
      if (label === safeHref) continue;
      a.append(doc.createTextNode(` (${safeHref})`));
    }
  }

  const text = normalizeNewlines(doc.body?.textContent ?? "");
  const trimmed = text.replace(/[ \t]+\n/g, "\n").trim();
  const collapsed = opts.collapseWhitespace
    ? trimmed.replace(/[ \t]{2,}/g, " ")
    : trimmed;

  return collapseBlankLines(collapsed, opts.maxBlankLines).trim();
}

