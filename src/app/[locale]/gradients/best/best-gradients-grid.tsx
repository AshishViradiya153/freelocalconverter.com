"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BestGradientRow } from "@/lib/best-gallery/best-gallery-types";
import BestGradientCard from "./best-gradient-card";

type SortId = "trending" | "latest" | "popular";

type StyleId =
  | "all"
  | "classic"
  | "dark-modern"
  | "warm"
  | "cold"
  | "bright"
  | "dark"
  | "pastel"
  | "vintage"
  | "monochromatic"
  | "gradient";

type ColorId =
  | "all"
  | "red"
  | "orange"
  | "brown"
  | "yellow"
  | "green"
  | "turquoise"
  | "blue"
  | "violet"
  | "pink"
  | "white"
  | "gray"
  | "black";

type PageSizeId = 50 | 100 | 200 | 500 | "all";

const PAGE_SIZES: Array<{ id: PageSizeId; label: string }> = [
  { id: 50, label: "50" },
  { id: 100, label: "100" },
  { id: 200, label: "200" },
  { id: 500, label: "500" },
  { id: "all", label: "All" },
];

function parsePageSizeId(v: string): PageSizeId {
  if (v === "all") return "all";
  const n = Number(v);
  if (n === 50 || n === 100 || n === 200 || n === 500) return n;
  return 100;
}

const SORTS: Array<{ id: SortId; label: string }> = [
  { id: "trending", label: "Trending" },
  { id: "latest", label: "Latest" },
  { id: "popular", label: "Popular" },
];

const STYLE_FILTERS: Array<{ id: StyleId; label: string }> = [
  { id: "all", label: "All" },
  { id: "classic", label: "Classic" },
  { id: "dark-modern", label: "Dark Modern" },
  { id: "warm", label: "Warm" },
  { id: "cold", label: "Cold" },
  { id: "bright", label: "Bright" },
  { id: "dark", label: "Dark" },
  { id: "pastel", label: "Pastel" },
  { id: "vintage", label: "Vintage" },
  { id: "monochromatic", label: "Monochromatic" },
  { id: "gradient", label: "Gradient" },
];

const COLOR_FILTERS: Array<{ id: ColorId; label: string }> = [
  { id: "all", label: "All" },
  { id: "red", label: "Red" },
  { id: "orange", label: "Orange" },
  { id: "brown", label: "Brown" },
  { id: "yellow", label: "Yellow" },
  { id: "green", label: "Green" },
  { id: "turquoise", label: "Turquoise" },
  { id: "blue", label: "Blue" },
  { id: "violet", label: "Violet" },
  { id: "pink", label: "Pink" },
  { id: "white", label: "White" },
  { id: "gray", label: "Gray" },
  { id: "black", label: "Black" },
];

function matchesColor(g: BestGradientRow, colorId: ColorId) {
  if (colorId === "all") return true;
  return g.colorTag === colorId;
}

function matchesStyle(g: BestGradientRow, styleId: StyleId) {
  if (styleId === "all") return true;

  if (styleId === "classic") return g.styleClassic;
  if (styleId === "dark-modern") return g.styleDarkModern;
  if (styleId === "warm") return g.styleWarm;
  if (styleId === "cold") return g.styleCold;
  if (styleId === "bright") return g.styleBright;
  if (styleId === "dark") return g.styleDark;
  if (styleId === "pastel") return g.stylePastel;
  if (styleId === "vintage") return g.styleVintage;
  if (styleId === "monochromatic") return g.styleMonochromatic;
  if (styleId === "gradient") return g.styleGradient;

  return true;
}

export default function BestGradientsGrid({
  gradients,
  locale: _locale,
}: {
  gradients: BestGradientRow[];
  locale: string;
}) {
  const [sortId, setSortId] = React.useState<SortId>("trending");
  const [styleId, setStyleId] = React.useState<StyleId>("all");
  const [colorId, setColorId] = React.useState<ColorId>("all");
  const [pageSizeId, setPageSizeId] = React.useState<PageSizeId>(100);
  const [pageIndex, setPageIndex] = React.useState(0);

  const filtered = React.useMemo(() => {
    const next = gradients.filter((g) => {
      if (!matchesColor(g, colorId)) return false;
      if (!matchesStyle(g, styleId)) return false;
      return true;
    });

    next.sort((a, b) => {
      if (sortId === "trending") return b.score - a.score;
      if (sortId === "popular") return b.minTextRatio - a.minTextRatio;
      // latest
      return b.idx - a.idx;
    });

    return next;
  }, [gradients, sortId, styleId, colorId]);

  const totalPages =
    pageSizeId === "all"
      ? 1
      : Math.max(1, Math.ceil(filtered.length / pageSizeId));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const visible =
    pageSizeId === "all"
      ? filtered
      : filtered.slice(
          safePageIndex * pageSizeId,
          (safePageIndex + 1) * pageSizeId,
        );

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-muted-foreground text-xs">
            Sort
          </span>
          {SORTS.map((s) => {
            const isActive = sortId === s.id;
            return (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={isActive ? "secondary" : "outline"}
                aria-pressed={isActive}
                onClick={() => {
                  setSortId(s.id);
                  setPageIndex(0);
                }}
              >
                {s.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-muted-foreground text-xs">
            Style
          </span>
          {STYLE_FILTERS.map((s) => {
            const isActive = styleId === s.id;
            return (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={isActive ? "secondary" : "outline"}
                aria-pressed={isActive}
                onClick={() => {
                  setStyleId(s.id);
                  setPageIndex(0);
                }}
              >
                {s.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-muted-foreground text-xs">
            Color
          </span>
          {COLOR_FILTERS.map((c) => {
            const isActive = colorId === c.id;
            return (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={isActive ? "secondary" : "outline"}
                aria-pressed={isActive}
                onClick={() => {
                  setColorId(c.id);
                  setPageIndex(0);
                }}
              >
                {c.label}
              </Button>
            );
          })}
        </div>
      </section>

      {gradients.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-4 text-muted-foreground text-sm">
          No CSV found for best gradients. Run:
          <div className="mt-2 font-mono text-xs">
            pnpm tsx scripts/generate-best-palettes-gradients.ts --count 100
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-4 text-muted-foreground text-sm">
          No results for the selected filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((row) => (
              <BestGradientCard key={row.idx} row={row} locale={_locale} />
            ))}
          </div>

          <div className="flex flex-col gap-3 border-border/60 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-muted-foreground text-xs">
                  Show
                </span>
                <Select
                  value={String(pageSizeId)}
                  onValueChange={(v) => {
                    setPageSizeId(parsePageSizeId(v));
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={safePageIndex <= 0}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                >
                  Prev
                </Button>
                <span className="text-muted-foreground text-xs">
                  Page {safePageIndex + 1} of {totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={safePageIndex >= totalPages - 1}
                  onClick={() =>
                    setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
