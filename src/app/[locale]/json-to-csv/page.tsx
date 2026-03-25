import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { JsonToCsvApp } from "@/app/components/json-to-csv-app";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
import { Shell } from "@/components/shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `JSON to CSV · ${siteConfig.name}`,
  description:
    "Load a JSON array of objects and convert it to CSV in your browser. Edit JSON, apply changes, then copy or download CSV and Excel output.",
};

interface JsonToCsvPageProps {
  params: Promise<{ locale: string }>;
}

export default async function JsonToCsvPage({ params }: JsonToCsvPageProps) {
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
        <JsonToCsvApp />
      </Suspense>
    </Shell>
  );
}
