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
import { downloadTextFile } from "@/lib/download-text-file";
import { bestTextColorOn } from "@/lib/color-palette";
import {
  buildCssLinearGradient,
  normalizeAngle,
} from "@/lib/color-gradients";
import type { BestGradientRow } from "@/lib/best-gallery/best-gallery-types";
import { buildLocalizedPath } from "@/lib/seo/paths";

function getContrastBadge(ratio: number): "AAA" | "AA" | "Low" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Low";
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

function downloadCanvasImage({
  canvas,
  fileName,
}: {
  canvas: HTMLCanvasElement;
  fileName: string;
}) {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function paintLinearGradientOnCanvas({
  angleDeg,
  hexStops,
  width,
  height,
  topTitle,
}: {
  angleDeg: number;
  hexStops: string[];
  width: number;
  height: number;
  topTitle: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "600 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(topTitle, 24, 40);

  const pad = 24;
  const gradTop = 64;
  const gradH = height - gradTop - pad;

  // Compute gradient start/end points based on CSS angle degrees.
  const a = normalizeAngle(angleDeg);
  const angleRad = ((a - 90) * Math.PI) / 180;
  const cx = width / 2;
  const cy = gradTop + gradH / 2;
  const len = Math.max(width, gradH) * 1.2;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  const x0 = cx - dx * (len / 2);
  const y0 = cy - dy * (len / 2);
  const x1 = cx + dx * (len / 2);
  const y1 = cy + dy * (len / 2);

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  const n = hexStops.length;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    gradient.addColorStop(t, hexStops[i] ?? "#000000");
  }

  // Gradient rect
  ctx.fillStyle = gradient;
  ctx.fillRect(pad, gradTop, width - pad * 2, gradH);

  // Swatch labels row
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font =
    "600 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace";

  const swatchAreaY = gradTop + gradH + 18;
  const swatchW = Math.floor((width - pad * 2) / Math.max(1, n));

  for (let i = 0; i < n; i++) {
    const hex = (hexStops[i] ?? "#000000").toUpperCase();
    const x = pad + i * swatchW;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x, swatchAreaY, swatchW - 6, 22);
    const best = bestTextColorOn(hex);
    ctx.fillStyle = best.textHex;
    ctx.fillText(hex, x + 6, swatchAreaY + 16);
  }

  return canvas;
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
    const title = `Table · Gradient · ${Math.round(row.angle)}deg`;
    const canvas = paintLinearGradientOnCanvas({
      angleDeg: row.angle,
      hexStops: row.stops,
      width: 1400,
      height: 420,
      topTitle: title,
    });
    const fileName = `gradient-${row.stops.length}-${safeBase}-${Math.round(row.angle)}.png`;
    downloadCanvasImage({ canvas, fileName });
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
          const badge = getContrastBadge(best.ratio);
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

