import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import {
  ToolSectionHeading,
  toolHeroTitleClassName,
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Link, redirect } from "@/i18n/navigation";
import { nextGuideTopics } from "@/lib/blog/next-guide-topics";
import {
  BLOG_INDEX_PAGE_SIZE,
  getBlogIndexListing,
} from "@/lib/blog/pagination";
import { cn } from "@/lib/utils";
import { BlogPageFrame } from "@/app/components/blog-page-frame";

interface BlogIndexPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: BlogIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const sp = (await searchParams) ?? {};
  const { page, pageCount, redirectTo } = getBlogIndexListing(sp);
  const base: Metadata = {
    title: t("metaTitle"),
    description: t("metaDescription", { name: siteConfig.name }),
  };
  if (redirectTo !== null) return base;
  if (page > 1) {
    return {
      ...base,
      title: t("metaTitlePage", { page, pageCount }),
    };
  }
  return base;
}

function BlogIndexSkeleton() {
  return (
    <div
      className="container max-w-3xl animate-pulse py-10 pb-20"
      role="status"
      aria-live="polite"
    >
      <div className="border-4 border-border bg-background shadow-brutal-sm">
        <div className="border-border border-b-4 bg-primary p-4 sm:p-6 md:p-8">
          <div className="h-4 w-20 rounded bg-primary/50" />
          <div className="mt-4 h-10 max-w-sm rounded bg-primary/40" />
          <div className="mt-3 h-16 max-w-2xl rounded bg-primary/30" />
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          <div className="h-5 w-52 rounded bg-muted" />
          <div className="mt-8 space-y-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={`skeleton-${String(i)}`}
                className="space-y-3 rounded-none border-2 border-border px-2 py-2"
              >
                <div className="h-3 w-40 rounded bg-muted" />
                <div className="h-5 max-w-xl rounded bg-muted" />
                <div className="h-10 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function BlogIndexContent({
  searchParams,
  locale,
}: {
  searchParams?: Promise<{ page?: string }>;
  locale: string;
}) {
  const t = await getTranslations("blog");
  const sp = (await searchParams) ?? {};
  const { page, pageCount, items, totalCount, redirectTo } =
    getBlogIndexListing(sp);
  if (redirectTo !== null) {
    redirect({ href: redirectTo, locale });
  }

  const prevHref =
    page > 2 ? `/blog?page=${String(page - 1)}` : page > 1 ? "/blog" : null;
  const nextHref = page < pageCount ? `/blog?page=${String(page + 1)}` : null;

  const from = (page - 1) * BLOG_INDEX_PAGE_SIZE + 1;
  const to = Math.min(page * BLOG_INDEX_PAGE_SIZE, totalCount);

  function categoryLabel(category: "guide" | "insights") {
    return category === "guide" ? t("categoryGuide") : t("categoryInsights");
  }

  return (
    <div className="container max-w-3xl py-10 pb-20">
      <BlogPageFrame
        header={
          <header className="border-border border-b-4 bg-primary p-4 sm:p-6 md:p-8">
            <p className="font-bold font-mono text-primary-foreground text-xs uppercase tracking-wider">
              {t("label")}
            </p>
            <h1
              className={cn(
                toolHeroTitleClassName,
                "mt-2 text-primary-foreground",
              )}
            >
              {t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-primary-foreground/85 text-sm leading-relaxed">
              {t("intro", { count: totalCount })}
            </p>
          </header>
        }
      >
        <section
          className="mt-6 space-y-4"
          aria-labelledby="articles-heading"
        >
          <ToolSectionHeading id="articles-heading">
            {t("articlesHeading")}
            {pageCount > 1 ? (
              <span className="ml-2 font-normal text-muted-foreground text-sm">
                {t("pageSizeHint", {
                  page,
                  pageCount,
                  size: BLOG_INDEX_PAGE_SIZE,
                })}
              </span>
            ) : null}
          </ToolSectionHeading>
          <ul className="flex flex-col gap-6">
            {items.map(({ meta }) => (
              <li key={meta.slug}>
                <article>
                  <Link
                    href={`/blog/${meta.slug}`}
                    className="group block rounded-none border-2 border-border bg-background outline-none transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <div className="px-3 py-3 sm:px-4 sm:py-4">
                      <p className="text-muted-foreground text-xs">
                        <span
                          className={cn(
                            "rounded-none border-2 border-border px-1.5 py-0.5 font-bold font-mono text-xs uppercase tracking-tight",
                            meta.category === "guide"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {categoryLabel(meta.category)}
                        </span>
                        <span className="mx-2 text-border">·</span>
                        {t("readMin", { n: meta.readTimeMinutes })}
                      </p>
                      <h3 className="mt-2 font-semibold text-base text-foreground tracking-tight group-hover:underline">
                        {meta.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                        {meta.description}
                      </p>
                    </div>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {pageCount > 1 ? (
          <nav
            className="mt-10 flex flex-wrap items-center justify-between gap-3 border-border border-t pt-6"
            aria-label={t("paginationAria")}
          >
            <p className="text-muted-foreground text-sm">
              {t("showing", { from, to, total: totalCount })}
            </p>
            <div className="flex items-center gap-2">
              {prevHref ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={prevHref}>
                    <ChevronLeft className="size-4" aria-hidden />
                    {t("previous")}
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="size-4" aria-hidden />
                  {t("previous")}
                </Button>
              )}
              {nextHref ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={nextHref}>
                    {t("next")}
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  {t("next")}
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          </nav>
        ) : null}
      </BlogPageFrame>
    </div>
  );
}

async function NextGuidesSection() {
  if (nextGuideTopics.length === 0) return null;

  const t = await getTranslations("blog");

  function categoryLabel(category: "guide" | "insights") {
    return category === "guide" ? t("categoryGuide") : t("categoryInsights");
  }

  return (
    <div className="container max-w-3xl pt-12 pb-20">
      <BlogPageFrame
        header={
          <div className="border-border border-b-4 bg-primary p-4 sm:p-6 md:p-8">
            <ToolSectionHeading className="text-primary-foreground">
              {t("nextGuidesTitle")}
            </ToolSectionHeading>
            <p className="mt-2 text-primary-foreground/85 text-sm leading-relaxed">
              {t("nextGuidesBlurb")}
            </p>
          </div>
        }
      >
        <ul className="flex flex-col gap-4">
          {nextGuideTopics.map((topic) => (
            <li
              key={topic.slug}
              className="rounded-none border-2 border-border bg-background px-4 py-3"
            >
              <p className="text-muted-foreground text-xs">
                <span
                  className={cn(
                    "rounded-none border-2 border-border px-1.5 py-0.5 font-bold font-mono text-xs uppercase tracking-tight",
                    topic.category === "guide"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {categoryLabel(topic.category)}
                </span>
              </p>
              <p className="mt-2 font-semibold text-foreground text-sm tracking-tight">
                {topic.title}
              </p>
              <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                {topic.angle}
              </p>
            </li>
          ))}
        </ul>
      </BlogPageFrame>
    </div>
  );
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: BlogIndexPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Suspense fallback={<BlogIndexSkeleton />}>
        <BlogIndexContent searchParams={searchParams} locale={locale} />
      </Suspense>
      <NextGuidesSection />
    </>
  );
}
