import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPostT } from "../blog-post-i18n";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

const SLUG = "how-to-convert-degrees-to-radians";

export const meta: BlogPostMeta = {
  slug: SLUG,
  title:
    "How to convert degrees to radians (and radians to degrees) for math and geometry",
  description:
    "Convert angles between degrees and radians using rad = deg * pi / 180 and deg = rad * 180 / pi. Includes clear examples and a quick browser converter.",
  publishedAt: "2026-04-03",
  category: "guide",
  readTimeMinutes: 9,
  keywords: [
    "how to convert degrees to radians",
    "degrees to radians formula",
    "radians to degrees formula",
    "pi radians equals 180 degrees",
    "angle unit conversion",
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
        })}{" "}
        <br />
        <code className="text-foreground">rad = deg * pi / 180</code>.
        {` ${t("introAfterFormula")}`}
        <br />
        <code className="text-foreground">deg = rad * 180 / pi</code>.
      </p>

      <p>
        {t("converterPrompt")}{" "}
        <Link href="/degrees-radians-converter" className={linkClass}>
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
        <li>
          {tBlog.rich(pk("takeaway2"), {
            code: (chunks) => <code className="text-foreground">{chunks}</code>,
          })}
        </li>
        <li>{t("takeaway3")}</li>
        <li>{t("takeaway4")}</li>
      </ul>

      <h2>{t("h2D2R")}</h2>
      <p>
        {tBlog.rich(pk("d2rBody"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>

      <ol>
        <li>{t("d2rOl1")}</li>
        <li>{t("d2rOl2")}</li>
        <li>{t("d2rOl3")}</li>
        <li>{t("d2rOl4")}</li>
      </ol>

      <h2>{t("h2Examples")}</h2>
      <p>
        {t("ex1")}{" "}
        <br />
        {tBlog.rich(pk("ex1Eq"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>
      <p>
        {t("ex2")}{" "}
        <br />
        {tBlog.rich(pk("ex2Eq"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>

      <h2>{t("h2R2D")}</h2>
      <p>
        {tBlog.rich(pk("r2dBody"), {
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>

      <ol>
        <li>{t("r2dOl1")}</li>
        <li>{t("r2dOl2")}</li>
        <li>{t("r2dOl3")}</li>
      </ol>

      <h2>{t("h2Mistakes")}</h2>
      <ul>
        <li>{t("mistake1")}</li>
        <li>{t("mistake2")}</li>
      </ul>

      <h2>{t("reference")}</h2>
      <p>
        {tBlog.rich(pk("refBody"), {
          wiki: (chunks) => (
            <a
              href="https://en.wikipedia.org/wiki/Radian"
              className={linkClass}
              rel="noopener noreferrer"
              target="_blank"
            >
              {chunks}
            </a>
          ),
        })}
      </p>

      <h2>{t("h2Next")}</h2>
      <p>
        {tBlog.rich(pk("nextBody"), {
          tool: () => (
            <Link href="/degrees-radians-converter" className={linkClass}>
              {t("converterLink")}
            </Link>
          ),
        })}
      </p>
    </BlogProse>
  );
}
