import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { XlsToCsvBatchApp } from "@/app/components/xls-to-csv-batch-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Excel to CSV batch · ${siteConfig.name}`,
  description:
    "Convert multiple .xlsx/.xls/.xlsm files to CSV in your browser. Add files, convert all, then download each CSV one by one. No server upload.",
};

interface XlsToCsvPageProps {
  params: Promise<{ locale: string }>;
}

export default async function XlsToCsvPage({ params }: XlsToCsvPageProps) {
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
        <XlsToCsvBatchApp />
      </Suspense>
    </Shell>
  );
}
