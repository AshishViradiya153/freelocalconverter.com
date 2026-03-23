import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CsvToJsonApp } from "@/app/components/csv-to-json-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { PrivacyFootnote } from "@/components/marketing/privacy-footnote";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `CSV to JSON · ${siteConfig.name}`,
  description:
    "Load a CSV on the left and edit the same data as JSON on the right. Apply changes back to the grid, format, copy, or download. Parsing stays in your browser.",
};

interface CsvToJsonPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CsvToJsonPage({ params }: CsvToJsonPageProps) {
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
        <CsvToJsonApp />
      </Suspense>
      <PrivacyFootnote />
    </Shell>
  );
}
