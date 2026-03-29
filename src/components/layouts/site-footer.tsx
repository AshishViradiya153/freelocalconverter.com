import { getLocale, getTranslations } from "next-intl/server";
import { FooterBrandPretextMesh } from "@/components/layouts/footer-brand-pretext-mesh";
import { getLocalizedServiceGroups } from "@/components/layouts/services-data-locale";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface FooterLink {
  href: string;
  label: string;
  description?: string;
}

interface FooterGroup {
  title: string;
  description?: string;
  links: FooterLink[];
}

function FooterLinkItem({ href, label }: FooterLink) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex w-full min-w-0 items-center border-2 border-border bg-background px-3 py-2.5 font-semibold text-foreground text-sm leading-snug tracking-tight transition-colors",
          "hover:bg-primary hover:text-primary-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

function FooterGroupColumn({ title, links }: FooterGroup) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="border-border border-b-2 pb-2 font-bold text-foreground text-xs tracking-tight sm:text-sm">
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <FooterLinkItem key={`${l.href}-${l.label}`} {...l} />
        ))}
      </ul>
    </section>
  );
}

export async function SiteFooter() {
  const locale = await getLocale();
  const tFooter = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  const groups: FooterGroup[] = getLocalizedServiceGroups(locale)
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => link.href !== "/tools"),
    }))
    .filter((group) => group.links.length > 0);

  return (
    <footer className="bg-background font-mono text-foreground [-webkit-font-smoothing:auto]">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-10">
        <div className="min-w-0 pr-2 pb-2 sm:pr-2.5 sm:pb-2.5 md:pr-3 md:pb-3">
          <div className="flex w-full min-w-0 flex-col border-4 border-border bg-background shadow-brutal max-sm:shadow-brutal-sm">
            <header className="shrink-0 border-border border-b-4 bg-primary p-4 text-primary-foreground sm:p-6 md:p-8 lg:p-10">
              <p className="font-bold text-[11px] tracking-tight opacity-95 sm:text-xs">
                {tFooter("kicker")}
              </p>
              <h2 className="mt-3 text-balance wrap-break-word font-black text-2xl leading-[1.05] tracking-tight sm:mt-4 sm:text-3xl md:text-4xl">
                {tFooter("title", { name: siteConfig.name })}
              </h2>
              <p className="mt-4 max-w-3xl wrap-break-word font-bold text-primary-foreground/85 text-sm leading-snug sm:mt-5 md:text-base">
                {tFooter("subtitle")}
              </p>
            </header>

            <div className="bg-background px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-12">
              <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-5">
                {groups.map((g) => (
                  <FooterGroupColumn
                    key={g.title}
                    title={g.title}
                    links={g.links}
                  />
                ))}
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-8 border-brutal-canvas-foreground/15 border-t-4 bg-brutal-canvas px-4 py-8 text-brutal-canvas-foreground sm:gap-10 md:px-10 md:py-10 lg:px-12">
              <FooterBrandPretextMesh />

              <div className="flex flex-col gap-6 border-brutal-canvas-foreground/15 border-t pt-8 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <p className="max-w-2xl font-bold text-brutal-canvas-foreground/90 text-xs leading-relaxed md:text-sm">
                  {tFooter("processingNotice")}{" "}
                  <Link
                    className="ms-0.5 inline-block rounded-none border-2 border-brutal-canvas-foreground/45 px-2 py-1 font-black text-brutal-canvas-foreground transition-colors hover:border-transparent hover:bg-primary hover:text-primary-foreground"
                    href="/privacy"
                  >
                    {tNav("privacy")}
                  </Link>{" "}
                  <span className="text-brutal-canvas-foreground/40" aria-hidden>
                    |
                  </span>{" "}
                  <Link
                    className="inline-block rounded-none border-2 border-brutal-canvas-foreground/45 px-2 py-1 font-black text-brutal-canvas-foreground transition-colors hover:border-transparent hover:bg-primary hover:text-primary-foreground"
                    href="/terms"
                  >
                    {tNav("terms")}
                  </Link>
                </p>

                <p className="shrink-0 font-semibold text-brutal-canvas-foreground/70 text-[10px] tracking-tight sm:text-xs">
                  {tFooter("copyright", {
                    year: siteConfig.copyrightYear,
                    name: siteConfig.name,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
