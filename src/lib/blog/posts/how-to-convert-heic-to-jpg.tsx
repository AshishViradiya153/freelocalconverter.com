import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPostT } from "../blog-post-i18n";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

const SLUG = "how-to-convert-heic-to-jpg";

export const meta: BlogPostMeta = {
  slug: SLUG,
  title: "How to convert HEIC to JPG: iPhone, Windows, Mac, and browser",
  description:
    "Turn HEIC/HEIF photos into JPG (JPEG) or PNG: change iPhone camera format, use Photos on Mac, add HEIF support on Windows, or convert locally in the browser (plus quality and batch tips).",
  publishedAt: "2026-04-01",
  category: "guide",
  readTimeMinutes: 10,
  keywords: [
    "how to convert heic to jpg",
    "heic to jpeg",
    "iphone heic converter",
    "heif to jpg",
    "convert heic windows",
  ],
  contentFromMessages: true,
};

export async function BlogPostContent() {
  const tBlog = await getTranslations("blog");
  const t = (key: string) => blogPostT(tBlog, SLUG, key);
  const pk = (key: string) => `posts.${SLUG}.${key}` as const;
  const linkClass =
    "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

  const rich = {
    lead: (chunks: unknown) => <strong>{chunks as string}</strong>,
    strong: (chunks: unknown) => <strong>{chunks as string}</strong>,
    code: (chunks: unknown) => <code className="text-foreground">{chunks as string}</code>,
    apple: (chunks: unknown) => (
      <a
        href="https://support.apple.com/en-us/HT207022"
        className={linkClass}
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks as string}
      </a>
    ),
    apple2: (chunks: unknown) => (
      <a
        href="https://support.apple.com/en-us/HT207022"
        className={linkClass}
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks as string}
      </a>
    ),
    tool: (chunks: unknown) => (
      <Link href="/heic-to-jpg" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    due: (chunks: unknown) => (
      <Link href="/blog/vendor-due-diligence-for-browser-tools" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    localFirst: (chunks: unknown) => (
      <Link href="/blog/local-first-csv-privacy" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    tool2: (chunks: unknown) => (
      <Link href="/heic-to-jpg" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    blog: (chunks: unknown) => (
      <Link href="/blog" className={linkClass}>
        {chunks as string}
      </Link>
    ),
  };

  return (
    <BlogProse>
      <p>
        {tBlog.rich(pk("intro"), rich)}
      </p>

      <p>
        <strong>{t("keyTakeaways")}</strong>
      </p>
      <ul>
        <li>{tBlog.rich(pk("takeaway1"), rich)}</li>
        <li>{tBlog.rich(pk("takeaway2"), rich)}</li>
        <li>{tBlog.rich(pk("takeaway3"), rich)}</li>
        <li>{tBlog.rich(pk("takeaway4"), rich)}</li>
      </ul>

      <h2>{t("h2What")}</h2>
      <p>{tBlog.rich(pk("whatBody"), rich)}</p>

      <h2>{t("h2Opt1")}</h2>
      <p>{tBlog.rich(pk("opt1Body"), rich)}</p>

      <h2>{t("h2Opt2")}</h2>
      <p>{tBlog.rich(pk("opt2Body"), rich)}</p>

      <h2>{t("h2Opt3")}</h2>
      <p>{tBlog.rich(pk("opt3Body"), rich)}</p>

      <h2>{t("h2Opt4")}</h2>
      <p>{tBlog.rich(pk("opt4Body"), rich)}</p>

      <h2>{t("h2JpgPng")}</h2>
      <ul>
        <li>{tBlog.rich(pk("jpgPng1"), rich)}</li>
        <li>{tBlog.rich(pk("jpgPng2"), rich)}</li>
      </ul>

      <h2>{t("h2Privacy")}</h2>
      <p>{tBlog.rich(pk("privacyBody"), rich)}</p>

      <h2>{t("h2Faq")}</h2>

      <h3>{t("faq1Q")}</h3>
      <p>{tBlog.rich(pk("faq1A"), rich)}</p>

      <h3>{t("faq2Q")}</h3>
      <p>{tBlog.rich(pk("faq2A"), rich)}</p>

      <h3>{t("faq3Q")}</h3>
      <p>{tBlog.rich(pk("faq3A"), rich)}</p>

      <h3>{t("faq4Q")}</h3>
      <p>{tBlog.rich(pk("faq4A"), rich)}</p>

      <h3>{t("faq5Q")}</h3>
      <p>{t("faq5A")}</p>

      <h2>{t("h2Next")}</h2>
      <p>{tBlog.rich(pk("nextBody"), rich)}</p>
    </BlogProse>
  );
}
