import {
  BlogPostContent as C1,
  meta as m1,
} from "./posts/choosing-csv-tools-for-teams";
import { BlogPostContent as C2, meta as m2 } from "./posts/csv-viewer-overview";
import {
  BlogPostContent as C3,
  meta as m3,
} from "./posts/editing-with-undo-redo";
import {
  BlogPostContent as C4,
  meta as m4,
} from "./posts/export-and-download-csv";
import {
  BlogPostContent as C5,
  meta as m5,
} from "./posts/local-first-csv-privacy";
import {
  BlogPostContent as C6,
  meta as m6,
} from "./posts/pagination-and-large-csv-files";
import { plannedPostsPartA } from "./posts/planned-posts-part-a";
import { plannedPostsPartB } from "./posts/planned-posts-part-b";
import { plannedPostsPartC } from "./posts/planned-posts-part-c";
import { plannedPostsPartD } from "./posts/planned-posts-part-d";
import { plannedPostsPartE } from "./posts/planned-posts-part-e";
import {
  BlogPostContent as C7,
  meta as m7,
} from "./posts/sort-filter-search-guide";
import {
  BlogPostContent as C8,
  meta as m8,
} from "./posts/csv-compare-two-files-browser";
import type { PublishedBlogPost } from "./types";

const originalPosts: PublishedBlogPost[] = [
  { meta: m1, Content: C1 },
  { meta: m2, Content: C2 },
  { meta: m3, Content: C3 },
  { meta: m4, Content: C4 },
  { meta: m5, Content: C5 },
  { meta: m6, Content: C6 },
  { meta: m7, Content: C7 },
  { meta: m8, Content: C8 },
];

export const publishedBlogPosts: PublishedBlogPost[] = [
  ...originalPosts,
  ...plannedPostsPartA,
  ...plannedPostsPartB,
  ...plannedPostsPartC,
  ...plannedPostsPartD,
  ...plannedPostsPartE,
].sort((a, b) => {
  const byDate = b.meta.publishedAt.localeCompare(a.meta.publishedAt);
  if (byDate !== 0) return byDate;
  return a.meta.title.localeCompare(b.meta.title);
});

export function getPostBySlug(slug: string): PublishedBlogPost | undefined {
  return publishedBlogPosts.find((p) => p.meta.slug === slug);
}

export function getAllPostSlugs(): string[] {
  return publishedBlogPosts.map((p) => p.meta.slug);
}
