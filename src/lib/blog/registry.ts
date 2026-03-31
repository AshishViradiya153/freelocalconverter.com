import {
  BlogPostContent as C1,
  meta as m1,
} from "./posts/choosing-csv-tools-for-teams";
import {
  BlogPostContent as C8,
  meta as m8,
} from "./posts/csv-compare-two-files-browser";
import {
  BlogPostContent as C9,
  meta as m9,
} from "./posts/how-to-convert-pdf-to-word";
import {
  BlogPostContent as C10,
  meta as m10,
} from "./posts/how-to-convert-heic-to-jpg";
import {
  BlogPostContent as C11,
  meta as m11,
} from "./posts/how-to-convert-pdf-to-jpg";
import {
  BlogPostContent as C12,
  meta as m12,
} from "./posts/how-to-convert-jpg-to-pdf";
import {
  BlogPostContent as C13,
  meta as m13,
} from "./posts/how-to-convert-celsius-to-fahrenheit";
import {
  BlogPostContent as C14,
  meta as m14,
} from "./posts/how-to-convert-decimal-to-fraction";
import {
  BlogPostContent as C15,
  meta as m15,
} from "./posts/how-to-convert-fractions-to-decimals";
import {
  BlogPostContent as C16,
  meta as m16,
} from "./posts/how-to-convert-degrees-to-radians";
import {
  BlogPostContent as C17,
  meta as m17,
} from "./posts/how-to-convert-youtube-to-mp3";
import {
  BlogPostContent as C18,
  meta as m18,
} from "./posts/how-to-convert-lbs-to-kg";
import {
  BlogPostContent as C19,
  meta as m19,
} from "./posts/how-to-convert-kg-to-lbs";
import {
  BlogPostContent as C20,
  meta as m20,
} from "./posts/how-to-convert-feet-to-meters";
import { BlogPostContent as C21, meta as m21 } from "./posts/unit-converter-in-browser";
import { BlogPostContent as C22, meta as m22 } from "./posts/create-zip-in-browser";
import { BlogPostContent as C23, meta as m23 } from "./posts/rar-to-zip-what-it-means";
import { BlogPostContent as C24, meta as m24 } from "./posts/pst-to-est-conversion";
import { BlogPostContent as C25, meta as m25 } from "./posts/cst-to-est-conversion";
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
  { meta: m9, Content: C9 },
  { meta: m10, Content: C10 },
  { meta: m11, Content: C11 },
  { meta: m12, Content: C12 },
  { meta: m13, Content: C13 },
  { meta: m14, Content: C14 },
  { meta: m15, Content: C15 },
  { meta: m16, Content: C16 },
  { meta: m17, Content: C17 },
  { meta: m18, Content: C18 },
  { meta: m19, Content: C19 },
  { meta: m20, Content: C20 },
  { meta: m21, Content: C21 },
  { meta: m22, Content: C22 },
  { meta: m23, Content: C23 },
  { meta: m24, Content: C24 },
  { meta: m25, Content: C25 },
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
