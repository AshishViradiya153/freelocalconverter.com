import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveBlogPostSeo } from "@/lib/blog/blog-post-i18n";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog/registry";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";
import { BlogPageFrame } from "@/app/components/blog-page-frame";

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
  const tBlog = await getTranslations({ locale, namespace: "blog" });
  const seo = resolveBlogPostSeo(tBlog, meta);
  const pathname = `/blog/${meta.slug}`;
  return buildPageMetadata({
    locale,
    pathname,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
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

  const seo = resolveBlogPostSeo(t, meta);

  return (
    <div className="container max-w-3xl py-10 pb-20">
      <BlogPageFrame
        header={
          <header className="border-border border-b-4 bg-primary p-4 sm:p-6 md:p-8">
            <p className="font-medium text-primary-foreground text-xs uppercase tracking-wide">
              {categoryLabel} · {t("readMin", { n: meta.readTimeMinutes })}
            </p>
            <h1
              className={cn(
                toolHeroTitleClassName,
                "mt-2 text-primary-foreground",
              )}
            >
              {seo.title}
            </h1>
            <p className="mt-3 max-w-2xl text-primary-foreground/85 text-sm leading-relaxed">
              {seo.description}
            </p>
            <p className="mt-4 text-primary-foreground/70 text-xs">
              {t("publishedLine", {
                date: formatDate(meta.publishedAt, locale),
                name: siteConfig.name,
              })}
            </p>
          </header>
        }
      >
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

        <article className="mt-10">
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
      </BlogPageFrame>
    </div>
  );
}
