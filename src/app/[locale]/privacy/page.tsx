import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Privacy Policy · ${siteConfig.name}`,
  description: `How ${siteConfig.name} handles information when you view CSV files in your browser.`,
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const productName = siteConfig.name;

  return (
    <div className="container max-w-3xl py-10 pb-16">
      <header className="border-border border-b pb-8">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Legal
        </p>
        <h1 className="mt-2 font-semibold text-3xl tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
          This policy explains what happens to information when you use{" "}
          {productName} to open and explore CSV files. We built the core
          experience around{" "}
          <strong className="text-foreground">
            processing in your browser
          </strong>{" "}
          so your spreadsheet contents are not sent to us for basic viewing.
        </p>
        <p className="mt-4 text-muted-foreground text-xs">
          Last updated: March 22, 2025 · For privacy requests, contact the party
          operating this site or your organization&apos;s administrator.
        </p>
      </header>

      <div className="mt-10 space-y-10 text-muted-foreground text-sm leading-relaxed">
        <section className="space-y-3" aria-labelledby="privacy-summary">
          <h2
            id="privacy-summary"
            className="font-medium text-base text-foreground"
          >
            1. Summary
          </h2>
          <ul className="list-inside list-disc space-y-2 pl-1">
            <li>
              <strong className="text-foreground">CSV contents</strong> for the
              standard viewer are parsed and displayed{" "}
              <strong className="text-foreground">on your device</strong>, not
              on our servers.
            </li>
            <li>
              <strong className="text-foreground">
                No account is required
              </strong>{" "}
              for that workflow, so we do not rely on a login to identify you
              for basic viewing.
            </li>
            <li>
              <strong className="text-foreground">Ads</strong> may load from
              partners who use cookies or similar technologies under their own
              policies.
            </li>
            <li>
              <strong className="text-foreground">Technical data</strong> (e.g.
              IP address, browser type) may be processed like any normal website
              visit, including by hosts, CDNs, or security tools.
            </li>
          </ul>
        </section>

        <section className="space-y-3" aria-labelledby="privacy-csv">
          <h2
            id="privacy-csv"
            className="font-medium text-base text-foreground"
          >
            2. Your CSV files and the grid
          </h2>
          <p>
            When you drop or select a file, {productName} reads it in your
            browser to build rows and columns for the data grid (sorting,
            filtering, search, export, etc.). That processing is designed to
            stay client-side unless we ship a separate feature that clearly
            states your file will be uploaded. In that case we will describe
            what is collected, why, and for how long.
          </p>
          <p>
            To remember your sheet between visits, the app may store a copy of
            your current grid (rows, column headers, and related metadata) in{" "}
            <strong className="text-foreground">IndexedDB</strong> in your
            browser on this device. It is not sent to us as part of that
            feature; anyone with access to this browser profile could read it,
            and other sites cannot access it across origins. Use{" "}
            <strong className="text-foreground">Clear</strong> in the viewer or
            your browser&apos;s site-data controls to remove it.
          </p>
          <p>
            You are responsible for the data you load: do not use the tool for
            unlawful content or data you are not allowed to process. If you
            close the tab or clear site data, locally held data may be cleared
            according to your browser; we do not guarantee recovery of in-memory
            sessions.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="privacy-accounts">
          <h2
            id="privacy-accounts"
            className="font-medium text-base text-foreground"
          >
            3. Accounts and optional features
          </h2>
          <p>
            The public CSV viewer does not require sign-up. If we add accounts,
            billing, cloud storage, or APIs, those features will have their own
            disclosures (what we store, legal bases where required, retention,
            and subprocessors). This policy will be updated when that happens.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="privacy-cookies">
          <h2
            id="privacy-cookies"
            className="font-medium text-base text-foreground"
          >
            4. Cookies and similar technologies
          </h2>
          <p>
            We and our vendors may use cookies, local storage, pixels, or SDKs
            for functionality (e.g. remembering preferences), security, metrics,
            or advertising. You can control many cookies through your browser
            settings; blocking some cookies may limit parts of the site.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="privacy-ads">
          <h2
            id="privacy-ads"
            className="font-medium text-base text-foreground"
          >
            5. Advertising
          </h2>
          <p>
            {productName} may show ads from networks such as Google AdSense or
            others. Those partners may collect or receive information to measure
            delivery, personalize ads where allowed, and prevent fraud. Their
            use is governed by their privacy policies and, where applicable,
            consent frameworks in your region.
          </p>
          <p>
            Where required, we will work to present appropriate consent or
            opt-out links (for example industry tools for interest-based ads).
            You may also use ad blockers or private browsing modes; doing so may
            change how the site looks or behaves.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="privacy-hosting">
          <h2
            id="privacy-hosting"
            className="font-medium text-base text-foreground"
          >
            6. Hosting, analytics, and security
          </h2>
          <p>
            Like most sites, our pages are delivered over the internet. Hosting
            providers, edge networks, and security services may log technical
            information and process it under their agreements with us. We use
            such services to run the site reliably and protect against abuse.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="privacy-rights">
          <h2
            id="privacy-rights"
            className="font-medium text-base text-foreground"
          >
            7. Your rights and regional notices
          </h2>
          <p>
            Depending on where you live, you may have rights to access, correct,
            delete, or restrict certain personal data, or to object to
            processing. Because the core CSV workflow minimizes what we hold
            about you, many requests may not apply to file contents that never
            left your device. For data held by us or our ad/analytics partners,
            use the contact path for this deployment or the partner&apos;s own
            tools where offered.
          </p>
          <p>
            If you are in the European Economic Area, UK, or similar
            jurisdictions, we will identify our role (controller vs. processor)
            and legal bases where we process personal data. This section should
            be completed with your counsel and entity details.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="privacy-children">
          <h2
            id="privacy-children"
            className="font-medium text-base text-foreground"
          >
            8. Children
          </h2>
          <p>
            {productName} is intended for adults and business users. We do not
            knowingly collect personal information from children under the age
            where parental consent is required in your region. If you believe we
            have done so in error, contact us so we can delete it.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="privacy-changes">
          <h2
            id="privacy-changes"
            className="font-medium text-base text-foreground"
          >
            9. Changes
          </h2>
          <p>
            We may update this policy to reflect new features, partners, or
            legal requirements. We will adjust the &quot;Last updated&quot; date
            and, where appropriate, provide a more prominent notice.
          </p>
        </section>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 border-border border-t pt-8 text-foreground text-sm">
          <Link className="underline underline-offset-2" href="/">
            Back to viewer
          </Link>
          <Link className="underline underline-offset-2" href="/terms">
            Terms of Service
          </Link>
        </nav>
      </div>
    </div>
  );
}
