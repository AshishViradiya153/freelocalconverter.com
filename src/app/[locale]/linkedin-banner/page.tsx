import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LinkedInBannerApp } from "@/app/components/linkedin-banner-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `LinkedIn Banner Maker · ${siteConfig.name}`,
  description:
    "Create LinkedIn profile and page banners locally in your browser. Three standard sizes, editable colors and layouts, optional logo — download PNG, JPEG, or WebP.",
};

interface LinkedInBannerPageProps {
  params: Promise<{ locale: string }>;
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
