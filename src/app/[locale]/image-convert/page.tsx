import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";
import { ImageConvertApp } from "@/app/components/image-convert-app";

export const metadata: Metadata = {
  title: `Image Converter · ${siteConfig.name}`,
  description:
    "Convert images locally in your browser. Upload multiple files or paste a direct link, choose an output format, then download, no uploads.",
};

interface ImageConvertPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ImageConvertPage({ params }: ImageConvertPageProps) {
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
        <ImageConvertApp />
      </Suspense>
    </Shell>
  );
}

