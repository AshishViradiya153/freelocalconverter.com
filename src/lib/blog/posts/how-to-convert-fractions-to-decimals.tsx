import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPostT } from "../blog-post-i18n";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

const SLUG = "how-to-convert-fractions-to-decimals";

export const meta: BlogPostMeta = {
  slug: SLUG,
  title: "How to convert fractions to decimals (including mixed numbers and simplified results)",
  description:
    "Convert fractions like 3/8 into decimals like 0.375. Learn the fraction-to-decimal process, how mixed numbers work, and what to do when the decimal repeats.",
  publishedAt: "2026-04-03",
  category: "guide",
  readTimeMinutes: 10,
  keywords: [
    "how to convert fractions to decimals",
    "fraction to decimal",
    "convert mixed numbers to decimals",
    "repeating decimals",
    "simplify fraction first",
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
        </Link>
        .
      </p>

      <p>
        <strong>{t("keyTakeaways")}</strong>
      </p>
      <ul>
        <li>
          {tBlog.rich(pk("takeaway1"), {
            code: (chunks) => <code className="text-foreground">{chunks}</code>,
          })}
        </li>
        <li>{t("takeaway2")}</li>
        <li>{t("takeaway3")}</li>
        <li>{t("takeaway4")}</li>
      </ul>

      <h2>{t("h2Step")}</h2>
      <p>
        {tBlog.rich(pk("stepExample"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>
      <ol>
        <li>{t("stepOl1")}</li>
        <li>{t("stepOl2")}</li>
        <li>{t("stepOl3")}</li>
      </ol>
      <p>
        {tBlog.rich(pk("stepEq"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>

      <h2>{t("h2Mixed")}</h2>
      <p>
        {tBlog.rich(pk("mixedBody"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>

      <p>
        {tBlog.rich(pk("mixedExampleLabel"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}{" "}
        <br />
        {tBlog.rich(pk("mixedExample1"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}{" "}
        <br />
        {tBlog.rich(pk("mixedExample2"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>

      <h2>{t("h2Repeating")}</h2>
      <p>
        {tBlog.rich(pk("repeatingBody"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>

      <h2>{t("h2Best")}</h2>
      <ul>
        <li>{t("best1")}</li>
        <li>{t("best2")}</li>
        <li>{t("best3")}</li>
      </ul>

      <h2>{t("h2Next")}</h2>
      <p>
        {t("nextPrompt")}{" "}
        <Link
          href="/blog/how-to-convert-decimal-to-fraction"
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
          href="https://www.mathsisfun.com/converting-fractions-decimals.html"
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

