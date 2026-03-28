import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";
import { DataGridRenderPageClient } from "./data-grid-render-page-client";

interface DataGridRenderPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: DataGridRenderPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildToolPageMetadata(locale, "data-grid-render");
}

export default async function DataGridRenderPage({
  params,
}: DataGridRenderPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DataGridRenderPageClient />;
}
