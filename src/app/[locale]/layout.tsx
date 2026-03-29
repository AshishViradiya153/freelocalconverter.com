import { SiteHeader } from "@/components/layouts/site-header";
import { SiteFooter } from "@/components/layouts/site-footer";
import { ThemeProvider } from "@/components/providers";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { siteConfig } from "@/config/site";
import { fontMono, fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import {
  buildAbsoluteUrl,
  normalizeSiteBase,
  openGraphLocaleForSeo,
} from "@/lib/seo/paths";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { type AppLocale, RTL_LOCALES, routing } from "@/i18n/routing";

import "@/styles/globals.css";
import { TrustedByMarquee } from "@/components/marketing/trusted-by-marquee";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

const defaultLayoutMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/icon.png",
  },
};

function metaKeywordsFromLandingPipe(pipe: string): string[] {
  return pipe
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return defaultLayoutMetadata;
  }
  const tLanding = await getTranslations({ locale, namespace: "landing" });
  const keywords = metaKeywordsFromLandingPipe(tLanding("metaKeywords"));
  const base = normalizeSiteBase();
  const ogImageUrl = `${base}/og.jpg`;
  const homeUrl = buildAbsoluteUrl(locale, "/");
  return {
    ...defaultLayoutMetadata,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      type: "website",
      locale: openGraphLocaleForSeo(locale),
      url: homeUrl,
      title: siteConfig.name,
      description: siteConfig.description,
      siteName: siteConfig.name,
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [ogImageUrl],
    },
  };
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const resolvedDir = RTL_LOCALES.has(locale as AppLocale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={resolvedDir} suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable,
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <Script defer src="https://assets.onedollarstats.com/stonks.js" />
          {/* TODO: restore `defaultTheme="system"` + `enableSystem` and remove forcedTheme when shipping dark mode again */}
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            forcedTheme="light"
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex min-h-0 flex-1 flex-col">{children}</main>
              <TrustedByMarquee />
              <SiteFooter />
            </div>
            {/* <TailwindIndicator /> */}
          </ThemeProvider>
          <Toaster />
        </NextIntlClientProvider>
        <GoogleAnalytics gaId={"G-Y0B8C93BRK"} />
      </body>
    </html>
  );
}
