import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Terms of Service · ${siteConfig.name}`,
  description: `Terms of use for ${siteConfig.name}. Open and explore CSV files in your browser.`,
};

export default async function TermsPage({
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
          Terms of Service
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
          These terms govern your use of {productName}, our browser-based tool
          for opening, viewing, filtering, and sorting CSV data. By using the
          site, you agree to them.
        </p>
        <p className="mt-4 text-muted-foreground text-xs">
          Last updated: March 22, 2025 · For questions, contact your
          organization&apos;s administrator or the party operating this
          deployment.
        </p>
      </header>

      <div className="mt-10 space-y-10 text-muted-foreground text-sm leading-relaxed">
        <section className="space-y-3" aria-labelledby="terms-agreement">
          <h2
            id="terms-agreement"
            className="font-medium text-base text-foreground"
          >
            1. Agreement
          </h2>
          <p>
            If you do not agree to these terms, do not use {productName}. We may
            update these terms from time to time; continued use after changes
            means you accept the revised terms. Material changes will be
            reflected by updating the &quot;Last updated&quot; date above.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="terms-service">
          <h2
            id="terms-service"
            className="font-medium text-base text-foreground"
          >
            2. The service
          </h2>
          <p>
            {productName} lets you load CSV files (for example by drag-and-drop)
            and explore them in an interactive data grid in your web browser,
            including search, sort, filters, and column layout controls. The
            product is offered for general business and personal productivity
            use unless we state otherwise.
          </p>
          <p>
            <strong className="text-foreground">Processing location.</strong>{" "}
            Parsing and viewing of your CSV for the core experience happens{" "}
            <strong className="text-foreground">locally in your browser</strong>
            . We do not operate a mandatory account or login for that workflow.
            Optional features that send data to our servers, if we add them,
            will be described separately in these terms and in our{" "}
            <Link
              className="text-foreground underline underline-offset-2"
              href="/privacy"
            >
              Privacy
            </Link>{" "}
            notice.
          </p>
          <p>
            <strong className="text-foreground">Limits.</strong> File size and
            row limits apply to keep the experience reliable in the browser;
            current limits are shown on the upload screen. Very large files may
            be truncated or rejected with a clear message.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="terms-acceptable">
          <h2
            id="terms-acceptable"
            className="font-medium text-base text-foreground"
          >
            3. Acceptable use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-inside list-disc space-y-2 pl-1">
            <li>
              Use {productName} in violation of applicable law or third-party
              rights.
            </li>
            <li>
              Upload or process data you are not authorized to use, or that
              infringes confidentiality, privacy, or intellectual property
              obligations.
            </li>
            <li>
              Attempt to disrupt, overload, or reverse-engineer the service in a
              way that harms security or availability.
            </li>
            <li>
              Use automated means to scrape or abuse the site in bulk without
              permission.
            </li>
          </ul>
        </section>

        <section className="space-y-3" aria-labelledby="terms-ads">
          <h2 id="terms-ads" className="font-medium text-base text-foreground">
            4. Advertising
          </h2>
          <p>
            {productName} may display third-party advertisements. Ad partners
            may use cookies, pixels, or similar technologies subject to their
            own policies. You may use browser settings, extensions, or industry
            opt-out tools where available. See also our{" "}
            <Link
              className="text-foreground underline underline-offset-2"
              href="/privacy"
            >
              Privacy
            </Link>{" "}
            page for how we describe data practices alongside ads.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="terms-ip">
          <h2 id="terms-ip" className="font-medium text-base text-foreground">
            5. Intellectual property
          </h2>
          <p>
            The {productName} name, branding, software, design, and content we
            provide (other than your CSV data) are owned by us or our licensors
            and are protected by applicable laws. We grant you a limited,
            non-exclusive, non-transferable right to use the service as offered.
            You retain all rights to the files and data you supply; we do not
            claim ownership of your CSV content.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="terms-disclaimer">
          <h2
            id="terms-disclaimer"
            className="font-medium text-base text-foreground"
          >
            6. Disclaimers
          </h2>
          <p>
            The service is provided{" "}
            <strong className="text-foreground">&quot;as is&quot;</strong> and{" "}
            <strong className="text-foreground">
              &quot;as available&quot;
            </strong>
            . We do not warrant that results will be error-free, that the grid
            will match every CSV edge case, or that the service will be
            uninterrupted. You are responsible for verifying critical data and
            for maintaining your own backups.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="terms-liability">
          <h2
            id="terms-liability"
            className="font-medium text-base text-foreground"
          >
            7. Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by law, we and our suppliers will
            not be liable for any indirect, incidental, special, consequential,
            or punitive damages, or for loss of profits, data, or goodwill,
            arising from your use of {productName}. Our aggregate liability for
            claims relating to the service is limited to the greater of (a)
            amounts you paid us specifically for the service in the twelve (12)
            months before the claim or (b) one hundred U.S. dollars (US$100), if
            you have not paid us. Some jurisdictions do not allow certain
            limitations; in those cases, our liability is limited to the fullest
            extent permitted by law.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="terms-general">
          <h2
            id="terms-general"
            className="font-medium text-base text-foreground"
          >
            8. General
          </h2>
          <p>
            If a provision is unenforceable, the remaining provisions stay in
            effect. Failure to enforce a term is not a waiver. These terms are
            the entire agreement between you and us regarding {productName} for
            the described service.
          </p>
        </section>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 border-border border-t pt-8 text-foreground text-sm">
          <Link className="underline underline-offset-2" href="/">
            Back to viewer
          </Link>
          <Link className="underline underline-offset-2" href="/privacy">
            Privacy
          </Link>
        </nav>
      </div>
    </div>
  );
}
