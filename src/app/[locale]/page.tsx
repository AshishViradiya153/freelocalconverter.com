import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
// import { TrustedByMarquee } from "@/components/marketing/trusted-by-marquee";
import { Shell } from "@/components/shell";
import { CsvViewerApp } from "../components/csv-viewer-app";

interface IndexPageProps {
  params: Promise<{ locale: string }>;
}

export default async function IndexPage({ params }: IndexPageProps) {
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
      {/* <TrustedByMarquee /> */}
    </Shell>
  );
}
