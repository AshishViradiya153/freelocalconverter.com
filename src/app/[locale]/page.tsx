import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeToolsDirectory } from "@/app/components/home-tools-directory";
import { LANDING_FAQ_MESSAGE_KEYS } from "@/app/components/landing-faq-constants";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import {
  buildFaqPageJsonLd,
  buildJsonLdGraph,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/schema";

interface IndexPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: Pick<IndexPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const tLanding = await getTranslations({ locale, namespace: "landing" });

  const heroTitleSeo = tLanding("heroTitleSeo")
    .replace(/\s*\n\s*/g, " ")
    .trim();

  const metaKeywords = tLanding("metaKeywords");
  const keywords = metaKeywords
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean);

  return buildPageMetadata({
    locale,
    pathname: "/",
    title: heroTitleSeo,
    description: tLanding("directorySubtitle"),
    keywords: keywords.length > 0 ? keywords : undefined,
  });
}

export default async function IndexPage({ params }: IndexPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tLanding = await getTranslations({ locale, namespace: "landing" });
  const url = buildAbsoluteUrl(locale, "/");
  const faqForSchema = LANDING_FAQ_MESSAGE_KEYS.map(
    ({ questionKey, answerKey }) => ({
      question: tLanding(questionKey),
      answer: tLanding(answerKey),
    }),
  );
  const graph = buildJsonLdGraph([
    buildOrganizationJsonLd() as unknown as Record<string, unknown>,
    buildWebSiteJsonLd({ locale }) as unknown as Record<string, unknown>,
    {
      "@type": "CollectionPage",
      name: tLanding("collectionPageName", { name: siteConfig.name }),
      description: tLanding("directorySubtitle"),
      url,
    },
    buildSoftwareApplicationJsonLd({
      name: siteConfig.name,
      description: tLanding("directorySubtitle"),
      url,
      applicationCategory: "UtilitiesApplication",
    }) as unknown as Record<string, unknown>,
    buildFaqPageJsonLd(faqForSchema) as unknown as Record<string, unknown>,
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <HomeToolsDirectory />
    </>
  );
}
