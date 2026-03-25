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
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `CSV to Parquet · ${siteConfig.name}`,
  description:
    "Convert CSV to Parquet in your browser. Upload a CSV, preview rows locally, then download a .parquet file without server upload.",
};

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

