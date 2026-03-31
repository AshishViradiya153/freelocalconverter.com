import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const loaders: Record<string, () => Promise<{ default: unknown }>> = {
    en: () => import("../../messages/en.json"),
    zh: () => import("../../messages/zh.json"),
    es: () => import("../../messages/es.json"),
    pt: () => import("../../messages/pt.json"),
    fr: () => import("../../messages/fr.json"),
    de: () => import("../../messages/de.json"),
    nl: () => import("../../messages/nl.json"),
    it: () => import("../../messages/it.json"),
    ja: () => import("../../messages/ja.json"),
    tr: () => import("../../messages/tr.json"),
    az: () => import("../../messages/az.json"),
    ko: () => import("../../messages/ko.json"),
    ar: () => import("../../messages/ar.json"),
    fa: () => import("../../messages/fa.json"),
    ru: () => import("../../messages/ru.json"),
    he: () => import("../../messages/he.json"),
    el: () => import("../../messages/el.json"),
  };

  const load = loaders[locale];
  if (!load) {
    throw new Error(
      `Missing messages loader for locale "${locale}". Add it to src/i18n/request.ts`,
    );
  }

  const messages = (await load()).default as Record<string, unknown>;

  const blogPostLoaders: Record<string, () => Promise<{ default: unknown }>> = {
    en: () => import("../../messages/blog-posts/en.json"),
    zh: () => import("../../messages/blog-posts/zh.json"),
    es: () => import("../../messages/blog-posts/es.json"),
    pt: () => import("../../messages/blog-posts/pt.json"),
    fr: () => import("../../messages/blog-posts/fr.json"),
    de: () => import("../../messages/blog-posts/de.json"),
    nl: () => import("../../messages/blog-posts/nl.json"),
    it: () => import("../../messages/blog-posts/it.json"),
    ja: () => import("../../messages/blog-posts/ja.json"),
    tr: () => import("../../messages/blog-posts/tr.json"),
    az: () => import("../../messages/blog-posts/az.json"),
    ko: () => import("../../messages/blog-posts/ko.json"),
    ar: () => import("../../messages/blog-posts/ar.json"),
    fa: () => import("../../messages/blog-posts/fa.json"),
    ru: () => import("../../messages/blog-posts/ru.json"),
    he: () => import("../../messages/blog-posts/he.json"),
    el: () => import("../../messages/blog-posts/el.json"),
  };

  const blogPostsEn = (await blogPostLoaders.en()).default as {
    posts: Record<string, Record<string, unknown>>;
  };
  const blogPostsLocale = (await (blogPostLoaders[locale] ?? blogPostLoaders.en)())
    .default as { posts?: Record<string, Record<string, unknown>> };

  const blogBlock = messages.blog;
  const mergedBlog =
    blogBlock && typeof blogBlock === "object" && !Array.isArray(blogBlock)
      ? {
          ...blogBlock,
          posts: {
            ...blogPostsEn.posts,
            ...(blogPostsLocale.posts ?? {}),
            ...((blogBlock as { posts?: Record<string, unknown> }).posts ?? {}),
          },
        }
      : { posts: { ...blogPostsEn.posts, ...(blogPostsLocale.posts ?? {}) } };

  return {
    locale,
    messages: {
      ...messages,
      blog: mergedBlog,
    },
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter(Boolean).join(".");
      throw new Error(
        `Missing i18n message "${path}" for locale "${locale}". Run \`node scripts/sync-messages-from-en.mjs\` after adding keys to messages/en.json, then translate.`,
      );
    },
  };
});
