import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ParquetViewerApp } from "@/app/components/parquet-viewer-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Parquet Viewer · ${siteConfig.name}`,
  description:
    "Open a Parquet file in an editable grid and export the updated data back to .parquet locally.",
};

interface ParquetViewerPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ParquetViewerPage({
  params,
}: ParquetViewerPageProps) {
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
        <ParquetViewerApp />
      </Suspense>
    </Shell>
  );
}