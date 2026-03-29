"use client";

import { MenuIcon, SearchIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Icons } from "@/components/icons";
import { headerBarButtonClass } from "@/components/layouts/header-chrome";
import { LanguageSwitcher } from "@/components/layouts/language-switcher";
// import { ModeToggle } from "@/components/layouts/mode-toggle";
import { getLocalizedServiceGroups } from "@/components/layouts/services-data-locale";
import {
  flattenServiceGroups,
  getSearchScore,
  type ToolSearchItem,
} from "@/components/layouts/tool-search";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { headerRepoOutboundUrl } from "@/lib/marketing/utm";
import { cn } from "@/lib/utils";

function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");
  const showHeaderSearch = pathname !== "/";
  const isHomeActive = isActiveHref(pathname, "/");

  const quickLinks = [
    { href: "/guides", label: tNav("guides") },
    { href: "/blog", label: tNav("blog") },
  ];
  const serviceGroups = useMemo(
    () => getLocalizedServiceGroups(locale),
    [locale],
  );

  const searchItems = useMemo<ToolSearchItem[]>(
    () => flattenServiceGroups(serviceGroups),
    [serviceGroups],
  );

  const rankedSearchItems = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return searchItems;

    return [...searchItems]
      .map((item) => ({ item, score: getSearchScore(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label),
      )
      .map((entry) => entry.item);
  }, [searchItems, searchQuery]);

  useEffect(() => {
    if (!showHeaderSearch) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      setOpen((state) => !state);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showHeaderSearch]);

  return (
    <header className="sticky top-0 z-50 w-full border-border border-b-4 bg-background">
      <div className="container flex h-16 items-center gap-2">
        <Button
          variant="default"
          size="default"
          className={cn(
            "h-10 text-2xl! gap-0 rounded-none px-2 font-mono font-black text-base uppercase",
            headerBarButtonClass,
            isHomeActive &&
              "border-border bg-accent text-accent-foreground hover:border-border hover:bg-accent",
          )}
          asChild
        >
          <Link
            className="tracking-[0px]"
            href="/"
            aria-label={tNav("homeAria", { name: siteConfig.name })}
          >
            LT
          </Link>
        </Button>

        <div className="hidden flex-1 items-center justify-between gap-4 lg:flex">
          <NavigationMenu
            viewport={false}
            delayDuration={0}
            skipDelayDuration={0}
          >
            <NavigationMenuList>
              {serviceGroups.map((group) => {
                const groupHasActive = group.links.some((link) =>
                  isActiveHref(pathname, link.href),
                );
                return (
                  <NavigationMenuItem key={group.title}>
                    <NavigationMenuTrigger
                      className={cn(
                        groupHasActive &&
                          "border-border bg-accent text-accent-foreground hover:bg-accent data-[state=open]:border-border data-[state=open]:bg-accent",
                      )}
                    >
                      {group.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="top-full left-0 mt-1">
                      <div className="w-[430px] border-4 border-border bg-popover p-4 text-popover-foreground shadow-brutal-sm">
                        <p className="px-2 pb-2 text-muted-foreground text-xs">
                          {group.description}
                        </p>
                        <ul className="space-y-1">
                          {group.links.map((link) => (
                            <li key={`${link.href}-${link.label}`}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={link.href}
                                  prefetch={false}
                                  className={cn(
                                    "block border-2 border-transparent px-2 py-1.5 transition-colors",
                                    "hover:border-border hover:bg-accent hover:text-accent-foreground",
                                    isActiveHref(pathname, link.href) &&
                                      "border-border bg-accent text-accent-foreground",
                                  )}
                                >
                                  <span className="block text-sm">
                                    {link.label}
                                  </span>
                                  <span className="line-clamp-1 text-muted-foreground text-xs">
                                    {link.description}
                                  </span>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              })}
              {quickLinks.map((link) => (
                <NavigationMenuItem key={`${link.href}-${link.label}`}>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActiveHref(pathname, link.href) &&
                        "border-border bg-accent text-accent-foreground hover:bg-accent focus:border-border focus:bg-accent",
                    )}
                  >
                    <Link href={link.href} prefetch={false}>
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {showHeaderSearch ? (
            <Button
              variant="ghost"
              className="group h-9 w-[220px] justify-between rounded-none font-mono font-bold text-muted-foreground uppercase tracking-tighter"
              onClick={() => setOpen(true)}
            >
              <span className="inline-flex items-center gap-2">
                <SearchIcon className="size-4" />
                {tHeader("searchButton")}
              </span>
              <span className="border-2 border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground uppercase">
                ⌘K
              </span>
            </Button>
          ) : null}
        </div>

        <nav className="ml-auto flex items-center gap-1.5">
          {showHeaderSearch ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-9 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label={tHeader("openSearch")}
            >
              <SearchIcon className="size-4" />
            </Button>
          ) : null}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-9 lg:hidden", headerBarButtonClass)}
                aria-label={tHeader("openMenu")}
              >
                <MenuIcon className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[88vw] overflow-y-auto border-s-4 border-border sm:max-w-md"
            >
              <SheetHeader>
                <SheetTitle>{tHeader("exploreTools")}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-8">
                <div className="space-y-1">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      className={cn(
                        "block border-2 border-transparent px-2 py-1.5 font-mono font-bold text-sm uppercase tracking-tight transition-colors hover:border-border hover:bg-accent",
                        isActiveHref(pathname, link.href) &&
                          "border-border bg-accent text-accent-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                {serviceGroups.map((group) => (
                  <section key={group.title} className="space-y-2">
                    <h3 className="font-mono font-black text-xs uppercase tracking-widest">
                      {group.title}
                    </h3>
                    <ul className="space-y-1">
                      {group.links.map((link) => (
                        <li key={`${link.href}-${link.label}`}>
                          <Link
                            href={link.href}
                            prefetch={false}
                            className={cn(
                              "block border-2 border-transparent px-2 py-1.5 font-mono text-sm transition-colors hover:border-border hover:bg-accent",
                              isActiveHref(pathname, link.href) &&
                                "border-border bg-accent text-accent-foreground",
                            )}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {siteConfig.links.github ? (
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8", headerBarButtonClass)}
              asChild
            >
              <a
                aria-label={tNav("sourceRepo")}
                href={headerRepoOutboundUrl(siteConfig.links.github)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.gitHub className="size-4" aria-hidden="true" />
              </a>
            </Button>
          ) : null}
          <LanguageSwitcher />
          {/* <ModeToggle /> */}
        </nav>
      </div>

      <CommandDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setSearchQuery("");
        }}
        commandProps={{ shouldFilter: false }}
        showCloseButton={false}
        title={tHeader("searchTitle")}
        description={tHeader("searchDescription")}
      >
        <CommandInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder={tHeader("searchPlaceholder")}
          endContent={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 border-transparent hover:border-border hover:bg-accent"
              onClick={() => setOpen(false)}
              aria-label={tHeader("closeSearch")}
            >
              <XIcon className="size-4" />
            </Button>
          }
        />
        <CommandList key={searchQuery}>
          <CommandEmpty>{tHeader("noResults")}</CommandEmpty>
          <CommandGroup heading={tHeader("topResults")}>
            {rankedSearchItems.map((item) => (
              <CommandItem
                key={`${item.group}-${item.href}-${item.label}`}
                value={`${item.label} ${item.description} ${item.group} ${item.href}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{item.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {item.group} · {item.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
