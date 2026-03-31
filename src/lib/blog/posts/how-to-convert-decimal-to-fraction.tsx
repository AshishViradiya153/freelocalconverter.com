import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPostT } from "../blog-post-i18n";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

const SLUG = "how-to-convert-decimal-to-fraction";

export const meta: BlogPostMeta = {
  slug: SLUG,
  title: "How to convert decimals to fractions (simplest form, mixed numbers, and examples)",
  description:
    "Convert a decimal like 0.375 into a simplified fraction (3/8). Learn terminating vs repeating decimals, mixed numbers, and when rounding is unavoidable.",
  publishedAt: "2026-04-03",
  category: "guide",
  readTimeMinutes: 11,
  keywords: [
    "how to convert decimal to fraction",
    "decimal to fraction",
    "simplify fraction",
    "mixed number to fraction",
    "convert decimals to fractions",
  ],
  contentFromMessages: true,
};

export async function BlogPostContent() {
  const tBlog = await getTranslations("blog");
  const t = (key: string) => blogPostT(tBlog, SLUG, key);
  const pk = (key: string) => `posts.${SLUG}.${key}` as const;
  const linkClass =
    "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

  return (
    <BlogProse>
      <p>
        {tBlog.rich(pk("intro"), {
          lead: (chunks) => <strong>{chunks}</strong>,
          strong: (chunks) => <strong>{chunks}</strong>,
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>

      <p>
        {t("converterPrompt")}{" "}
        <Link href="/decimal-fraction-converter" className={linkClass}>
          {t("converterLink")}
        </Link>{" "}
        {t("converterAfter")}
      </p>

      <p>
        <strong>{t("keyTakeaways")}</strong>
      </p>
      <ul>
        <li>{t("takeaway1")}</li>
        <li>{t("takeaway2")}</li>
        <li>{t("takeaway3")}</li>
        <li>{t("takeaway4")}</li>
      </ul>

      <h2>{t("h2Step1")}</h2>
      <p>{t("step1Intro")}</p>
      <ul>
        <li>
          <strong>{t("termLabel")}</strong>: {t("termBody")}
        </li>
        <li>
          <strong>{t("repLabel")}</strong>: {t("repBody")}
        </li>
      </ul>

      <h2>{t("h2Terminating")}</h2>
      <p>{t("termHow")}</p>

      <ol>
        <li>{t("termOl1")}</li>
        <li>{t("termOl2")}</li>
        <li>{t("termOl3")}</li>
      </ol>

      <h2>{t("h2Examples")}</h2>
      <p>
        {t("ex1")} <br />
        {t("ex1Eq")}
      </p>
      <p>
        {t("ex2")} <br />
        {t("ex2Eq")}
      </p>

      <h2>{t("h2Repeating")}</h2>
      <p>{t("repIntro")}</p>
      <ol>
        <li>{t("repOl1")}</li>
        <li>{t("repOl2")}</li>
        <li>{t("repOl3")}</li>
        <li>{t("repOl4")}</li>
      </ol>

      <p>{t("repQuick")}</p>

      <h2>{t("h2Rounding")}</h2>
      <p>{t("roundingBody")}</p>

      <h2>{t("h2Next")}</h2>
      <p>
        {t("nextPrompt")}{" "}
        <Link
          href="/blog/how-to-convert-fractions-to-decimals"
          className={linkClass}
        >
          {t("nextLink")}
        </Link>
        .
      </p>

      <h2>{t("reference")}</h2>
      <p>
        {t("refPrompt")}{" "}
        <a
          href="https://www.mathsisfun.com/converting-decimals-fractions.html"
          className={linkClass}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("refLink")}
        </a>
        .
      </p>
    </BlogProse>
  );
}

