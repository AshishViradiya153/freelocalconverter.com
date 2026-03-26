import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ImageResizeConvertApp } from "@/app/components/image-resize-convert-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Image Resize/Crop + Convert · ${siteConfig.name}`,
  description:
    "Resize, center-crop, convert, and bulk rename images locally in your browser. Bulk queue, presets, then download outputs, no uploads.",
};

interface ImageResizePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ImageResizePage({ params }: ImageResizePageProps) {
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
        <ImageResizeConvertApp />
      </Suspense>
    </Shell>
  );
}

