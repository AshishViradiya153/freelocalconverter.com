import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CsvCompareApp } from "@/app/components/csv-compare-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Compare CSV files · ${siteConfig.name}`,
  description:
    "Load two CSV files side by side in your browser. When columns match, see row and cell difference counts and filter to changed rows only. Data stays on your device.",
};

interface ComparePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ComparePage({ params }: ComparePageProps) {
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
        <CsvCompareApp />
      </Suspense>
    </Shell>
  );
}
