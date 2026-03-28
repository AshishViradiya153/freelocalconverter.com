import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { JsonToExcelApp } from "@/app/components/json-to-excel-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

export async function generateMetadata({
  params,
}: JsonToExcelPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildToolPageMetadata(locale, "json-to-excel");
}

interface JsonToExcelPageProps {
  params: Promise<{ locale: string }>;
}

export default async function JsonToExcelPage({ params }: JsonToExcelPageProps) {
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
        <JsonToExcelApp />
      </Suspense>
    </Shell>
  );
}
