import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPostT } from "../blog-post-i18n";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

const SLUG = "how-to-convert-jpg-to-pdf";

export const meta: BlogPostMeta = {
  slug: SLUG,
  title: "How to convert JPG to PDF: one file, many photos, correct order",
  description:
    "Turn JPEG and other images into a single PDF: order pages, pick page size and fit, use Print to PDF or Acrobat, or build locally in the browser with FreeLocalConverter’s Images to PDF.",
  publishedAt: "2026-04-02",
  category: "guide",
  readTimeMinutes: 9,
  keywords: [
    "how to convert jpg to pdf",
    "jpeg to pdf",
    "combine images into pdf",
    "merge jpg to one pdf",
    "images to pdf online",
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
      <Link href="/blog/how-to-convert-pdf-to-jpg" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    adobe: (chunks: unknown) => (
      <a
        href="https://helpx.adobe.com/acrobat/using/creating-simple-pdfs-acrobat.html"
        className={linkClass}
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks as string}
      </a>
    ),
    tool: (chunks: unknown) => (
      <Link href="/images-to-pdf" className={linkClass}>
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
      <Link href="/images-to-pdf" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    tool3: (chunks: unknown) => (
      <Link href="/images-to-pdf" className={linkClass}>
        {chunks as string}
      </Link>
    ),
    back2: (chunks: unknown) => (
      <Link href="/blog/how-to-convert-pdf-to-jpg" className={linkClass}>
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

      <h2>{t("h2Why")}</h2>
      <p>{tBlog.rich(pk("whyBody"), rich)}</p>

      <h2>{t("h2M1")}</h2>
      <p>{tBlog.rich(pk("m1"), rich)}</p>

      <h2>{t("h2M2")}</h2>
      <p>{tBlog.rich(pk("m2"), rich)}</p>

      <h2>{t("h2M3")}</h2>
      <p>{tBlog.rich(pk("m3"), rich)}</p>

      <h2>{t("h2M4")}</h2>
      <p>{tBlog.rich(pk("m4"), rich)}</p>

      <h2>{t("h2Contain")}</h2>
      <ul>
        <li>{tBlog.rich(pk("contain1"), rich)}</li>
        <li>{tBlog.rich(pk("contain2"), rich)}</li>
      </ul>

      <h2>{t("h2Size")}</h2>
      <p>{tBlog.rich(pk("sizeBody"), rich)}</p>

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
