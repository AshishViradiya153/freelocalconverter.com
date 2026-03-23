import type { BlogCategory } from "./types";

/**
 * Guides not yet published. Ship by adding a post module and registering it in
 * `registry.ts`, then remove the topic from this list.
 */
export interface NextGuideTopic {
  slug: string;
  title: string;
  category: BlogCategory;
  angle: string;
}

export const nextGuideTopics: NextGuideTopic[] = [];
