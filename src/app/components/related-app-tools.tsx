"use client";

import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { pickRelatedAppTools } from "@/lib/tools/related-app-tools";
import { cn } from "@/lib/utils";

export function RelatedAppTools({ className }: { className?: string }) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("pseo");

  const { links, categoryTitle } = React.useMemo(
    () => pickRelatedAppTools({ pathname, locale, limit: 8 }),
    [pathname, locale],
  );

  if (links.length === 0) return null;

  return (
    <section
      aria-labelledby="related-app-tools-heading"
      className={cn("border-border border-t bg-muted/10 py-10", className)}
    >
      <div className="container max-w-3xl">
        <h2
          id="related-app-tools-heading"
          className="font-semibold text-base text-foreground tracking-tight"
        >
          {t("relatedAppToolsTitle")}
        </h2>
        {categoryTitle ? (
          <p className="mt-1 text-muted-foreground text-sm">
            {t("relatedAppToolsSubtitle", { category: categoryTitle })}
          </p>
        ) : null}
        <ul className="mt-4 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-medium text-primary text-sm underline-offset-4 hover:underline"
              >
                {link.label}
              </Link>
              <p className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                {link.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
