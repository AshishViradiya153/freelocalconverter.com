"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import type { SimpleIcon } from "simple-icons";
import {
  defaultInstitutionLogoHost,
  type TrustedByEntry,
  trustedByEntries,
  trustedByEntryKey,
} from "@/config/trusted-by";
import { trustedByOutboundUrl } from "@/lib/marketing/utm";
import { cn } from "@/lib/utils";

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

/** Brutalist shell: 2px frame, hard shadow (kept on hover; see brutalist.md). */
const itemShellClass =
  "group relative flex h-12 w-44 shrink-0 items-center justify-center rounded-none border-2 border-border bg-background px-2 shadow-brutal-sm outline-none transition-[color,background-color,transform] hover:bg-primary hover:text-primary-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring active:translate-x-px active:translate-y-px sm:w-48";

const logoImgClass =
  "h-9 w-auto max-h-9 max-w-[7.5rem] object-contain object-center opacity-80 grayscale contrast-125 transition-[opacity,filter] group-hover:opacity-100 group-hover:grayscale-0";

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
    >
      <span className="sr-only">{`${label} website (opens in a new tab)`}</span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-9 w-auto max-w-28 text-foreground opacity-80 contrast-125 grayscale transition-[opacity,filter,color] group-hover:text-primary-foreground group-hover:opacity-100 group-hover:grayscale-0"
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
      className={itemShellClass}
      aria-label={`${name} (opens in a new tab)`}
    >
      <span className="font-black font-mono text-foreground text-xs uppercase tracking-tighter group-hover:text-primary-foreground sm:text-sm">
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
        {/* biome-ignore lint/performance/noImgElement: local SVG with onError fallback */}
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
        {/* biome-ignore lint/performance/noImgElement: remote logo with onError fallback */}
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
    <InstitutionMark abbr={abbr} name={name} href={href} tabIndex={tabIndex} />
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
    const href = trustedByOutboundUrl(entry.brand.href, entry.brand.icon.slug);
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
    .map((e) => (e.type === "brand" ? e.brand.icon.title : e.institution.name))
    .join(", ");
}

export function TrustedByMarquee() {
  const t = useTranslations("marketing");
  const reduceMotion = usePrefersReducedMotion();
  const items = trustedByEntries;

  return (
    <section
      className="relative w-full max-w-none border-border border-b-4 bg-background font-mono text-foreground [-webkit-font-smoothing:auto]"
      aria-labelledby="trusted-by-heading"
    >
      <div className="w-full border-border border-b-4 bg-primary py-4 text-primary-foreground md:py-5">
        <h2
          id="trusted-by-heading"
          className="text-balance px-4 text-center font-black text-lg uppercase tracking-tighter md:text-2xl"
        >
          {t("trustedHeading")}
        </h2>
      </div>

      {reduceMotion ? (
        <ul className="flex w-full flex-wrap items-center justify-center gap-4 py-6 md:gap-6 md:py-8">
          {items.map((entry) => (
            <li key={trustedByEntryKey(entry)}>
              <TrustedByItem entry={entry} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="relative w-full">
          <p className="sr-only">
            {t("trustedSrIntro")} {srOnlyNames(items)}.
          </p>
          <div className="mask-[linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] w-full overflow-hidden">
            <div
              className={cn(
                "flex w-max gap-8 py-6 md:gap-12 md:py-8",
                "animate-[trusted-by-marquee_80s_linear_infinite]",
              )}
              style={{ willChange: "transform" }}
            >
              {[0, 1].map((dup) => (
                <div
                  key={dup}
                  className="flex shrink-0 items-center gap-8 md:gap-12"
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
    </section>
  );
}
