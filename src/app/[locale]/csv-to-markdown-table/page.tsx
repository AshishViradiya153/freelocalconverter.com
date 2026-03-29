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
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

export async function generateMetadata({
  params,
}: CsvToMarkdownTablePageProps): Promise<Metadata> {
  const { locale } = await params;
  return await buildToolPageMetadata(locale, "csv-to-markdown-table");
}

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

