"use client";

import { layout, prepare, setLocale } from "@chenglou/pretext";
import {
  ArrowRightLeft,
  Gauge,
  Lock,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { cn } from "@/lib/utils";

interface FeatureItem {
  id: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}

const itemVariants = {
  hidden: { y: 14, opacity: 0 },
  show: { y: 0, opacity: 1 },
} as const;

const FEATURE_TEXT_GAP_PX = 4;

interface TypographySnapshot {
  titleFont: string;
  titleLineHeight: number;
  descFont: string;
  descLineHeight: number;
}

function readTypographyFromProbes(
  titleProbe: HTMLElement,
  descProbe: HTMLElement,
): TypographySnapshot {
  const titleStyle = getComputedStyle(titleProbe);
  const descStyle = getComputedStyle(descProbe);
  const titleLineHeight = Number.parseFloat(titleStyle.lineHeight);
  const descLineHeight = Number.parseFloat(descStyle.lineHeight);

  return {
    titleFont: titleStyle.font,
    titleLineHeight: Number.isFinite(titleLineHeight) ? titleLineHeight : 18,
    descFont: descStyle.font,
    descLineHeight: Number.isFinite(descLineHeight) ? descLineHeight : 20,
  };
}

function useLandingFeaturesTypography(locale: string) {
  const titleProbeRef = React.useRef<HTMLSpanElement>(null);
  const descProbeRef = React.useRef<HTMLSpanElement>(null);
  const [typography, setTypography] = React.useState<TypographySnapshot | null>(
    null,
  );

  const refresh = React.useCallback(() => {
    const titleEl = titleProbeRef.current;
    const descEl = descProbeRef.current;
    if (!titleEl || !descEl) return;
    setTypography(readTypographyFromProbes(titleEl, descEl));
  }, []);

  React.useLayoutEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [locale, refresh]);

  React.useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    function onMqChange() {
      void document.fonts.ready.then(refresh);
    }
    mq.addEventListener("change", onMqChange);
    return () => mq.removeEventListener("change", onMqChange);
  }, [refresh]);

  return { titleProbeRef, descProbeRef, typography, refresh };
}

function useElementWidth<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
) {
  const [width, setWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    function syncFromDom(target: HTMLElement) {
      const next = Math.max(
        0,
        Math.floor(target.getBoundingClientRect().width),
      );
      setWidth((prev) => (prev === next ? prev : next));
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const next = Math.max(0, Math.floor(entry.contentRect.width));
      setWidth((prev) => (prev === next ? prev : next));
    });
    ro.observe(node);
    syncFromDom(node);

    return () => ro.disconnect();
  }, [ref]);

  return width;
}

function measureFeatureTextBlockHeight(
  title: string,
  description: string,
  locale: string,
  colWidth: number,
  typography: TypographySnapshot,
): number {
  if (colWidth <= 0) return 0;
  const titleForLayout = title.toLocaleUpperCase(locale);
  const titlePrepared = prepare(titleForLayout, typography.titleFont);
  const titleLayout = layout(
    titlePrepared,
    colWidth,
    typography.titleLineHeight,
  );
  const descPrepared = prepare(description, typography.descFont);
  const descLayout = layout(descPrepared, colWidth, typography.descLineHeight);
  return titleLayout.height + FEATURE_TEXT_GAP_PX + descLayout.height;
}

function LandingFeatureCard({
  item,
  locale,
  typography,
}: {
  item: FeatureItem;
  locale: string;
  typography: TypographySnapshot | null;
}) {
  const Icon = item.icon;
  const textColRef = React.useRef<HTMLDivElement>(null);
  const colWidth = useElementWidth(textColRef);

  const textMinHeight = React.useMemo(() => {
    if (!typography) return undefined;
    const h = measureFeatureTextBlockHeight(
      item.title,
      item.description,
      locale,
      colWidth,
      typography,
    );
    return h > 0 ? h : undefined;
  }, [colWidth, item.description, item.title, locale, typography]);

  return (
    <motion.div
      variants={itemVariants}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden border-4 border-border bg-card p-4 text-card-foreground shadow-brutal-sm sm:p-5",
        "transition-transform hover:-translate-y-1 hover:shadow-brutal",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 border-2 border-border bg-background p-3 shadow-brutal-sm transition-transform group-hover:rotate-6">
          <Icon className="size-5 sm:size-6" aria-hidden />
        </div>
        <div
          ref={textColRef}
          className="min-w-0 flex-1"
          style={textMinHeight ? { minHeight: textMinHeight } : undefined}
        >
          <h3 className="wrap-break-word text-balance font-black text-sm uppercase tracking-tight sm:text-base">
            {item.title}
          </h3>
          <p className="wrap-break-word mt-1 font-bold text-muted-foreground text-sm leading-snug">
            {item.description}
          </p>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-foreground opacity-0 transition-opacity group-hover:opacity-100"
      />
    </motion.div>
  );
}

export function LandingFeatures({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("landing");
  const { titleProbeRef, descProbeRef, typography } =
    useLandingFeaturesTypography(locale);

  React.useLayoutEffect(() => {
    setLocale(locale);
  }, [locale]);

  const items: FeatureItem[] = [
    {
      id: "local",
      icon: Lock,
      title: t("featuresItems.localTitle"),
      description: t("featuresItems.localDescription"),
    },
    {
      id: "fast",
      icon: Gauge,
      title: t("featuresItems.fastTitle"),
      description: t("featuresItems.fastDescription"),
    },
    {
      id: "search",
      icon: Search,
      title: t("featuresItems.searchTitle"),
      description: t("featuresItems.searchDescription"),
    },
    {
      id: "favorites",
      icon: Star,
      title: t("featuresItems.favoritesTitle"),
      description: t("featuresItems.favoritesDescription"),
    },
    {
      id: "convert",
      icon: ArrowRightLeft,
      title: t("featuresItems.convertTitle"),
      description: t("featuresItems.convertDescription"),
    },
    {
      id: "polish",
      icon: Sparkles,
      title: t("featuresItems.polishTitle"),
      description: t("featuresItems.polishDescription"),
    },
  ];

  return (
    <section
      aria-label={t("featuresAria")}
      className={cn(
        "border-border border-t-4 border-b-4 bg-background px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-12",
        className,
      )}
    >
      <div
        className="sr-only"
        aria-hidden
        data-pretext-probes="landing-features"
      >
        <span
          ref={titleProbeRef}
          className="font-black text-sm uppercase tracking-tight sm:text-base"
        >
          Probe
        </span>
        <span
          ref={descProbeRef}
          className="font-bold text-muted-foreground text-sm leading-snug"
        >
          Probe
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3"
      >
        <p className="font-black text-[11px] text-foreground uppercase tracking-widest">
          {t("featuresKicker")}
        </p>
        <h2 className="wrap-break-word text-balance font-black text-2xl uppercase leading-[0.95] tracking-tighter sm:text-3xl md:text-4xl">
          {t("featuresTitle")}
        </h2>
        <p className="max-w-3xl font-bold text-muted-foreground text-sm leading-snug md:text-base">
          {t("featuresSubtitle")}
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        transition={{ staggerChildren: 0.06, delayChildren: 0.05 }}
        className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
      >
        {items.map((item) => (
          <LandingFeatureCard
            key={item.id}
            item={item}
            locale={locale}
            typography={typography}
          />
        ))}
      </motion.div>
    </section>
  );
}
