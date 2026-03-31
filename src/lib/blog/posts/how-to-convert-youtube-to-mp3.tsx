import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPostT } from "../blog-post-i18n";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

const SLUG = "how-to-convert-youtube-to-mp3";

export const meta: BlogPostMeta = {
  slug: SLUG,
  title: "How to convert YouTube video to MP3 (local browser workflow, no uploads)",
  description:
    "Turn the audio from a YouTube video into an MP3 using a local browser converter. Learn what to provide (video file), output formats, bitrate basics, and why URL-based conversion is different.",
  publishedAt: "2026-04-03",
  category: "guide",
  readTimeMinutes: 10,
  keywords: [
    "how to convert youtube to mp3",
    "youtube to mp3 converter",
    "extract audio from video",
    "mp3 audio extraction",
    "local browser audio conversion",
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
        })}
      </p>

      <p>
        {t("toolPrompt")}{" "}
        <Link href="/youtube-to-mp3" className={linkClass}>
          {t("toolLink")}
        </Link>
        .
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

      <h2>{t("h2Workflow")}</h2>
      <ol>
        <li>
          {tBlog.rich(pk("workflowOl1"), {
            tool: () => (
              <Link href="/youtube-to-mp3" className={linkClass}>
                {t("toolLink")}
              </Link>
            ),
          })}
        </li>
        <li>{t("workflowOl2")}</li>
        <li>{t("workflowOl3")}</li>
        <li>{t("workflowOl4")}</li>
      </ol>

      <h2>{t("h2Settings")}</h2>
      <p>
        {tBlog.rich(pk("settingsBody"), {
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>

      <h2>{t("h2Url")}</h2>
      <p>{t("urlBody")}</p>

      <h2>{t("h2Expect")}</h2>
      <ul>
        <li>{t("exp1")}</li>
        <li>{t("exp2")}</li>
        <li>{t("exp3")}</li>
      </ul>

      <h2>{t("reference")}</h2>
      <p>
        {tBlog.rich(pk("refBody"), {
          ffm: (chunks) => (
            <a
              href="https://ffmpegwasm.netlify.app/docs/getting-started/usage"
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
            <Link href="/youtube-to-mp3" className={linkClass}>
              {t("toolLink")}
            </Link>
          ),
          hub: () => (
            <Link href="/audio-convert" className={linkClass}>
              Audio convert
            </Link>
          ),
        })}
      </p>
    </BlogProse>
  );
}

