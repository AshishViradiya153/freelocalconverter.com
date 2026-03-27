import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ApiWebDevHelpersApp } from "@/app/components/api-web-dev-helpers-app";
import { Shell } from "@/components/shell";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

export async function generateMetadata({
  params,
}: HttpExplainerPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildToolPageMetadata(locale, "http-explainer");
}

interface HttpExplainerPageProps {
  params: Promise<{ locale: string }>;
}

export default async function HttpExplainerPage({ params }: HttpExplainerPageProps) {
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
          initialTool="http"
          showToolSwitcher={false}
          title="HTTP status + headers explainer"
          subtitle="Quick meanings and debugging tips for status codes and common headers."
        />
      </Suspense>
    </Shell>
  );
}