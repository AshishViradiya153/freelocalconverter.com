import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPostT } from "../blog-post-i18n";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

const SLUG = "how-to-convert-celsius-to-fahrenheit";

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

const codeCls = "text-foreground";

export const meta: BlogPostMeta = {
  slug: SLUG,
  title: "How to convert Celsius to Fahrenheit (and Fahrenheit to Celsius)",
  description:
    "Use the exact formulas to convert temperatures between Celsius and Fahrenheit: F = C × 9/5 + 32 and C = (F - 32) × 5/9. Includes examples and a quick calculator workflow.",
  publishedAt: "2026-04-03",
  category: "guide",
  readTimeMinutes: 9,
  keywords: [
    "how to convert celsius to fahrenheit",
    "celsius to fahrenheit formula",
    "fahrenheit to celsius formula",
    "temperature conversion",
    "convert °C to °F",
  ],
  contentFromMessages: true,
};

export async function BlogPostContent() {
  const tBlog = await getTranslations("blog");
  const t = (key: string) => blogPostT(tBlog, SLUG, key);
  const pk = (key: string) => `posts.${SLUG}.${key}` as const;

  const code = {
    ninefive: () => <code className={codeCls}>* 9/5</code>,
    plus32: () => <code className={codeCls}>+ 32</code>,
    thirtytwo: () => <code className={codeCls}>32</code>,
    fivenine: () => <code className={codeCls}>* 5/9</code>,
    eighteen: () => <code className={codeCls}>1.8</code>,
    zerofive: () => <code className={codeCls}>0.555...</code>,
  };

  return (
    <BlogProse>
      <p>
        {tBlog.rich(pk("intro"), {
          lead: (chunks) => <strong>{chunks}</strong>,
        })}
        <br />
        <code className={codeCls}>F = C * 9/5 + 32</code> and
        <br />
        <code className={codeCls}>C = (F - 32) * 5/9</code>
        {t("introAfterFormulas")}
      </p>

      <p>
        {t("converterPrompt")}{" "}
        <Link href="/celsius-fahrenheit-converter" className={linkClass}>
          {t("converterLink")}
        </Link>
        .
      </p>

      <p>
        <strong>{t("keyTakeaways")}</strong>
      </p>
      <ul>
        <li>{tBlog.rich(pk("takeaway1"), code)}</li>
        <li>{tBlog.rich(pk("takeaway2"), code)}</li>
        <li>{t("takeaway3")}</li>
        <li>{t("takeaway4")}</li>
      </ul>

      <h2>{t("h2CtoF")}</h2>
      <p>
        {t("stepIntro")}{" "}
        <code className={codeCls}>F = C * 9/5 + 32</code>.
      </p>

      <ol>
        <li>{tBlog.rich(pk("stepOl1"), code)}</li>
        <li>{tBlog.rich(pk("stepOl2"), code)}</li>
        <li>{t("stepOl3")}</li>
      </ol>

      <h2>{t("h2Examples")}</h2>
      <p>
        {t("ex1Intro")}{" "}
        <br />
        <code className={codeCls}>F = 20 * 9/5 + 32</code> ={" "}
        <code className={codeCls}>36 + 32</code> ={" "}
        <code className={codeCls}>68 F</code>.
      </p>
      <p>
        {t("ex2Intro")}{" "}
        <br />
        <code className={codeCls}>F = 0 * 9/5 + 32</code> ={" "}
        <code className={codeCls}>32 F</code>.
      </p>

      <h2>{t("h2FtoC")}</h2>
      <p>
        {t("inverseIntro")}{" "}
        <code className={codeCls}>C = (F - 32) * 5/9</code>.
      </p>

      <ol>
        <li>{tBlog.rich(pk("invOl1"), code)}</li>
        <li>{tBlog.rich(pk("invOl2"), code)}</li>
        <li>{t("invOl3")}</li>
      </ol>

      <h2>{t("h2Accuracy")}</h2>
      <ul>
        <li>{t("acc1")}</li>
        <li>{t("acc2")}</li>
      </ul>

      <h2>{t("h2Reference")}</h2>
      <p>
        {tBlog.rich(pk("refNist"), {
          nist: (chunks) => (
            <a
              href="https://www.nist.gov/pml/owm/si-units-temperature"
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
            <Link href="/celsius-fahrenheit-converter" className={linkClass}>
              {t("converterLink")}
            </Link>
          ),
        })}
      </p>
    </BlogProse>
  );
}
