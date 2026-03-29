"use client";

import {
  ChevronDownIcon,
  Copy,
  Download,
  Maximize2,
  Palette as PaletteIcon,
  Share2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BestPaletteRow } from "@/lib/best-gallery/best-gallery-types";
import {
  createPaletteStripesExportCanvas,
  downloadCanvasPng,
} from "@/lib/canvas-png-export";
import { bestTextColorOn } from "@/lib/color-palette";
import { downloadTextFile } from "@/lib/download-text-file";
import { buildLocalizedPath } from "@/lib/seo/paths";

function buildPaletteCssVars(hexes: string[]) {
  const lines = hexes.map((h, i) => `  --color-${i + 1}: ${h};`);
  return `:root {\n${lines.join("\n")}\n}\n`;
}

function buildPaletteJson(row: BestPaletteRow) {
  return JSON.stringify(
    {
      base: row.baseHex,
      mode: row.mode,
      colors: row.hexes,
    },
    null,
    2,
  );
}

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

export default function BestPaletteCard({
  row,
  locale,
}: {
  row: BestPaletteRow;
  locale: string;
}) {
  const [copiedValue, setCopiedValue] = React.useState<string | null>(null);

  const href = new URLSearchParams({
    base: row.baseHex,
    mode: row.mode,
    count: "5",
    sat: String(row.saturationMul),
    light: String(row.lightnessMul),
  }).toString();

  const url = `${buildLocalizedPath(locale, "/palettes/trending")}?${href}`;

  const fullscreenHref = new URLSearchParams({
    base: row.baseHex,
    mode: row.mode,
    count: "5",
    sat: String(row.saturationMul),
    light: String(row.lightnessMul),
    fullscreen: "1",
  }).toString();

  const fullscreenUrl = `${buildLocalizedPath(
    locale,
    "/palettes/trending",
  )}?${fullscreenHref}`;

  const cssVars = React.useMemo(
    () => buildPaletteCssVars(row.hexes),
    [row.hexes],
  );

  const safeBase = row.baseHex.replace("#", "");

  async function onCopyCssVars() {
    await copyToClipboard(cssVars);
    setCopiedValue("CSS variables copied");
    window.setTimeout(() => setCopiedValue(null), 1500);
  }

  function onDownloadPng() {
    const fileName = `palette-${row.hexes.length}-${safeBase}.png`;
    const canvas = createPaletteStripesExportCanvas(row.hexes);
    if (!canvas) return;
    downloadCanvasPng(canvas, fileName);
    toast.success("Download started");
  }

  function onDownloadJson() {
    const fileName = `palette-${row.hexes.length}-${safeBase}.json`;
    downloadTextFile(
      buildPaletteJson(row),
      fileName,
      "application/json;charset=utf-8",
    );
    toast.success("Download started");
  }

  function onDownloadCss() {
    const fileName = `palette-${row.hexes.length}-${safeBase}.css`;
    downloadTextFile(cssVars, fileName, "text/css;charset=utf-8");
    toast.success("Download started");
  }

  async function onShare() {
    try {
      const params = new URLSearchParams({
        base: row.baseHex,
        mode: row.mode,
        count: "5",
        sat: String(row.saturationMul),
        light: String(row.lightnessMul),
      });
      const u = new URL(window.location.href);
      u.pathname = buildLocalizedPath(locale, "/palettes/trending");
      u.search = params.toString();
      await copyToClipboard(u.toString());
      toast.success("Share link copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="group rounded-none bg-background/50 transition-colors hover:bg-background">
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-sm">{row.name}</div>
          <div className="mt-1 font-mono text-muted-foreground text-xs">
            {row.mode} · min text {row.minTextRatio.toFixed(2)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="shrink-0">
            <Link href={url}>Use</Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            aria-label="Use fullscreen"
            title="Use fullscreen"
          >
            <Link href={fullscreenUrl}>
              <Maximize2 className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex h-16">
        {row.hexes.map((hex, i) => {
          const best = bestTextColorOn(hex);

          return (
            <button
              key={`${hex}-${i}`}
              type="button"
              className="group relative flex-1 overflow-hidden text-left"
              style={{ backgroundColor: hex }}
              onClick={async () => {
                await copyToClipboard(hex);
                setCopiedValue(`Hex copied: ${hex.toUpperCase()}`);
                window.setTimeout(() => setCopiedValue(null), 1500);
              }}
              aria-label={`Copy hex ${hex}`}
              title={hex.toUpperCase()}
            >
              <span className="sr-only">{`Copy ${hex}`}</span>
              <span
                className="pointer-events-none absolute inset-0 flex items-center justify-center px-1 font-mono font-semibold text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: best.textHex }}
              >
                {hex.replace("#", "").toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => void onCopyCssVars()}
          aria-label="Copy CSS variables"
          title="Copy CSS variables"
        >
          <Copy className="size-4" aria-hidden />
          Copy CSS vars
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
          onClick={() => void onShare()}
          aria-label="Copy share link"
          title="Copy share link"
        >
          <Share2 className="size-4" aria-hidden />
          Share link
        </Button>
      </div>

      {copiedValue ? (
        <div className="px-3 pb-3 text-[11px] text-muted-foreground">
          {copiedValue}
        </div>
      ) : null}
    </div>
  );
}
