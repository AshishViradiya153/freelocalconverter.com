import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { SvgToCodeApp } from "@/app/components/svg-to-code-app";
import { Shell } from "@/components/shell";
import { buildPageMetaFromMessages } from "@/lib/seo/page-meta-messages";

interface SvgToCodePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: SvgToCodePageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetaFromMessages({
    locale,
    pathname: "/svg-to-code",
    group: "svgToCode",
  });
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
