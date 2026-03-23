import { siteConfig } from "@/config/site";

/**
 * Append UTM query params to an absolute URL without clobbering existing keys.
 * Invalid / relative URLs are returned unchanged.
 */
export function appendUtmParams(
  href: string,
  params: Record<string, string | undefined>,
): string {
  try {
    const u = new URL(href);
    for (const [key, value] of Object.entries(params)) {
      if (!value) continue;
      if (!u.searchParams.has(key)) u.searchParams.set(key, value);
    }
    return u.toString();
  } catch {
    return href;
  }
}

function withSiteSource(
  href: string,
  extras: Record<string, string | undefined>,
): string {
  return appendUtmParams(href, {
    utm_source: siteConfig.utmSource,
    ...extras,
  });
}

/** Trusted-by marquee → third-party homepages. */
export function trustedByOutboundUrl(href: string, content: string): string {
  return withSiteSource(href, {
    utm_medium: "trusted_by",
    utm_campaign: "marquee",
    utm_content: content,
  });
}

/** Site header GitHub (or other repo) link. */
export function headerRepoOutboundUrl(href: string): string {
  return withSiteSource(href, {
    utm_medium: "header",
    utm_campaign: "repo_link",
    utm_content: "github",
  });
}
