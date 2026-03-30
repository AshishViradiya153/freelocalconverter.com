"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { LANDING_FAQ_MESSAGE_KEYS } from "@/app/components/landing-faq-constants";
import { cn } from "@/lib/utils";

export function LandingFaq({ className }: { className?: string }) {
  const t = useTranslations("landing");

  const items = React.useMemo(
    () =>
      LANDING_FAQ_MESSAGE_KEYS.map((keys, index) => ({
        id: `faq-item-${index + 1}`,
        question: t(keys.questionKey),
        answer: t(keys.answerKey),
      })),
    [t],
  );

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className={cn(
        "border-border border-t-4 border-b-4 bg-background px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-12",
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
        <p className="font-black text-[11px] text-foreground uppercase tracking-widest">
          {t("faqKicker")}
        </p>
        <h2
          id="faq-heading"
          className="text-balance wrap-break-word font-black text-2xl uppercase leading-[0.95] tracking-tighter sm:text-3xl md:text-4xl"
        >
          {t("faqTitle")}
        </h2>
        <p className="max-w-3xl font-bold text-muted-foreground text-sm leading-snug md:text-base">
          {t("faqSubtitle")}
        </p>
      </motion.div>

      <div className="mt-6 flex flex-col gap-3 sm:mt-8">
        {items.map((item) => (
          <details
            key={item.id}
            className="group border-4 border-border bg-card text-card-foreground shadow-brutal-sm transition-shadow open:shadow-brutal"
          >
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-bold text-sm leading-snug tracking-normal outline-none transition-colors hover:bg-primary hover:text-primary-foreground sm:p-5 sm:text-base",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "[&::-webkit-details-marker]:hidden",
              )}
            >
              <span className="min-w-0 flex-1 text-pretty">{item.question}</span>
              <ChevronDown
                className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180 sm:size-6"
                aria-hidden
              />
            </summary>
            <div className="border-border border-t-4 bg-background px-4 py-4 sm:px-5 sm:py-5">
              <p className="wrap-break-word font-bold text-muted-foreground text-sm leading-relaxed md:text-base">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
