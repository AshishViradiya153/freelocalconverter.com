import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { BulkPdfWatermarkApp } from "@/app/components/bulk-pdf-watermark-app";
import { Shell } from "@/components/shell";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

export async function generateMetadata({
  params,
}: BulkPdfWatermarkPageProps): Promise<Metadata> {
  const { locale } = await params;
  return await buildToolPageMetadata(locale, "bulk-pdf-watermark");
}

interface BulkPdfWatermarkPageProps {
  params: Promise<{ locale: string }>;
}

export default async function BulkPdfWatermarkPage({
  params,
}: BulkPdfWatermarkPageProps) {
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
        <BulkPdfWatermarkApp />
      </Suspense>
    </Shell>
  );
}
