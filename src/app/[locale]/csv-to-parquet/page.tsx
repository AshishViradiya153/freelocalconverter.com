import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { CsvToParquetApp } from "@/app/components/csv-to-parquet-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

export async function generateMetadata({
  params,
}: CsvToParquetPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildToolPageMetadata(locale, "csv-to-parquet");
}

interface CsvToParquetPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CsvToParquetPage({
  params,
}: CsvToParquetPageProps) {
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
        <CsvToParquetApp />
      </Suspense>
    </Shell>
  );
}

