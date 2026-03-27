import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ApiWebDevHelpersApp } from "@/app/components/api-web-dev-helpers-app";
import { Shell } from "@/components/shell";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

export async function generateMetadata({
  params,
}: PythonRequestsConverterPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildToolPageMetadata(locale, "python-requests-converter");
}

interface PythonRequestsConverterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PythonRequestsConverterPage({
  params,
}: PythonRequestsConverterPageProps) {
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
        <ApiWebDevHelpersApp
          initialTool="converter"
          initialFromFormat="python-requests"
          initialToFormat="curl"
          showToolSwitcher={false}
          title="Python requests converter"
          subtitle="Convert Python requests snippets to cURL, fetch, or axios."
        />
      </Suspense>
    </Shell>
  );
}

