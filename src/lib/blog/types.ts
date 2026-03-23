import type { ComponentType } from "react";

export type BlogCategory = "guide" | "insights";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  category: BlogCategory;
  readTimeMinutes: number;
  keywords?: string[];
}

export interface PublishedBlogPost {
  meta: BlogPostMeta;
  Content: ComponentType;
}
