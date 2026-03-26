import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ApiWebDevHelpersApp } from "@/app/components/api-web-dev-helpers-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `axios converter · ${siteConfig.name}`,
  description:
    "Convert axios request snippets to cURL, fetch, or Python requests locally.",
};

interface AxiosConverterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AxiosConverterPage({ params }: AxiosConverterPageProps) {
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
          initialFromFormat="axios"
          initialToFormat="python-requests"
          showToolSwitcher={false}
          title="axios converter"
          subtitle="Convert axios snippets to cURL, fetch, or Python requests."
        />
      </Suspense>
    </Shell>
  );
}

