import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPostT } from "../blog-post-i18n";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

const SLUG = "how-to-convert-pdf-to-jpg";

export const meta: BlogPostMeta = {
  slug: SLUG,
  title: "How to convert PDF to JPG: quality, DPI, and local export",
  description:
    "Export PDF pages as JPEG images: pick resolution and quality, handle white backgrounds for photos, and use desktop apps or Localtool’s browser PDF-to-image (ZIP, single pages, or combined).",
  publishedAt: "2026-04-02",
  category: "guide",
  readTimeMinutes: 10,
  keywords: [
    "how to convert pdf to jpg",
    "pdf to jpeg",
    "export pdf pages as images",
    "pdf to jpg online",
    "convert pdf to jpg locally",
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
    em: (chunks: unknown) => <em>{chunks as string}</em>,
    code: (chunks: unknown) => <code className="text-foreground">{chunks as string}</code>,
    back: (chunks: unknown) => (
      <Link href="/blog/how-to-convert-jpg-to-pdf" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    adobe: (chunks: unknown) => (
      <a
        href="https://helpx.adobe.com/acrobat/using/pdf-to-jpg.html"
        className={linkClass}
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks as string}
      </a>
    ),
    tool: (chunks: unknown) => (
      <Link href="/pdf-to-image" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    tool2: (chunks: unknown) => (
      <Link href="/pdf-to-image" className={linkClass}>
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
    tool3: (chunks: unknown) => (
      <Link href="/pdf-to-image" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    back2: (chunks: unknown) => (
      <Link href="/blog/how-to-convert-jpg-to-pdf" className={linkClass}>
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

      <h2>{t("h2M1")}</h2>
      <p>{tBlog.rich(pk("m1"), rich)}</p>

      <h2>{t("h2M2")}</h2>
      <p>{tBlog.rich(pk("m2"), rich)}</p>

      <h2>{t("h2M3")}</h2>
      <p>{tBlog.rich(pk("m3"), rich)}</p>

      <h2>{t("h2Choose")}</h2>
      <ul>
        <li>{tBlog.rich(pk("choose1"), rich)}</li>
        <li>{tBlog.rich(pk("choose2"), rich)}</li>
        <li>{tBlog.rich(pk("choose3"), rich)}</li>
      </ul>

      <h2>{t("h2Png")}</h2>
      <p>{tBlog.rich(pk("pngBody"), rich)}</p>

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

      <h2>{t("h2Next")}</h2>
      <p>{tBlog.rich(pk("nextBody"), rich)}</p>
    </BlogProse>
  );
}
