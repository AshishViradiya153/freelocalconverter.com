"use client";

import {
  AlertTriangle,
  ArrowRightLeft,
  Braces,
  ChevronRight,
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  Palette,
  Search,
  Sparkles,
  Star,
  TableProperties,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { getLocalizedServiceGroups } from "@/components/layouts/services-data-locale";
import {
  flattenServiceGroups,
  getSearchScore,
  normalizeSearchValue,
  type ToolSearchItem,
} from "@/components/layouts/tool-search";
import { usePinnedTools } from "@/hooks/use-pinned-tools";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const groupIcons = {
  all: Sparkles,
  favorites: Star,
  converters: ArrowRightLeft,
  viewers: TableProperties,
  excel: FileSpreadsheet,
  developer: Braces,
  pdf: FileText,
  video: Video,
  image: FileImage,
  color: Palette,
} as const;

type GroupId = keyof typeof groupIcons;

function buildDirectoryItems(locale: string) {
  const serviceGroups = getLocalizedServiceGroups(locale);
  const searchItems = flattenServiceGroups(serviceGroups);

  return { serviceGroups, searchItems };
}

function replaceSearchParamQ(nextValue: string) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const trimmed = nextValue.trim();
  if (trimmed) params.set("q", trimmed);
  else params.delete("q");
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl === currentUrl) return;
  window.history.replaceState(window.history.state, "", nextUrl);
}

function readSearchParamQFromWindow(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

export function HomeToolsDirectory() {
  const locale = useLocale();
  const router = useRouter();
  const tLanding = useTranslations("landing");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const urlSyncTimeoutRef = React.useRef<number | null>(null);
  const { pinnedHrefs, pinnedSet, togglePinned } = usePinnedTools();
  const { serviceGroups, searchItems } = React.useMemo(
    () => buildDirectoryItems(locale),
    [locale],
  );

  const [query, setQuery] = React.useState("");
  const [activeGroup, setActiveGroup] = React.useState<GroupId>("all");

  React.useLayoutEffect(() => {
    function syncQueryFromUrl() {
      setQuery(readSearchParamQFromWindow());
    }
    syncQueryFromUrl();
    window.addEventListener("popstate", syncQueryFromUrl);
    return () => window.removeEventListener("popstate", syncQueryFromUrl);
  }, []);

  React.useEffect(
    () => () => {
      if (urlSyncTimeoutRef.current !== null) {
        window.clearTimeout(urlSyncTimeoutRef.current);
      }
    },
    [],
  );

  const rankedItems = React.useMemo(() => {
    if (!query.trim()) return searchItems;

    return [...searchItems]
      .map((item) => ({ item, score: getSearchScore(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label),
      )
      .map((entry) => entry.item);
  }, [query, searchItems]);

  const visibleItems = React.useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);

    const filtered = rankedItems.filter((item) => {
      const matchesGroup =
        activeGroup === "all"
          ? true
          : activeGroup === "favorites"
            ? pinnedSet.has(item.href)
            : item.groupId === activeGroup;

      if (!matchesGroup) return false;
      if (!normalizedQuery) return true;

      return getSearchScore(item, query) > 0;
    });

    if (activeGroup !== "favorites") return filtered;

    const order = new Map(pinnedHrefs.map((href, index) => [href, index]));
    return [...filtered].sort(
      (a, b) => (order.get(a.href) ?? 1e9) - (order.get(b.href) ?? 1e9),
    );
  }, [activeGroup, pinnedHrefs, pinnedSet, query, rankedItems]);

  const topHit = visibleItems[0] ?? null;

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onResetFilters() {
    if (urlSyncTimeoutRef.current !== null) {
      window.clearTimeout(urlSyncTimeoutRef.current);
      urlSyncTimeoutRef.current = null;
    }
    setQuery("");
    setActiveGroup("all");
    replaceSearchParamQ("");
  }

  return (
    <section className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden bg-background font-mono text-foreground [-webkit-font-smoothing:auto]">
      <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-[1600px] flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4 md:px-8 md:py-6">
        {/* Room for hard shadow so the page does not gain a horizontal scrollbar */}
        <div className="min-w-0 pr-2 pb-2 sm:pr-2.5 sm:pb-2.5 md:pr-3 md:pb-3">
          <div
            className={cn(
              "grid w-full min-w-0 max-w-full flex-1 border-4 border-border bg-background shadow-brutal max-sm:shadow-brutal-sm",
              "grid-rows-[auto_auto]",
            )}
          >
            <header className="shrink-0 border-border border-b-4 bg-primary p-4 text-primary-foreground sm:p-6 md:p-10 lg:p-12">
              <motion.h1
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="whitespace-pre-line text-balance break-words font-black text-[clamp(1.75rem,8vw,3rem)] uppercase leading-[0.95] tracking-tighter sm:text-5xl md:text-7xl lg:text-8xl"
              >
                {tLanding("heroTitle")}
              </motion.h1>
              <p className="mt-4 max-w-3xl break-words font-bold text-primary-foreground/85 text-sm leading-snug sm:mt-6 md:text-base">
                {tLanding("directorySubtitle")}
              </p>
            </header>

            <div className="flex w-full min-w-0 flex-col lg:flex-row lg:items-stretch">
              <aside className="w-full min-w-0 shrink-0 border-border border-b-4 bg-background p-4 sm:p-6 md:p-8 lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:border-e-4 lg:border-b-0 xl:w-80">
                <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
                  <div className="flex min-w-0 flex-col gap-3">
                    <label
                      className="flex items-center gap-2 font-black text-[11px] text-foreground uppercase tracking-widest"
                      htmlFor="landing-tool-search"
                    >
                      <Search className="size-3.5 shrink-0" aria-hidden />
                      {tLanding("directorySearchTag")}
                    </label>
                    <input
                      id="landing-tool-search"
                      ref={inputRef}
                      type="search"
                      value={query}
                      onChange={(event) => {
                        const next = event.target.value;
                        setQuery(next);
                        if (urlSyncTimeoutRef.current !== null) {
                          window.clearTimeout(urlSyncTimeoutRef.current);
                        }
                        urlSyncTimeoutRef.current = window.setTimeout(() => {
                          urlSyncTimeoutRef.current = null;
                          replaceSearchParamQ(next);
                        }, 320);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && topHit) {
                          event.preventDefault();
                          router.push(topHit.href);
                        }
                      }}
                      placeholder={tLanding("directoryFilterPlaceholder")}
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full border-2 border-border bg-background p-3 font-bold text-foreground text-sm outline-none transition-colors placeholder:text-muted-foreground focus:bg-foreground focus:text-background focus:ring-0"
                    />
                    <p className="text-end font-black text-[10px] text-muted-foreground uppercase tracking-widest">
                      <span className="inline-block border-2 border-border bg-background px-2 py-1 text-foreground">
                        ⌘K
                      </span>
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex items-center gap-2 font-black text-[11px] text-foreground uppercase tracking-widest">
                      <Filter className="size-3.5 shrink-0" aria-hidden />
                      {tLanding("directoryCategoriesTag")}
                    </div>
                    <div className="no-scrollbar flex min-w-0 flex-row gap-2 overflow-x-auto overscroll-x-contain pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                      <CategoryBrutalistButton
                        label={tLanding("directoryAllLabel")}
                        count={searchItems.length}
                        active={activeGroup === "all"}
                        onClick={() => setActiveGroup("all")}
                      />
                      <CategoryBrutalistButton
                        icon={Star}
                        label={tLanding("directoryFavoritesLabel")}
                        count={pinnedHrefs.length}
                        active={activeGroup === "favorites"}
                        onClick={() => setActiveGroup("favorites")}
                      />
                      {serviceGroups.map((group) => {
                        const count = searchItems.filter(
                          (item) => item.groupId === group.id,
                        ).length;

                        return (
                          <CategoryBrutalistButton
                            key={group.id}
                            label={group.title}
                            count={count}
                            active={activeGroup === group.id}
                            onClick={() => setActiveGroup(group.id as GroupId)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col bg-brutal-canvas">
                <div className="min-w-0 shrink-0 break-words border-border border-b-4 bg-brutal-canvas px-3 py-2.5 font-black text-[9px] text-brutal-canvas-foreground uppercase leading-tight tracking-widest sm:px-4 sm:py-3 sm:text-[10px]">
                  {query.trim()
                    ? tLanding("directoryResultsLabel", {
                        count: visibleItems.length,
                        query: query.trim(),
                      })
                    : tLanding("directoryReadyLabel", {
                        count: visibleItems.length,
                      })}
                </div>

                <div className="grid min-w-0 auto-rows-fr grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence initial={false} mode="popLayout">
                    {visibleItems.map((item) => (
                      <ToolCardBrutalist
                        key={`${item.groupId}-${item.href}-${item.label}`}
                        item={item}
                        executeLabel={tLanding("directoryExecute")}
                        isPinned={pinnedSet.has(item.href)}
                        pinAriaLabel={tLanding("directoryPinToolAria")}
                        unpinAriaLabel={tLanding("directoryUnpinToolAria")}
                        onTogglePin={() => togglePinned(item.href)}
                      />
                    ))}
                    {visibleItems.length === 0 ? (
                      <motion.div
                        key="brutalist-directory-empty"
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="col-span-full border-border border-b-4 bg-card p-8 text-center text-card-foreground sm:p-12 md:p-24"
                      >
                        <AlertTriangle
                          className="mx-auto mb-6 size-16 text-foreground"
                          aria-hidden
                        />
                        <h2 className="break-words font-black text-2xl uppercase tracking-tighter sm:text-3xl md:text-4xl">
                          {activeGroup === "favorites" &&
                          !normalizeSearchValue(query)
                            ? tLanding("directoryFavoritesEmptyTitle")
                            : tLanding("directoryEmptyTitle")}
                        </h2>
                        <p className="mt-4 font-bold text-muted-foreground text-sm md:text-base">
                          {activeGroup === "favorites" &&
                          !normalizeSearchValue(query)
                            ? tLanding("directoryFavoritesEmptyDescription")
                            : tLanding("directoryEmptyDescription")}
                        </p>
                        <button
                          type="button"
                          onClick={onResetFilters}
                          className="mt-8 max-w-full border-4 border-border bg-background px-4 py-3 font-black text-foreground text-sm uppercase shadow-brutal-sm transition-colors hover:bg-foreground hover:text-background active:translate-x-1 active:translate-y-1 active:shadow-none sm:mt-10 sm:px-8 sm:py-4 sm:text-base"
                        >
                          {tLanding("directoryResetFilters")}
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryBrutalistButton({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-max min-w-[min(140px,calc(100vw-3rem))] max-w-[calc(100vw-3rem)] shrink-0 items-center justify-between gap-2 border-2 border-border p-2.5 text-left font-bold text-sm transition-all sm:min-w-[140px] sm:gap-3 sm:p-3 sm:text-base lg:w-full lg:min-w-0 lg:max-w-none",
        active
          ? "translate-x-1 -translate-y-1 bg-foreground text-background shadow-brutal-offset"
          : "bg-background text-foreground hover:bg-primary hover:text-primary-foreground",
      )}
    >
      <span className="flex min-w-0 items-center gap-2 truncate uppercase tracking-tighter">
        {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
        <span className="truncate">{label}</span>
      </span>
      <span
        className={cn(
          "shrink-0 border px-1.5 py-0.5 font-black text-[10px] uppercase",
          active
            ? "border-background bg-background text-foreground"
            : "border-foreground bg-foreground text-background",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ToolCardBrutalist({
  item,
  executeLabel,
  isPinned,
  pinAriaLabel,
  unpinAriaLabel,
  onTogglePin,
}: {
  item: ToolSearchItem;
  executeLabel: string;
  isPinned: boolean;
  pinAriaLabel: string;
  unpinAriaLabel: string;
  onTogglePin: () => void;
}) {
  const CardIcon = groupIcons[(item.groupId as GroupId) ?? "all"] ?? Sparkles;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-0 min-w-0"
    >
      <button
        type="button"
        aria-label={isPinned ? unpinAriaLabel : pinAriaLabel}
        aria-pressed={isPinned}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onTogglePin();
        }}
        className={cn(
          "absolute end-3 top-3 z-20 border-2 border-border bg-background p-2 shadow-brutal-sm transition-colors hover:bg-foreground hover:text-background sm:end-4 sm:top-4 sm:p-2.5",
          isPinned && "bg-foreground text-background",
        )}
      >
        <Star
          className={cn("size-5 sm:size-6", isPinned && "fill-current")}
          aria-hidden
        />
      </button>
      <Link
        href={item.href}
        prefetch={false}
        className="group flex h-full min-h-[min(260px,70dvh)] w-full min-w-0 cursor-crosshair flex-col border-border border-e-4 border-b-4 bg-card p-4 pe-14 text-card-foreground transition-colors hover:bg-primary hover:text-primary-foreground sm:min-h-[280px] sm:p-6 sm:pe-16 md:min-h-[300px] md:p-8 md:pe-20"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="border-2 border-border bg-background p-4 shadow-brutal-sm transition-transform group-hover:rotate-12">
            <CardIcon className="size-8 shrink-0" aria-hidden />
          </div>
          <span className="max-w-[min(11rem,45vw)] shrink-0 truncate bg-foreground px-2 py-1 text-end font-black text-[10px] text-background uppercase tracking-tighter group-hover:bg-background group-hover:text-foreground">
            {item.group}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <h2 className="text-balance break-words font-black text-xl uppercase leading-none tracking-tighter sm:text-2xl md:text-3xl">
            {item.label}
          </h2>
          <p className="break-words font-bold text-muted-foreground text-sm leading-snug group-hover:text-primary-foreground/80">
            {item.description}
          </p>
        </div>

        <div className="mt-8">
          <span className="flex w-full min-w-0 items-center justify-center gap-2 border-4 border-border bg-background px-2 py-3 font-black text-xs uppercase shadow-brutal-sm transition-all active:translate-x-1 active:translate-y-1 active:shadow-none group-hover:bg-foreground group-hover:text-background sm:py-4 sm:text-sm">
            <span className="truncate">{executeLabel}</span>
            <ChevronRight
              className="size-4 shrink-0 sm:size-[18px]"
              aria-hidden
            />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
