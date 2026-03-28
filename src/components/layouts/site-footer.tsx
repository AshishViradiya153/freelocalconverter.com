import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { getLocalizedServiceGroups } from "@/components/layouts/services-data-locale";
import { cn } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

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
          "block rounded-none border-2 border-transparent px-2 py-1.5 font-mono text-muted-foreground text-sm transition-colors",
          "hover:border-border hover:bg-primary hover:text-primary-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span className="block truncate font-bold tracking-tight">{label}</span>
      </Link>
    </li>
  );
}

function FooterGroupColumn({ title, links }: FooterGroup) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="font-mono font-black text-[11px] text-foreground uppercase tracking-widest">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
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
    <footer className="bg-background">
      <div className="container pb-12 pt-12 md:pb-14">
        {/* <header className="flex max-w-3xl flex-col gap-3">
          <p className="font-mono font-black text-muted-foreground text-[11px] uppercase tracking-widest">
            {tFooter("kicker")}
          </p>
          <h2 className="font-black text-2xl tracking-tighter uppercase md:text-3xl">
            {tFooter("title", { name: siteConfig.name })}
          </h2>
        </header> */}

        <div className="grid gap-8 border-border border-t-0 pt-0 md:grid-cols-2 md:gap-10 lg:grid-cols-5">
          {groups.map((g) => (
            <FooterGroupColumn key={g.title} title={g.title} links={g.links} />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-6 border-border border-t-4 pt-8 font-mono md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              {tFooter("processingNotice")}{" "}
              <Link
                className="inline-block rounded-none border-2 border-transparent px-1.5 py-0.5 font-bold text-foreground transition-colors hover:border-border hover:bg-primary hover:text-primary-foreground"
                href="/privacy"
              >
                {tNav("privacy")}
              </Link>{" "}
              |{" "}
              <Link
                className="inline-block rounded-none border-2 border-transparent px-1.5 py-0.5 font-bold text-foreground transition-colors hover:border-border hover:bg-primary hover:text-primary-foreground"
                href="/terms"
              >
                {tNav("terms")}
              </Link>
            </p>
            <p className="font-mono font-bold text-muted-foreground text-sm leading-relaxed">
              {tFooter("subtitle")}
            </p>
          </div>

          <p className="font-black text-[10px] text-muted-foreground uppercase tracking-widest">
            {tFooter("copyright", {
              year: siteConfig.copyrightYear,
              name: siteConfig.name,
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}
