import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CsvToExcelApp } from "@/app/components/csv-to-excel-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `CSV to Excel · ${siteConfig.name}`,
  description:
    "Convert up to 10 CSV files to Excel in your browser. Add files, convert in batch, then download each .xlsx one by one.",
};

interface CsvToExcelPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CsvToExcelPage({
  params,
}: CsvToExcelPageProps) {
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
        <CsvToExcelApp />
      </Suspense>
    </Shell>
  );
}

