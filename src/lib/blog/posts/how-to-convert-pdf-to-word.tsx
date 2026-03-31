import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPostT } from "../blog-post-i18n";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

const SLUG = "how-to-convert-pdf-to-word";

export const meta: BlogPostMeta = {
  slug: SLUG,
  title: "How to convert PDF to Word: methods that actually work",
  description:
    "Step-by-step ways to turn a PDF into an editable Word (DOCX) file: Microsoft Word, Acrobat, Google Docs, browser tools, and OCR for scans (plus layout limits and privacy tips).",
  publishedAt: "2026-03-31",
  category: "guide",
  readTimeMinutes: 11,
  keywords: [
    "how to convert pdf to word",
    "pdf to docx",
    "convert pdf to editable word",
    "open pdf in word",
    "pdf ocr word",
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
    ms: (chunks: unknown) => (
      <a
        href="https://support.microsoft.com/en-us/office/opening-pdfs-in-word-1d1d2acc-afa0-46ef-891d-b76bcd83d9c8"
        className={linkClass}
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks as string}
      </a>
    ),
    ms2: (chunks: unknown) => (
      <a
        href="https://support.microsoft.com/en-us/office/opening-pdfs-in-word-1d1d2acc-afa0-46ef-891d-b76bcd83d9c8"
        className={linkClass}
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks as string}
      </a>
    ),
    adobeGuide: (chunks: unknown) => (
      <a
        href="https://helpx.adobe.com/acrobat/using/exporting-pdfs-file-formats.html"
        className={linkClass}
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks as string}
      </a>
    ),
    adobeTut: (chunks: unknown) => (
      <a
        href="https://creativecloud.adobe.com/en/learn/acrobat/web/export-pdf-to-word-excel-ppt"
        className={linkClass}
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks as string}
      </a>
    ),
    tool: (chunks: unknown) => (
      <Link href="/pdf-to-word" className={linkClass}>
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
      <Link href="/pdf-to-word" className={linkClass}>
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

      <h2>{t("h2Hard")}</h2>
      <p>{tBlog.rich(pk("hardBody"), rich)}</p>

      <h2>{t("h2Word")}</h2>
      <p>{tBlog.rich(pk("wordIntro"), rich)}</p>
      <ol>
        <li>{tBlog.rich(pk("wordOl1"), rich)}</li>
        <li>{tBlog.rich(pk("wordOl2"), rich)}</li>
        <li>{tBlog.rich(pk("wordOl3"), rich)}</li>
        <li>{tBlog.rich(pk("wordOl4"), rich)}</li>
      </ol>
      <p>{tBlog.rich(pk("wordAfter"), rich)}</p>

      <h2>{t("h2Acrobat")}</h2>
      <p>{tBlog.rich(pk("acrobatBody"), rich)}</p>

      <h2>{t("h2Docs")}</h2>
      <p>{tBlog.rich(pk("docsBody"), rich)}</p>

      <h2>{t("h2Local")}</h2>
      <p>{tBlog.rich(pk("localBody"), rich)}</p>

      <h2>{t("h2Ocr")}</h2>
      <p>{tBlog.rich(pk("ocrBody"), rich)}</p>

      <h2>{t("h2Pick")}</h2>
      <ul>
        <li>{tBlog.rich(pk("pick1"), rich)}</li>
        <li>{tBlog.rich(pk("pick2"), rich)}</li>
        <li>{tBlog.rich(pk("pick3"), rich)}</li>
        <li>{tBlog.rich(pk("pick4"), rich)}</li>
        <li>{tBlog.rich(pk("pick5"), rich)}</li>
      </ul>

      <h2>{t("h2Privacy")}</h2>
      <p>{tBlog.rich(pk("privacyBody"), rich)}</p>

      <h2>{t("h2Problems")}</h2>
      <h3>{t("h3Tables")}</h3>
      <p>{t("tablesBody")}</p>
      <h3>{t("h3Fonts")}</h3>
      <p>{tBlog.rich(pk("fontsBody"), rich)}</p>
      <h3>{t("h3Headers")}</h3>
      <p>{t("headersBody")}</p>

      <h2>{t("h2Faq")}</h2>

      <h3>{t("faq1Q")}</h3>
      <p>{tBlog.rich(pk("faq1A"), rich)}</p>

      <h3>{t("faq2Q")}</h3>
      <p>{t("faq2A")}</p>

      <h3>{t("faq3Q")}</h3>
      <p>{t("faq3A")}</p>

      <h3>{t("faq4Q")}</h3>
      <p>{t("faq4A")}</p>

      <h3>{t("faq5Q")}</h3>
      <p>{t("faq5A")}</p>

      <h2>{t("h2Next")}</h2>
      <p>{tBlog.rich(pk("nextBody"), rich)}</p>
    </BlogProse>
  );
}
