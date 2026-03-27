import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { SvgToCodeApp } from "@/app/components/svg-to-code-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `SVG to Code · ${siteConfig.name}`,
  description:
    "Convert SVG files to JSX, a React component with SVGProps, or pretty XML locally in your browser. Paste or upload, copy code, no uploads.",
};

interface SvgToCodePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SvgToCodePage({ params }: SvgToCodePageProps) {
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
        <SvgToCodeApp />
      </Suspense>
    </Shell>
  );
}
