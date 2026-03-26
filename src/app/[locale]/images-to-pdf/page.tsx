import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";
import { ImagesToPdfApp } from "@/app/components/images-to-pdf-app";

export const metadata: Metadata = {
  title: `Images to PDF · ${siteConfig.name}`,
  description:
    "Convert images (PNG/JPG/WebP and more) into a single PDF locally in your browser. Reorder pages, choose page size, and download — no uploads.",
};

interface ImagesToPdfPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ImagesToPdfPage({ params }: ImagesToPdfPageProps) {
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
        <ImagesToPdfApp />
      </Suspense>
    </Shell>
  );
}

