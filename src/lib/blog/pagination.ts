import { publishedBlogPosts } from "./registry";
import type { PublishedBlogPost } from "./types";

export const BLOG_INDEX_PAGE_SIZE = 10;

export interface BlogIndexListingResult {
  /** When set, call `redirect(redirectTo)` before rendering. */
  redirectTo: string | null;
  page: number;
  pageCount: number;
  items: PublishedBlogPost[];
  totalCount: number;
}

export function getBlogIndexListing(searchParams: {
  page?: string;
}): BlogIndexListingResult {
  const totalCount = publishedBlogPosts.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / BLOG_INDEX_PAGE_SIZE));
  const raw = searchParams.page;

  function sliceForPage(page: number): PublishedBlogPost[] {
    const start = (page - 1) * BLOG_INDEX_PAGE_SIZE;
    return publishedBlogPosts.slice(start, start + BLOG_INDEX_PAGE_SIZE);
  }

  if (raw === undefined) {
    return {
      redirectTo: null,
      page: 1,
      pageCount,
      items: sliceForPage(1),
      totalCount,
    };
  }

  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return {
      redirectTo: "/blog",
      page: 1,
      pageCount,
      items: sliceForPage(1),
      totalCount,
    };
  }

  if (n === 1) {
    return {
      redirectTo: "/blog",
      page: 1,
      pageCount,
      items: sliceForPage(1),
      totalCount,
    };
  }

  if (n > pageCount) {
    const page = pageCount;
    return {
      redirectTo: pageCount === 1 ? "/blog" : `/blog?page=${pageCount}`,
      page,
      pageCount,
      items: sliceForPage(page),
      totalCount,
    };
  }

  return {
    redirectTo: null,
    page: n,
    pageCount,
    items: sliceForPage(n),
    totalCount,
  };
}
