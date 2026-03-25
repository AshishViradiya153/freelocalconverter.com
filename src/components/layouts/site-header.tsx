import { getTranslations } from "next-intl/server";
import { ActiveLink } from "@/components/active-link";
import { Icons } from "@/components/icons";
import { LanguageSwitcher } from "@/components/layouts/language-switcher";
import { ModeToggle } from "@/components/layouts/mode-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { headerRepoOutboundUrl } from "@/lib/marketing/utm";

export async function SiteHeader() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-0 px-2 font-mono font-semibold text-base tracking-tight"
          asChild
        >
          <Link href="/" aria-label={t("homeAria", { name: siteConfig.name })}>
            <span className="text-muted-foreground">.</span>
            <span>csv</span>
          </Link>
        </Button>
        <nav className="flex w-full items-center gap-1 text-sm">
          <ActiveLink href="/">{t("viewer")}</ActiveLink>
          <ActiveLink href="/compare">{t("compare")}</ActiveLink>
          <ActiveLink href="/palettes/trending">Palettes</ActiveLink>
          <ActiveLink href="/gradients">Gradients</ActiveLink>
          <ActiveLink href="/xls-to-csv">{t("xlsToCsv")}</ActiveLink>
          <ActiveLink href="/xls-viewer">{t("xlsViewer")}</ActiveLink>
          <ActiveLink href="/parquet-viewer">{t("parquetViewer")}</ActiveLink>
          <ActiveLink href="/guides" match="nested">
            {t("guides")}
          </ActiveLink>
          <ActiveLink href="/tools" match="nested">
            {t("tools")}
          </ActiveLink>
          <ActiveLink href="/blog" match="nested">
            {t("blog")}
          </ActiveLink>
        </nav>
        <nav className="flex flex-1 items-center gap-2 md:justify-end">
          {siteConfig.links.github ? (
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <a
                aria-label={t("sourceRepo")}
                href={headerRepoOutboundUrl(siteConfig.links.github)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.gitHub className="size-4" aria-hidden="true" />
              </a>
            </Button>
          ) : null}
          <LanguageSwitcher />
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
