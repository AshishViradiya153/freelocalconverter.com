import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LbsToKgConverterApp } from "@/app/components/lbs-to-kg-converter-app";
import { Shell } from "@/components/shell";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

interface LbsToKgPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LbsToKgPageProps): Promise<Metadata> {
  const { locale } = await params;
  return await buildToolPageMetadata(locale, "lbs-to-kg");
}

export default async function LbsToKgPage({ params }: LbsToKgPageProps) {
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
        <LbsToKgConverterApp />
      </Suspense>
    </Shell>
  );
}

