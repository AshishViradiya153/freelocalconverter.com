import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { CsvToMarkdownTableApp } from "@/app/components/csv-to-markdown-table-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `CSV to Markdown Table · ${siteConfig.name}`,
  description:
    "Convert CSV to a Markdown table in your browser. Upload CSV, preview rows locally, then copy or download a .md table without server upload.",
};

interface CsvToMarkdownTablePageProps {
  params: Promise<{ locale: string }>;
}

export default async function CsvToMarkdownTablePage({
  params,
}: CsvToMarkdownTablePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Shell>
      <Suspense
        fallback={
          <DataGridSkeleton className="container flex flex-col gap-4 py-4">
            <DataGridSkeletonToolbar actionCount={3} />
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        }
      >
        <CsvToMarkdownTableApp />
      </Suspense>
    </Shell>
  );
}

