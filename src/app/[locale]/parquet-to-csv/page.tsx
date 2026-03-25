import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ParquetToCsvApp } from "@/app/components/parquet-to-csv-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Parquet to CSV · ${siteConfig.name}`,
  description:
    "Convert Parquet to CSV in your browser. Upload a .parquet file, preview rows locally, then download or copy CSV without server upload.",
};

interface ParquetToCsvPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ParquetToCsvPage({
  params,
}: ParquetToCsvPageProps) {
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
        <ParquetToCsvApp />
      </Suspense>
    </Shell>
  );
}

