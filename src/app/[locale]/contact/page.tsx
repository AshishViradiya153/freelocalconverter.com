import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { ContactUsApp } from "@/app/components/contact-us-app";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo/metadata";

const PATHNAME = "/contact";

function ContactSkeleton() {
  return (
    <div
      className="container max-w-3xl animate-pulse py-10 pb-20"
      role="status"
      aria-live="polite"
    >
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="mt-4 h-10 max-w-md rounded bg-muted" />
      <div className="mt-3 h-16 max-w-2xl rounded bg-muted" />
      <div className="mt-12 space-y-4 rounded-none border-2 border-border p-4">
        <div className="h-9 rounded bg-muted" />
        <div className="h-9 rounded bg-muted" />
        <div className="h-32 rounded bg-muted" />
        <div className="h-10 w-40 rounded bg-muted" />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contactUs" });
  const keywords = t("metaKeywords")
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean);
  return buildPageMetadata({
    locale,
    pathname: PATHNAME,
    title: `${t("metaTitle")} · ${siteConfig.name}`,
    description: t("metaDescription"),
    keywords,
    alternateLocales: true,
    canonicalLocale: routing.defaultLocale,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<ContactSkeleton />}>
      <ContactUsApp />
    </Suspense>
  );
}
