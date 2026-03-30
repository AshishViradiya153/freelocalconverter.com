import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { MarkdownToEpubApp } from "@/app/components/markdown-to-epub-app";
import { Shell } from "@/components/shell";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

export async function generateMetadata({
  params,
}: MarkdownToEpubPageProps): Promise<Metadata> {
  const { locale } = await params;
  return await buildToolPageMetadata(locale, "markdown-to-epub");
}

interface MarkdownToEpubPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MarkdownToEpubPage({
  params,
}: MarkdownToEpubPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Shell>
      <Suspense
        fallback={
          <div className="container flex flex-col gap-4 py-4">
            <div className="h-10 w-[min(520px,100%)] animate-pulse rounded-md bg-muted/40" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-muted/30" />
            <div className="h-[380px] w-full animate-pulse rounded-xl bg-muted/20" />
          </div>
        }
      >
        <MarkdownToEpubApp />
      </Suspense>
    </Shell>
  );
}

