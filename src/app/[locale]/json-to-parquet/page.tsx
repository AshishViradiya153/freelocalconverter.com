import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { JsonToParquetApp } from "@/app/components/json-to-parquet-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `JSON to Parquet · ${siteConfig.name}`,
  description:
    "Convert a JSON array of objects to Parquet in your browser. Upload JSON, preview rows locally, then download a .parquet file without server upload.",
};

interface JsonToParquetPageProps {
  params: Promise<{ locale: string }>;
}

export default async function JsonToParquetPage({
  params,
}: JsonToParquetPageProps) {
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
        <JsonToParquetApp />
      </Suspense>
    </Shell>
  );
}

