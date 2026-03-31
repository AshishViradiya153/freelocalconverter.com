import type { ElementType } from "react";

export type BlogCategory = "guide" | "insights";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  category: BlogCategory;
  readTimeMinutes: number;
  keywords?: string[];
  contentFromMessages?: boolean;
}

export interface PublishedBlogPost {
  meta: BlogPostMeta;
  Content: ElementType;
}
