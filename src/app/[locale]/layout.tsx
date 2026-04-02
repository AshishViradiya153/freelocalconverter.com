import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { SiteFooter } from "@/components/layouts/site-footer";
import { SiteHeader } from "@/components/layouts/site-header";
import { ThemeProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { type AppLocale, RTL_LOCALES, routing } from "@/i18n/routing";
import { fontMono, fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { buildHomeLayoutSocialMetadata } from "@/lib/seo/metadata";

import "@/styles/globals.css";
import { RelatedAppTools } from "@/app/components/related-app-tools";
import { Testimonial } from "@/components/marketing/testimonial";
import { TrustedByMarquee } from "@/components/marketing/trusted-by-marquee";
import { FeatureRequestWidget } from "@/components/feature-request-widget";

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
    icon: [
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: "/apple-icon.png",
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
    return {
      ...defaultLayoutMetadata,
      ...buildHomeLayoutSocialMetadata(routing.defaultLocale),
    };
  }
  const tLanding = await getTranslations({ locale, namespace: "landing" });
  const keywords = metaKeywordsFromLandingPipe(tLanding("metaKeywords"));
  return {
    ...defaultLayoutMetadata,
    keywords: keywords.length > 0 ? keywords : undefined,
    ...buildHomeLayoutSocialMetadata(locale),
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
  const isProd = process.env.NODE_ENV === "production";
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID?.trim() ?? "";

  return (
    <html lang={locale} dir={resolvedDir} suppressHydrationWarning>
      <head>
        {isProd && gtmId ? (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
            `}
          </Script>
        ) : null}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable,
        )}
      >
        {isProd && gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        ) : null}
        <NextIntlClientProvider messages={messages}>
          <Script defer src="https://assets.onedollarstats.com/stonks.js" />
          {isProd && clarityId ? (
            <Script id="ms-clarity" strategy="afterInteractive">
              {`
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", ${JSON.stringify(clarityId)});
              `}
            </Script>
          ) : null}
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            forcedTheme="light"
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex min-h-0 flex-1 flex-col">
                {children}
                <RelatedAppTools />
              </main>
              {/* <TrustedByMarquee /> */}
              <SiteFooter />
            </div>
            <FeatureRequestWidget />
          </ThemeProvider>
          <Toaster />
        </NextIntlClientProvider>
        {isProd && gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
