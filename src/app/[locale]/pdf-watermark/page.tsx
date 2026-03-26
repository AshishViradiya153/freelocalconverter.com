import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { PdfWatermarkApp } from "@/app/components/pdf-watermark-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `PDF Watermark · ${siteConfig.name}`,
  description:
    "Add text or image watermarks to a PDF locally in your browser. Control opacity, rotation, placement, and pages — no uploads.",
};

interface PdfWatermarkPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PdfWatermarkPage({
  params,
}: PdfWatermarkPageProps) {
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
        <PdfWatermarkApp />
      </Suspense>
    </Shell>
  );
}
