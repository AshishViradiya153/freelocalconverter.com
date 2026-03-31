import type { BlogPostMeta } from "./types";

export function blogPostT(
  tBlog: (key: string) => string,
  slug: string,
  key: string,
): string {
  return tBlog(`posts.${slug}.${key}`);
}

export function blogPostKeywordsFromMessage(
  tBlog: (key: string) => string,
  slug: string,
): string[] | undefined {
  const raw = blogPostT(tBlog, slug, "keywords").trim();
  if (!raw) return undefined;
  return raw
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean);
}

export function resolveBlogPostSeo(
  tBlog: (key: string) => string,
  meta: BlogPostMeta,
): { title: string; description: string; keywords?: string[] } {
  if (!meta.contentFromMessages) {
    return {
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
    };
  }
  const fromMsg = blogPostKeywordsFromMessage(tBlog, meta.slug);
  return {
    title: blogPostT(tBlog, meta.slug, "title"),
    description: blogPostT(tBlog, meta.slug, "description"),
    keywords: fromMsg?.length ? fromMsg : meta.keywords,
  };
}
