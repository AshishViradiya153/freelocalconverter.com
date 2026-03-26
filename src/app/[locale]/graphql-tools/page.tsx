import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ApiWebDevHelpersApp } from "@/app/components/api-web-dev-helpers-app";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `GraphQL tools · ${siteConfig.name}`,
  description:
    "Format GraphQL queries and explore schema types using introspection JSON.",
};

interface GraphQlToolsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function GraphQlToolsPage({ params }: GraphQlToolsPageProps) {
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
          initialTool="graphql"
          showToolSwitcher={false}
          title="GraphQL formatter + schema explorer"
          subtitle="Format query text and inspect schema types from introspection JSON."
        />
      </Suspense>
    </Shell>
  );
}
