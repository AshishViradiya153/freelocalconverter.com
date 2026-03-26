import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { PdfToWordApp } from "@/app/components/pdf-to-word-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `PDF to Word · ${siteConfig.name}`,
  description:
    "Convert PDF to Word (DOCX) locally in your browser. Best for text-based PDFs; scanned PDFs need OCR, no uploads.",
};

interface PdfToWordPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PdfToWordPage({ params }: PdfToWordPageProps) {
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
        <PdfToWordApp />
      </Suspense>
    </Shell>
  );
}

