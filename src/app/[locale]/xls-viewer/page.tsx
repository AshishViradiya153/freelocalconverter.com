import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { XlsViewerApp } from "@/app/components/xls-viewer-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Excel Viewer · ${siteConfig.name}`,
  description:
    "Open an Excel workbook (.xlsx/.xls) in a direct editable viewer grid. Manage header rows and edit data in-browser. Files stay on your device.",
};

interface XlsViewerPageProps {
  params: Promise<{ locale: string }>;
}

export default async function XlsViewerPage({ params }: XlsViewerPageProps) {
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
        <XlsViewerApp />
      </Suspense>
    </Shell>
  );
}

