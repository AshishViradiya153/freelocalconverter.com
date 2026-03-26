import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ImageCompressApp } from "@/app/components/image-compress-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Image Compressor · ${siteConfig.name}`,
  description:
    "Compress images locally in your browser. Upload multiple files or paste a direct link, then download smaller outputs, no uploads.",
};

interface ImageCompressPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ImageCompressPage({ params }: ImageCompressPageProps) {
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
        <ImageCompressApp />
      </Suspense>
    </Shell>
  );
}
