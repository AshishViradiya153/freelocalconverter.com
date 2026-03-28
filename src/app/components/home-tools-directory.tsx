"use client";

import {
  ArrowRight,
  ArrowRightLeft,
  Braces,
  FileImage,
  FileSpreadsheet,
  FileText,
  Palette,
  Search,
  Sparkles,
  TableProperties,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { getLocalizedServiceGroups } from "@/components/layouts/services-data-locale";
import {
  flattenServiceGroups,
  getSearchScore,
  normalizeSearchValue,
  type ToolSearchItem,
} from "@/components/layouts/tool-search";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const groupIcons = {
  all: Sparkles,
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

export function HomeToolsDirectory() {
  const locale = useLocale();
  const router = useRouter();
  const tHeader = useTranslations("header");
  const tLanding = useTranslations("landing");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { serviceGroups, searchItems } = React.useMemo(
    () => buildDirectoryItems(locale),
    [locale],
  );

  const [query, setQuery] = React.useState("");
  const [activeGroup, setActiveGroup] = React.useState<GroupId | "all">("all");

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

    return rankedItems.filter((item) => {
      const matchesGroup =
        activeGroup === "all" ? true : item.groupId === activeGroup;

      if (!matchesGroup) return false;
      if (!normalizedQuery) return true;

      return getSearchScore(item, query) > 0;
    });
  }, [activeGroup, query, rankedItems]);

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

  return (
    <section className="container py-8 md:py-10">
      <div className="relative overflow-hidden py-6 md:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute top-2 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <h1 className="mt-3 max-w-4xl font-semibold text-4xl tracking-tight md:text-6xl">
            {tLanding("heroTitle")}
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground text-sm leading-relaxed md:text-base">
            {tLanding("directorySubtitle")}
          </p>

          <div className="mt-8 w-full max-w-4xl">
            <label className="sr-only" htmlFor="landing-tool-search">
              {tLanding("directorySearchLabel")}
            </label>
            <div className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 shadow-sm transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
              <Search className="size-5 shrink-0 text-primary" aria-hidden />
              <input
                id="landing-tool-search"
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && topHit) {
                    event.preventDefault();
                    router.push(topHit.href);
                  }
                }}
                placeholder={tHeader("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/90 md:text-lg"
                spellCheck={false}
              />
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <div className="rounded-xl border bg-muted/30 px-2.5 py-1 font-mono text-muted-foreground text-xs">
                  ⌘K
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 w-full overflow-x-auto pb-2">
            <div className="flex min-w-max items-center justify-center gap-3">
              <CategoryChip
                icon={groupIcons.all}
                label={tLanding("directoryAllLabel")}
                count={searchItems.length}
                active={activeGroup === "all"}
                onClick={() => setActiveGroup("all")}
              />
              {serviceGroups.map((group) => {
                const Icon = groupIcons[group.id as GroupId] ?? Sparkles;
                const count = searchItems.filter(
                  (item) => item.groupId === group.id,
                ).length;

                return (
                  <CategoryChip
                    key={group.id}
                    icon={Icon}
                    label={group.title}
                    count={count}
                    active={activeGroup === group.id}
                    onClick={() => setActiveGroup(group.id as GroupId)}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-6 w-full border-border/70 border-t pt-5 text-center">
            <div className="text-muted-foreground text-sm">
              {query.trim()
                ? tLanding("directoryResultsLabel", {
                    count: visibleItems.length,
                    query: query.trim(),
                  })
                : tLanding("directoryReadyLabel", {
                    count: visibleItems.length,
                  })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <ToolCardLink
            key={`${item.groupId}-${item.href}-${item.label}`}
            item={item}
          />
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border/80 border-dashed bg-muted/15 px-6 py-12 text-center">
          <p className="font-medium text-lg">
            {tLanding("directoryEmptyTitle")}
          </p>
          <p className="mt-2 text-muted-foreground text-sm">
            {tLanding("directoryEmptyDescription")}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function CategoryChip({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
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
        "inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
        active
          ? "border-primary/50 bg-primary/10 text-foreground shadow-[0_12px_32px_-22px_rgba(245,158,11,0.65)]"
          : "border-border/70 bg-background/80 text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl border",
          active
            ? "border-primary/30 bg-primary/12 text-primary"
            : "border-border/60 bg-muted/20",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-sm">{label}</span>
        <span className="block text-xs opacity-80">{count}</span>
      </span>
    </button>
  );
}

function ToolCardLink({ item }: { item: ToolSearchItem }) {
  const CardIcon = groupIcons[(item.groupId as GroupId) ?? "all"] ?? Sparkles;

  return (
    <Link
      href={item.href}
      className="group relative flex h-full min-w-0 flex-col rounded-[1.4rem] border border-border/70 bg-card/95 p-4 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.34)] transition hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_24px_54px_-34px_rgba(245,158,11,0.28)] md:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-11 place-items-center rounded-xl border border-border/70 bg-muted/20 text-muted-foreground transition group-hover:border-primary/35 group-hover:text-primary">
          <CardIcon className="size-5" aria-hidden />
        </div>
        <span className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[10px] text-muted-foreground uppercase tracking-[0.16em]">
          {item.group}
        </span>
      </div>

      <div className="mt-5">
        <h2 className="font-semibold text-xl tracking-tight transition group-hover:text-primary md:text-[1.35rem]">
          {item.label}
        </h2>
        <p className="mt-2.5 text-muted-foreground text-sm leading-relaxed">
          {item.description}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-2 font-medium text-muted-foreground text-sm transition group-hover:text-foreground">
        Open tool
        <ArrowRight
          className="size-4 transition group-hover:translate-x-1"
          aria-hidden
        />
      </div>
    </Link>
  );
}
