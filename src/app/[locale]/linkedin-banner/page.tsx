import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LinkedInBannerApp } from "@/app/components/linkedin-banner-app";
import { Shell } from "@/components/shell";
import { buildPageMetaFromMessages } from "@/lib/seo/page-meta-messages";

interface LinkedInBannerPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LinkedInBannerPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetaFromMessages({
    locale,
    pathname: "/linkedin-banner",
    group: "linkedinBanner",
  });
}

export default async function LinkedInBannerPage({
  params,
}: LinkedInBannerPageProps) {
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
        <LinkedInBannerApp />
      </Suspense>
    </Shell>
  );
}
