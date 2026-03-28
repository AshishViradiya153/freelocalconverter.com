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

function FooterLinkItem({ href, label, description }: FooterLink) {
  return (
    <li className="group">
      <Link
        href={href}
        className={cn(
          "relative inline-flex w-full items-start gap-2 rounded-md px-2 py-1.5 transition",
          "text-muted-foreground hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          "hover:bg-muted/30 hover:shadow-[0_1px_0_hsl(var(--border))_inset]",
          "hover:-translate-y-px active:translate-y-0",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-md before:opacity-0 before:transition-opacity",
          "before:bg-[radial-gradient(120%_120%_at_20%_0%,hsl(var(--primary)/0.18),transparent_60%)]",
          "group-hover:before:opacity-100",
          "after:pointer-events-none after:absolute after:inset-x-2 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:rounded-full after:transition-transform",
          "after:bg-linear-to-r after:from-primary/50 after:via-primary/10 after:to-transparent",
          "group-hover:after:scale-x-100",
        )}
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-sm">{label}</span>
        </span>
      </Link>
    </li>
  );
}

function FooterGroupColumn({ title, description, links }: FooterGroup) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-sm tracking-tight">
          {title}
        </h3>
      </div>
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

  const groups: FooterGroup[] = getLocalizedServiceGroups(locale);

  return (
    <footer className="relative overflow-hidden border-border/60 border-t">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
        <div className="h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
        <div className="h-6 bg-linear-to-b from-primary/10 to-transparent blur-xl" />
      </div>

      <div className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
        >
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_15%_65%,hsl(var(--foreground)/0.05),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)),transparent_25%,transparent_75%,hsl(var(--background)))]" />
          <div className="absolute inset-0 opacity-[0.22] bg-[repeating-linear-gradient(90deg,hsl(var(--foreground)/0.07)_0_1px,transparent_1px_10px)] mask-[radial-gradient(70%_55%_at_50%_20%,#000,transparent_65%)]" />
          <div className="absolute -top-24 left-1/2 h-72 w-[min(1100px,92vw)] -translate-x-1/2 rounded-[48px] bg-linear-to-r from-primary/10 via-transparent to-primary/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/2 h-72 w-[min(1100px,92vw)] -translate-x-1/2 rounded-[48px] bg-linear-to-r from-muted/10 via-transparent to-muted/10 blur-2xl" />
        </div>

        <div className="container relative py-14">
          <header className="flex flex-col gap-3">
            <p className="font-mono text-muted-foreground text-xs tracking-wide">
              {tFooter("kicker")}
            </p>
            <h2 className="font-semibold text-2xl tracking-tight md:text-3xl">
              {tFooter("title", { name: siteConfig.name })}
            </h2>
            <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
              {tFooter("subtitle")}
            </p>
          </header>

          <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            {groups.map((g) => (
              <FooterGroupColumn key={g.title} {...g} />
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 border-border/60 border-t pt-8 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-muted-foreground text-xs leading-relaxed">
              {tFooter("processingNotice")}{" "}
              <Link
                className="rounded-sm underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                href="/privacy"
              >
                {tNav("privacy")}
              </Link>{" "}
              ·{" "}
              <Link
                className="rounded-sm underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                href="/terms"
              >
                {tNav("terms")}
              </Link>
              .
            </p>

            <p className="text-muted-foreground text-xs">
              {tFooter("copyright", {
                year: siteConfig.copyrightYear,
                name: siteConfig.name,
              })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
