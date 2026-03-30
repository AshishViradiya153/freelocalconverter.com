"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import {
  type ToolDirectoryGroupId,
  toolDirectoryGroupIcons,
} from "@/app/components/tool-directory-group-icons";
import { Link, usePathname } from "@/i18n/navigation";
import { pickRelatedAppTools } from "@/lib/tools/related-app-tools";
import { cn } from "@/lib/utils";

export function RelatedAppTools({ className }: { className?: string }) {
  const pathname = usePathname();
  const locale = useLocale();
  const tPseo = useTranslations("pseo");
  const tLanding = useTranslations("landing");

  const { links, categoryTitle, groupId } = React.useMemo(
    () => pickRelatedAppTools({ pathname, locale, limit: 8 }),
    [pathname, locale],
  );

  const CardIcon =
    toolDirectoryGroupIcons[
      (groupId as ToolDirectoryGroupId | null) ?? "all"
    ] ?? toolDirectoryGroupIcons.all;

  if (links.length === 0) return null;

  return (
    <section
      aria-labelledby="related-app-tools-heading"
      className={cn(
        "w-full overflow-x-hidden bg-background font-mono text-foreground [-webkit-font-smoothing:auto]",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1600px] px-3 py-8 sm:px-4 md:px-8 md:py-10">
        <div
          className={cn(
            "w-full border-4 border-border bg-background shadow-brutal max-sm:shadow-brutal-sm",
          )}
        >
          <div className="wrap-break-word border-border border-b-4 bg-brutal-canvas px-3 py-2.5 text-brutal-canvas-foreground sm:px-4 sm:py-3">
            <h2
              id="related-app-tools-heading"
              className="text-balance font-black text-[9px] uppercase leading-tight tracking-widest sm:text-[10px]"
            >
              {tPseo("relatedAppToolsTitle")}
            </h2>
            {categoryTitle ? (
              <p className="wrap-break-word mt-1 max-w-3xl font-black text-[8px] uppercase leading-snug tracking-widest opacity-90 sm:text-[9px]">
                {tPseo("relatedAppToolsSubtitle", { category: categoryTitle })}
              </p>
            ) : null}
          </div>

          <div className="grid min-w-0 auto-rows-fr grid-cols-1 bg-brutal-canvas sm:grid-cols-2 xl:grid-cols-3">
            {links.map((link) => (
              <motion.div
                key={link.href}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative min-h-0 min-w-0"
              >
                <Link
                  href={link.href}
                  prefetch={false}
                  className="group flex h-full min-h-[min(220px,55dvh)] w-full min-w-0 cursor-crosshair flex-col border-border border-e-4 border-b-4 bg-card p-4 text-card-foreground transition-colors hover:bg-primary hover:text-primary-foreground sm:min-h-[240px] sm:p-6 md:min-h-[260px] md:p-8"
                >
                  <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
                    <div className="border-2 border-border bg-background p-3 shadow-brutal-sm transition-transform group-hover:rotate-12 sm:p-4">
                      <CardIcon
                        className="size-7 shrink-0 sm:size-8"
                        aria-hidden
                      />
                    </div>
                    {categoryTitle ? (
                      <span className="max-w-[min(11rem,45vw)] shrink-0 truncate bg-foreground px-2 py-1 text-end font-black text-[10px] text-background uppercase tracking-tighter group-hover:bg-background group-hover:text-foreground">
                        {categoryTitle}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
                    <h3 className="wrap-break-word text-balance font-black text-lg uppercase leading-none tracking-tighter sm:text-xl md:text-2xl">
                      {link.label}
                    </h3>
                    <p className="wrap-break-word font-bold text-muted-foreground text-sm leading-snug group-hover:text-primary-foreground/80">
                      {link.description}
                    </p>
                  </div>

                  <div className="mt-6 sm:mt-8">
                    <span className="flex w-full min-w-0 items-center justify-center gap-2 border-4 border-border bg-background px-2 py-3 font-black text-xs uppercase shadow-brutal-sm transition-all active:translate-x-1 active:translate-y-1 active:shadow-none group-hover:bg-foreground group-hover:text-background sm:py-4 sm:text-sm">
                      <span className="truncate">
                        {tLanding("directoryExecute")}
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 sm:size-[18px]"
                        aria-hidden
                      />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
