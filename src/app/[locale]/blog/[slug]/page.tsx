import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog/registry";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllPostSlugs().map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Not found" };
  }
  const { meta } = post;
  const pathname = `/blog/${meta.slug}`;
  return buildPageMetadata({
    locale,
    pathname,
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    type: "article",
    publishedTime: `${meta.publishedAt}T12:00:00Z`,
    alternateLocales: true,
  });
}

function formatDate(iso: string, locale: string) {
  try {
    const loc = locale === "en" ? "en-US" : locale;
    return new Intl.DateTimeFormat(loc, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(`${iso}T12:00:00Z`));
  } catch {
    return iso;
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const { meta, Content } = post;

  const categoryLabel =
    meta.category === "guide" ? t("categoryGuide") : t("categoryInsights");

  return (
    <div className="container max-w-3xl py-10 pb-20">
      <nav className="text-muted-foreground text-sm">
        <Link
          href="/blog"
          locale={locale}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("backToBlog")}
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground/80">{t("articleCrumb")}</span>
      </nav>

      <article className="mt-8">
        <header className="border-border border-b pb-8">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {categoryLabel} · {t("readMin", { n: meta.readTimeMinutes })}
          </p>
          <h1 className={cn(toolHeroTitleClassName, "mt-2")}>{meta.title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
            {meta.description}
          </p>
          <p className="mt-4 text-muted-foreground text-xs">
            {t("publishedLine", {
              date: formatDate(meta.publishedAt, locale),
              name: siteConfig.name,
            })}
          </p>
        </header>

        <div className="mt-10">
          <Content />
        </div>
      </article>

      <p className="mt-14 text-center text-muted-foreground text-sm">
        <Link
          href="/blog"
          locale={locale}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("allArticles")}
        </Link>
      </p>
    </div>
  );
}
