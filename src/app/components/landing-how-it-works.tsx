"use client";

import { ChevronDown, Download, FolderInput, MousePointerClick } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { cn } from "@/lib/utils";

const itemVariants = {
  hidden: { y: 14, opacity: 0 },
  show: { y: 0, opacity: 1 },
} as const;

export function LandingHowItWorks({ className }: { className?: string }) {
  const t = useTranslations("landing");

  const steps = React.useMemo(
    () =>
      [
        {
          id: "1",
          stepLabel: t("howItWorksStep1Label"),
          title: t("howItWorksStep1Title"),
          description: t("howItWorksStep1Description"),
          Icon: MousePointerClick,
        },
        {
          id: "2",
          stepLabel: t("howItWorksStep2Label"),
          title: t("howItWorksStep2Title"),
          description: t("howItWorksStep2Description"),
          Icon: FolderInput,
        },
        {
          id: "3",
          stepLabel: t("howItWorksStep3Label"),
          title: t("howItWorksStep3Title"),
          description: t("howItWorksStep3Description"),
          Icon: Download,
        },
      ] as const,
    [t],
  );

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className={cn(
        "border-border border-t-4 border-b-4 bg-brutal-canvas px-4 py-6 text-brutal-canvas-foreground sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-12",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3"
      >
        <p className="font-black text-[11px] uppercase tracking-widest">
          {t("howItWorksKicker")}
        </p>
        <h2
          id="how-it-works-heading"
          className="text-balance wrap-break-word font-black text-2xl uppercase leading-[0.95] tracking-tighter sm:text-3xl md:text-4xl"
        >
          {t("howItWorksTitle")}
        </h2>
        <p className="max-w-3xl font-bold text-brutal-canvas-foreground/85 text-sm leading-snug md:text-base">
          {t("howItWorksSubtitle")}
        </p>
      </motion.div>

      <motion.ol
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.08, delayChildren: 0.06 }}
        className="mt-8 flex min-w-0 list-none flex-col gap-3 sm:mt-10 md:flex-row md:items-stretch md:gap-4 lg:gap-6"
      >
        {steps.map((step, index) => {
          const Icon = step.Icon;
          const isLast = index === steps.length - 1;

          return (
            <motion.li
              key={step.id}
              variants={itemVariants}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0 flex-1"
            >
              <div
                className={cn(
                  "flex h-full flex-col border-4 border-border bg-background p-4 text-foreground shadow-brutal-sm sm:p-5",
                  "transition-[transform,box-shadow] duration-200 md:hover:-translate-y-1 md:hover:shadow-brutal",
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <span className="flex h-11 w-11 items-center justify-center border-2 border-border bg-primary font-black text-lg text-primary-foreground sm:h-12 sm:w-12 sm:text-xl">
                      {step.stepLabel}
                    </span>
                    <div className="border-2 border-border bg-card p-2.5 shadow-brutal-sm sm:p-3">
                      <Icon
                        className="size-5 text-card-foreground sm:size-6"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-balance wrap-break-word font-black text-base uppercase tracking-tight sm:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-2 wrap-break-word font-bold text-muted-foreground text-sm leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
                {!isLast ? (
                  <div
                    className="mt-4 flex justify-center md:hidden"
                    aria-hidden
                  >
                    <span className="flex items-center justify-center border-2 border-border bg-foreground p-1.5 text-background shadow-brutal-sm">
                      <ChevronDown className="size-5" />
                    </span>
                  </div>
                ) : null}
              </div>
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}
