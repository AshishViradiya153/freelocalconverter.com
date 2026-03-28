import { setRequestLocale } from "next-intl/server";

import { HomeToolsDirectory } from "@/app/components/home-tools-directory";

interface IndexPageProps {
  params: Promise<{ locale: string }>;
}

export default async function IndexPage({ params }: IndexPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeToolsDirectory />;
}
