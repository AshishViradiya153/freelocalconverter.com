"use client";

import * as React from "react";
import {
  Copy,
  Download,
  Share2,
  ChevronDownIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createLinearGradientExportCanvas,
  downloadCanvasPng,
} from "@/lib/canvas-png-export";
import { downloadTextFile } from "@/lib/download-text-file";
import { bestTextColorOn, wcagContrastBadge } from "@/lib/color-palette";
import { buildCssLinearGradient } from "@/lib/color-gradients";
import type { BestGradientRow } from "@/lib/best-gallery/best-gallery-types";
import { buildLocalizedPath } from "@/lib/seo/paths";

async function copyToClipboard(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
      return;
    }
    throw new Error("clipboard_not_available");
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "true");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (!ok) throw new Error("execCommand_copy_failed");
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  }
}

function buildGradientJson(row: BestGradientRow) {
  return JSON.stringify(
    {
      base: row.baseHex,
      mode: row.mode,
      angle: row.angle,
      colors: row.stops,
    },
    null,
    2,
  );
}

export default function BestGradientCard({
  row,
  locale,
}: {
  row: BestGradientRow;
  locale: string;
}) {
  const [copiedValue, setCopiedValue] = React.useState<string | null>(null);

  const href = new URLSearchParams({
    base: row.baseHex,
    mode: row.mode,
    count: "5",
    angle: String(row.angle),
    sat: String(row.saturationMul),
    light: String(row.lightnessMul),
  }).toString();

  const url = `${buildLocalizedPath(locale, "/gradients")}?${href}`;

  const gradientCss = React.useMemo(
    () => buildCssLinearGradient(row.angle, row.stops),
    [row.angle, row.stops],
  );

  const safeBase = row.baseHex.replace("#", "");

  const cssVars = React.useMemo(() => {
    return row.stops.map((h, i) => `  --color-${i + 1}: ${h};`).join("\n");
  }, [row.stops]);

  const css = React.useMemo(() => {
    return `:root {\n${cssVars}\n  --gradient: ${gradientCss};\n}\n`;
  }, [cssVars, gradientCss]);

  function onDownloadPng() {
    const canvas = createLinearGradientExportCanvas({
      angleDeg: row.angle,
      hexStops: row.stops,
    });
    const fileName = `gradient-${row.stops.length}-${safeBase}-${Math.round(row.angle)}.png`;
    downloadCanvasPng(canvas, fileName);
    toast.success("Download started");
  }

  function onDownloadJson() {
    const fileName = `gradient-${row.stops.length}-${safeBase}-${Math.round(row.angle)}.json`;
    downloadTextFile(
      buildGradientJson(row),
      fileName,
      "application/json;charset=utf-8",
    );
    toast.success("Download started");
  }

  function onDownloadCss() {
    const fileName = `gradient-${row.stops.length}-${safeBase}-${Math.round(row.angle)}.css`;
    downloadTextFile(css, fileName, "text/css;charset=utf-8");
    toast.success("Download started");
  }

  async function onCopyCss() {
    void copyToClipboard(gradientCss);
  }

  return (
    <div className="group rounded-xl border bg-background/50 p-4 transition-colors hover:bg-background">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{row.name}</div>
          <div className="mt-1 text-xs text-muted-foreground font-mono">
            {row.mode} · min text {row.minTextRatio.toFixed(2)} · {row.angle}
            deg
          </div>
        </div>

        <Button asChild variant="secondary" size="sm" className="shrink-0">
          <Link href={url}>Use</Link>
        </Button>
      </div>

      <div
        className="mt-3 h-28 w-full rounded-lg border"
        style={{ background: gradientCss }}
        aria-label={`Gradient preview: ${row.name}`}
      />

      <div className="mt-3 grid grid-cols-5 gap-1">
        {row.stops.map((hex, i) => {
          const best = bestTextColorOn(hex);
          const badge = wcagContrastBadge(best.ratio);
          return (
            <button
              key={`${hex}-${i}`}
              type="button"
              className="relative h-10 w-full overflow-hidden rounded-md border text-left"
              style={{ backgroundColor: hex }}
              onClick={async () => {
                await copyToClipboard(hex);
                setCopiedValue(`Stop copied: ${hex.toUpperCase()}`);
                window.setTimeout(() => setCopiedValue(null), 1500);
              }}
              aria-label={`Copy stop ${i + 1}: ${hex}`}
              title={hex.toUpperCase()}
            >
              <span className="sr-only">{`Copy ${hex}`}</span>
              <span
                className="absolute inset-0 flex items-end justify-center pb-1 px-1 text-[10px] font-mono font-semibold"
                style={{ color: best.textHex }}
              >
                {hex.replace("#", "").toUpperCase()}
              </span>
              <span
                className="pointer-events-none absolute top-0 left-0 right-0 flex items-center justify-center bg-black/30 py-0.5 text-[10px] font-semibold"
                style={{ color: best.textHex }}
              >
                {badge}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void onCopyCss()}
          aria-label="Copy gradient CSS"
          title="Copy gradient CSS"
        >
          <Copy className="size-4" aria-hidden />
          Copy CSS
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              aria-label="Download options"
            >
              <Download className="size-4" aria-hidden />
              Download
              <ChevronDownIcon className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onDownloadPng();
              }}
            >
              <Download className="size-4" aria-hidden />
              PNG
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onDownloadJson();
              }}
            >
              <Download className="size-4" aria-hidden />
              JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onDownloadCss();
              }}
            >
              <Download className="size-4" aria-hidden />
              CSS
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => {
            void (async () => {
              try {
                const params = new URLSearchParams({
                  base: row.baseHex,
                  mode: row.mode,
                  count: "5",
                  angle: String(row.angle),
                  sat: String(row.saturationMul),
                  light: String(row.lightnessMul),
                });
                const u = new URL(window.location.href);
                u.pathname = buildLocalizedPath(locale, "/gradients");
                u.search = params.toString();
                await copyToClipboard(u.toString());
                toast.success("Share link copied");
                setCopiedValue("Share link copied");
                window.setTimeout(() => setCopiedValue(null), 1500);
              } catch {
                toast.error("Copy failed");
              }
            })();
          }}
          aria-label="Copy share link"
          title="Copy share link"
        >
          <Share2 className="size-4" aria-hidden />
          Share link
        </Button>
      </div>

      {copiedValue ? (
        <div className="mt-2 text-[11px] text-muted-foreground">
          {copiedValue}
        </div>
      ) : null}
    </div>
  );
}

