/**
 * Client-only Open Graph / Twitter Card extraction using DOMParser (handles
 * messy real-world HTML better than line-based regex). Resolves relative URLs
 * when a base URL is provided.
 */

export interface OpenGraphParseResult {
  finalUrl: string | null;
  title: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogImages: string[];
  ogUrl: string | null;
  ogSiteName: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  twitterImages: string[];
}

const MAX_HTML_CHARS = 2_500_000;

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "0.0.0.0")
    return true;
  if (h === "[::1]" || h === "::1") return true;
  if (h === "metadata.google.internal") return true;
  if (h === "169.254.169.254" || h.startsWith("169.254.")) return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = h.match(ipv4);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

export function parseUrlSafe(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (isBlockedHost(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

function collectMeta(doc: Document): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const el of doc.querySelectorAll("meta")) {
    const key =
      el.getAttribute("property")?.trim() ||
      el.getAttribute("name")?.trim() ||
      "";
    if (!key) continue;
    const content = el.getAttribute("content");
    if (content == null || content === "") continue;
    const list = map.get(key) ?? [];
    list.push(content);
    map.set(key, list);
  }
  return map;
}

function first(map: Map<string, string[]>, k: string): string | null {
  const v = map.get(k)?.[0]?.trim();
  return v && v.length > 0 ? v : null;
}

function all(map: Map<string, string[]>, k: string): string[] {
  return (map.get(k) ?? []).map((s) => s.trim()).filter(Boolean);
}

function resolveHref(href: string, baseHref: string | null): string {
  if (!baseHref) return href.trim();
  try {
    return new URL(href.trim(), baseHref).href;
  } catch {
    return href.trim();
  }
}

function uniqueResolved(paths: string[], baseHref: string | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of paths) {
    const abs = resolveHref(p, baseHref);
    if (seen.has(abs)) continue;
    seen.add(abs);
    out.push(abs);
  }
  return out;
}

function documentTitle(doc: Document): string | null {
  const t = doc.querySelector("title")?.textContent;
  if (!t) return null;
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > 0 ? s : null;
}

/**
 * @param html - Raw HTML (e.g. View Source)
 * @param baseUrlForResolve - Page URL used to resolve relative og:image etc.; null keeps values as in source
 */
export function parseOpenGraphFromHtml(
  html: string,
  baseUrlForResolve: string | null,
): { ok: true; data: OpenGraphParseResult } | { ok: false; error: string } {
  const trimmed = html.trim();
  if (!trimmed)
    return { ok: false, error: "Paste HTML or fetch a page first." };
  if (trimmed.length > MAX_HTML_CHARS)
    return { ok: false, error: "HTML is too large (max ~2.5 MB)." };

  let baseHref: string | null = null;
  if (baseUrlForResolve?.trim()) {
    const u = parseUrlSafe(baseUrlForResolve);
    if (u) baseHref = u.href;
  }

  const doc = new DOMParser().parseFromString(trimmed, "text/html");
  const metas = collectMeta(doc);
  const title = documentTitle(doc);

  const ogImageRels = all(metas, "og:image");
  const ogImages = uniqueResolved(ogImageRels, baseHref);
  const ogImage = ogImages[0] ?? null;

  const twitterRaw = [
    ...all(metas, "twitter:image"),
    ...all(metas, "twitter:image:src"),
  ];
  const twitterImages = uniqueResolved(twitterRaw, baseHref);
  const twitterImage = twitterImages[0] ?? null;

  const ogUrlRaw = first(metas, "og:url");
  const ogUrl = ogUrlRaw ? resolveHref(ogUrlRaw, baseHref) : baseHref;

  return {
    ok: true,
    data: {
      finalUrl: baseHref,
      title,
      ogTitle: first(metas, "og:title") ?? null,
      ogDescription: first(metas, "og:description") ?? null,
      ogImage,
      ogImages,
      ogUrl,
      ogSiteName: first(metas, "og:site_name") ?? null,
      twitterCard: first(metas, "twitter:card") ?? null,
      twitterTitle: first(metas, "twitter:title") ?? null,
      twitterDescription: first(metas, "twitter:description") ?? null,
      twitterImage,
      twitterImages,
    },
  };
}

export function mergePreviewTitle(data: OpenGraphParseResult): string | null {
  return data.ogTitle ?? data.twitterTitle ?? data.title ?? null;
}

export function mergePreviewDescription(
  data: OpenGraphParseResult,
): string | null {
  return data.ogDescription ?? data.twitterDescription ?? null;
}

export function mergePreviewImage(data: OpenGraphParseResult): string | null {
  return data.ogImage ?? data.twitterImage ?? null;
}

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Reads HTML in the tab only when the target sends CORS headers allowing this origin.
 * No proxy, no app API: either succeeds or fails with a clear CORS message.
 */
export async function fetchHtmlInBrowser(
  url: string,
): Promise<
  { ok: true; html: string; finalUrl: string } | { ok: false; error: string }
> {
  const u = parseUrlSafe(url);
  if (!u)
    return { ok: false, error: "Enter a valid http(s) URL to a public host." };

  const ac = new AbortController();
  // Abort slow or hung responses without leaving the request dangling.
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(u.href, {
      mode: "cors",
      credentials: "omit",
      redirect: "follow",
      signal: ac.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    if (html.length > MAX_HTML_CHARS)
      return { ok: false, error: "Page HTML is too large for this tool." };
    const finalUrl = res.url || u.href;
    return { ok: true, html, finalUrl };
  } catch (e) {
    // fetch() may reject with DOMException("Aborted") which is not always instanceof Error (e.g. jsdom).
    const isAbort =
      (e instanceof Error && e.name === "AbortError") ||
      (typeof e === "object" &&
        e !== null &&
        "name" in e &&
        (e as { name: string }).name === "AbortError");
    if (isAbort) return { ok: false, error: "Request timed out." };
    return {
      ok: false,
      error:
        "Browser could not read this URL (CORS). Open the page, View Source, copy the HTML, paste below, and set Page URL for image resolution.",
    };
  } finally {
    clearTimeout(t);
  }
}
