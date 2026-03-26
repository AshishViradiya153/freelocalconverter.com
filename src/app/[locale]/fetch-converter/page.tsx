import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ApiWebDevHelpersApp } from "@/app/components/api-web-dev-helpers-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `fetch converter · ${siteConfig.name}`,
  description:
    "Convert fetch() request snippets to cURL, axios, or Python requests locally.",
};

interface FetchConverterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function FetchConverterPage({ params }: FetchConverterPageProps) {
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
          initialFromFormat="fetch"
          initialToFormat="axios"
          showToolSwitcher={false}
          title="fetch converter"
          subtitle="Convert fetch() snippets to cURL, axios, or Python requests."
        />
      </Suspense>
    </Shell>
  );
}

