import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";
import { DataGridLivePageClient } from "./data-grid-live-page-client";

interface DataGridLivePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: DataGridLivePageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildToolPageMetadata(locale, "data-grid-live");
}

export default async function DataGridLivePage({
  params,
}: DataGridLivePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DataGridLivePageClient />;
}
