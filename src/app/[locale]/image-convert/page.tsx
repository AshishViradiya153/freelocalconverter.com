import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Shell } from "@/components/shell";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";
import { ImageConvertApp } from "@/app/components/image-convert-app";

export async function generateMetadata({
  params,
}: ImageConvertPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildToolPageMetadata(locale, "image-convert");
}

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

