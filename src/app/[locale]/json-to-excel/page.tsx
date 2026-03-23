import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { JsonToExcelApp } from "@/app/components/json-to-excel-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { PrivacyFootnote } from "@/components/marketing/privacy-footnote";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `JSON to Excel · ${siteConfig.name}`,
  description:
    "Load a JSON array of objects and convert it to Excel in your browser. Edit JSON, apply changes, preview rows, then download .xlsx.",
};

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
      <PrivacyFootnote />
    </Shell>
  );
}
