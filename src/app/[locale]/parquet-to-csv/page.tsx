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
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

export async function generateMetadata({
  params,
}: ParquetToCsvPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildToolPageMetadata(locale, "parquet-to-csv");
}

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

