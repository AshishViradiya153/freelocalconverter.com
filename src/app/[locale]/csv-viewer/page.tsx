import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { CsvViewerApp } from "@/app/components/csv-viewer-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";

interface CsvViewerPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CsvViewerPage({ params }: CsvViewerPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Shell>
      <Suspense
        fallback={
          <DataGridSkeleton className="container flex flex-col gap-4 py-4">
            <DataGridSkeletonToolbar actionCount={4} />
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        }
      >
        <CsvViewerApp />
      </Suspense>
    </Shell>
  );
}
