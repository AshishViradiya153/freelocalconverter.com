import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ParquetToJsonApp } from "@/app/components/parquet-to-json-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Parquet to JSON · ${siteConfig.name}`,
  description:
    "Convert Parquet to JSON in your browser. Upload a .parquet file, preview rows locally, then copy or download JSON without server upload.",
};

interface ParquetToJsonPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ParquetToJsonPage({
  params,
}: ParquetToJsonPageProps) {
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
        <ParquetToJsonApp />
      </Suspense>
    </Shell>
  );
}

