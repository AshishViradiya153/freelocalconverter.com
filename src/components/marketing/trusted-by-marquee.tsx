"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import {
  defaultInstitutionLogoHost,
  trustedByEntries,
  trustedByEntryKey,
  type TrustedByEntry,
} from "@/config/trusted-by";
import { trustedByOutboundUrl } from "@/lib/marketing/utm";
import { cn } from "@/lib/utils";
import type { SimpleIcon } from "simple-icons";

function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

const itemShellClass =
  "group relative flex h-11 w-40 shrink-0 items-center justify-center rounded-md border border-transparent outline-offset-4 transition-colors hover:border-border/60 focus-visible:border-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:w-44";

const logoImgClass =
  "h-9 w-auto max-h-9 max-w-[7.5rem] object-contain object-center opacity-80 grayscale transition-[opacity,filter] group-hover:opacity-100 group-hover:grayscale-0 dark:opacity-65 dark:group-hover:opacity-90";

function BrandLogo({
  icon,
  href,
  tabIndex,
}: {
  icon: SimpleIcon;
  href: string;
  tabIndex?: number;
}) {
  const label = icon.title;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      className={itemShellClass}
      style={{ color: `#${icon.hex}` }}
      aria-label={`${label} website (opens in a new tab)`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-9 w-auto max-w-28 opacity-70 grayscale transition-[opacity,filter] group-hover:opacity-100 group-hover:grayscale-0 dark:opacity-60 dark:group-hover:opacity-90"
      >
        <path d={icon.path} fill="currentColor" />
      </svg>
    </a>
  );
}

function InstitutionMark({
  abbr,
  name,
  href,
  tabIndex,
}: {
  abbr: string;
  name: string;
  href: string;
  tabIndex?: number;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      className={cn(
        itemShellClass,
        "bg-muted/30 px-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
      aria-label={`${name} (opens in a new tab)`}
    >
      <span className="font-semibold text-foreground text-sm tracking-tight">
        {abbr}
      </span>
    </a>
  );
}

function InstitutionLogo({
  id,
  name,
  href,
  abbr,
  logoHost,
  tabIndex,
}: {
  id: string;
  name: string;
  href: string;
  abbr: string;
  logoHost?: string;
  tabIndex?: number;
}) {
  const host = logoHost ?? defaultInstitutionLogoHost(href);
  const clearbitSrc = `https://logo.clearbit.com/${encodeURIComponent(host)}`;
  const localSrc = `/trusted-by/logos/${id}.svg`;

  const [localFailed, setLocalFailed] = React.useState(false);
  const [remoteFailed, setRemoteFailed] = React.useState(false);

  if (!localFailed) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={tabIndex}
        className={itemShellClass}
        aria-label={`${name} (opens in a new tab)`}
      >
        <img
          src={localSrc}
          alt=""
          width={120}
          height={36}
          decoding="async"
          referrerPolicy="no-referrer"
          className={logoImgClass}
          onError={() => setLocalFailed(true)}
        />
      </a>
    );
  }

  if (!remoteFailed) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={tabIndex}
        className={itemShellClass}
        aria-label={`${name} (opens in a new tab)`}
      >
        <img
          src={clearbitSrc}
          alt=""
          width={120}
          height={36}
          decoding="async"
          referrerPolicy="no-referrer"
          className={logoImgClass}
          onError={() => setRemoteFailed(true)}
        />
      </a>
    );
  }

  return (
    <InstitutionMark
      abbr={abbr}
      name={name}
      href={href}
      tabIndex={tabIndex}
    />
  );
}

function TrustedByItem({
  entry,
  tabIndex,
}: {
  entry: TrustedByEntry;
  tabIndex?: number;
}) {
  if (entry.type === "brand") {
    const href = trustedByOutboundUrl(
      entry.brand.href,
      entry.brand.icon.slug,
    );
    return (
      <BrandLogo href={href} icon={entry.brand.icon} tabIndex={tabIndex} />
    );
  }
  const { id, name, href, abbr, logoHost } = entry.institution;
  const trackedHref = trustedByOutboundUrl(href, id);
  return (
    <InstitutionLogo
      id={id}
      name={name}
      href={trackedHref}
      abbr={abbr}
      logoHost={logoHost}
      tabIndex={tabIndex}
    />
  );
}

function srOnlyNames(entries: TrustedByEntry[]): string {
  return entries
    .map((e) =>
      e.type === "brand" ? e.brand.icon.title : e.institution.name,
    )
    .join(", ");
}

export function TrustedByMarquee() {
  const t = useTranslations("marketing");
  const reduceMotion = usePrefersReducedMotion();
  const items = trustedByEntries;

  return (
    <section
      className="bg-muted/25 py-10 md:py-12 relative"
      aria-labelledby="trusted-by-heading"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
        <div className="h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
        <div className="h-6 bg-linear-to-b from-primary/10 to-transparent blur-xl" />
      </div>
      <div className="w-full">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="trusted-by-heading"
            className="mt-2 font-semibold text-foreground text-xl tracking-tight md:text-2xl"
          >
            {t("trustedHeading")}
          </h2>
        </div>

        {reduceMotion ? (
          <ul className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-6 px-2">
            {items.map((entry) => (
              <li key={trustedByEntryKey(entry)}>
                <TrustedByItem entry={entry} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="relative mt-10">
            <p className="sr-only">
              {t("trustedSrIntro")} {srOnlyNames(items)}.
            </p>
            <div
              className="pointer-events-none absolute inset-y-0 start-0 z-10 w-12 bg-linear-to-r from-background to-transparent md:w-24"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 end-0 z-10 w-12 bg-linear-to-l from-background to-transparent md:w-24"
              aria-hidden
            />
            <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <div
                className={cn(
                  "flex w-max gap-12 md:gap-16",
                  "animate-[trusted-by-marquee_80s_linear_infinite]",
                )}
                style={{ willChange: "transform" }}
              >
                {[0, 1].map((dup) => (
                  <div
                    key={dup}
                    className="flex shrink-0 items-center gap-12 md:gap-16"
                    aria-hidden={dup === 0 ? undefined : true}
                  >
                    {items.map((entry) => (
                      <TrustedByItem
                        key={`${dup}-${trustedByEntryKey(entry)}`}
                        entry={entry}
                        tabIndex={dup === 0 ? undefined : -1}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
