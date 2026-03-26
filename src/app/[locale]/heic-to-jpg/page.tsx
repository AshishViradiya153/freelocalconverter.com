import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { HeicToJpgApp } from "@/app/components/heic-to-jpg-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `HEIC to JPG/PNG · ${siteConfig.name}`,
  description:
    "Convert HEIC/HEIF photos to JPG or PNG locally in your browser. Bulk convert iPhone photos for universal compatibility — no uploads.",
};

interface HeicToJpgPageProps {
  params: Promise<{ locale: string }>;
}

export default async function HeicToJpgPage({ params }: HeicToJpgPageProps) {
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
        <HeicToJpgApp />
      </Suspense>
    </Shell>
  );
}

