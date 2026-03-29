"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_DISPLAY_NAMES } from "@/i18n/locale-names";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

const LOCALE_TO_FLAG_CC: Partial<Record<AppLocale, string>> = {
  ar: "SA",
  az: "AZ",
  de: "DE",
  el: "GR",
  en: "US",
  es: "ES",
  fa: "IR",
  fr: "FR",
  he: "IL",
  it: "IT",
  ja: "JP",
  ko: "KR",
  nl: "NL",
  pt: "PT",
  ru: "RU",
  tr: "TR",
  zh: "CN",
};

function vercelFlagSvgUrl(countryCode: string, size: "s" | "m" | "l" = "s") {
  return `https://country-flags.vercel.sh/${size}/${countryCode.toUpperCase()}.svg`;
}

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("language");
  const [failedFlags, setFailedFlags] = React.useState(() => new Set<string>());
  const localeFlagCc = LOCALE_TO_FLAG_CC[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t("menuAria")}
        >
          <span className="relative grid place-items-center">
            <Globe className="size-4" aria-hidden />
            {localeFlagCc && !failedFlags.has(locale) ? (
              // biome-ignore lint/performance/noImgElement: external SVG flag asset
              <img
                src={vercelFlagSvgUrl(localeFlagCc, "s")}
                alt=""
                width={12}
                height={12}
                className="absolute -right-1 -bottom-1 size-3 rounded-[4px] ring-1 ring-border/60"
                onError={() => {
                  setFailedFlags((prev) => new Set(prev).add(locale));
                }}
              />
            ) : null}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[min(24rem,70vh)] min-w-48 overflow-y-auto"
      >
        {routing.locales.map((code) => {
          const itemFlagCc = LOCALE_TO_FLAG_CC[code];
          return (
            <DropdownMenuItem
              key={code}
              disabled={code === locale}
              aria-label={t("switchTo", {
                language: LOCALE_DISPLAY_NAMES[code],
              })}
              onSelect={() => {
                router.replace(pathname, { locale: code });
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                {itemFlagCc && !failedFlags.has(code) ? (
                  // biome-ignore lint/performance/noImgElement: external SVG flag asset
                  <img
                    src={vercelFlagSvgUrl(itemFlagCc, "s")}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 rounded-[6px] ring-1 ring-border/60"
                    onError={() => {
                      setFailedFlags((prev) => new Set(prev).add(code));
                    }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="size-4 rounded-[6px] bg-muted/50 ring-1 ring-border/60"
                  />
                )}
                <span className="truncate">{LOCALE_DISPLAY_NAMES[code]}</span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
