"use client";

import * as React from "react";
import {
  Copy,
  Download,
  Lock,
  Unlock,
  Palette,
  Shuffle,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  bestTextColorOn,
  generatePaletteFromBase,
  hslToRgb,
  normalizeHex,
  rgbToHex,
  type HarmonyMode,
  PRESET_TRENDING_PALETTES,
  contrastRatio,
} from "@/lib/color-palette";
import { Separator } from "@/components/ui/separator";
import { downloadTextFile } from "../../lib/download-text-file";

type Swatch = { hex: string; locked: boolean };

function getContrastBadge(ratio: number): "AAA" | "AA" | "Low" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Low";
}

function randomHex(): string {
  const h = Math.random() * 360;
  const s = 0.55 + Math.random() * 0.35;
  const l = 0.28 + Math.random() * 0.44;
  return rgbToHex(hslToRgb({ h, s, l }));
}

function stripHex(hex: string) {
  return hex.replace(/^#/, "").toUpperCase();
}

function ensureSwatchCount(
  swatches: Swatch[],
  count: number,
): { nextSwatches: Swatch[]; locks: boolean[] } {
  const next: Swatch[] = [];
  const locks = new Array(count).fill(false);
  for (let i = 0; i < count; i++) {
    const existing = swatches[i];
    if (existing) {
      next.push(existing);
      locks[i] = existing.locked;
    } else {
      next.push({ hex: "#000000", locked: false });
    }
  }
  return { nextSwatches: next, locks };
}

function regenerateSwatches(opts: {
  baseHex: string;
  mode: HarmonyMode;
  count: number;
  saturationMul: number;
  lightnessMul: number;
  currentSwatches: Swatch[];
}): Swatch[] {
  const { hexes } = generatePaletteFromBase({
    baseHex: opts.baseHex,
    mode: opts.mode,
    count: opts.count,
    saturation: opts.saturationMul,
    lightness: opts.lightnessMul,
  });

  const { nextSwatches, locks } = ensureSwatchCount(
    opts.currentSwatches,
    opts.count,
  );

  return Array.from({ length: opts.count }, (_, i) => {
    const locked = locks[i] ?? false;
    return {
      hex: locked ? nextSwatches[i]!.hex : hexes[i]!,
      locked,
    };
  });
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

function downloadPalettePng({
  swatches,
  fileName,
}: {
  swatches: Swatch[];
  fileName: string;
}) {
  const pad = 20;
  const swatchW = 190;
  const swatchH = 150;
  const headerH = 68;
  const width = pad * 2 + swatchW * swatches.length;
  const height = pad * 2 + headerH + swatchH;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "600 20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText("Table Color Palette", pad, pad + 26);
  ctx.font = "400 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillStyle = "#9ca3af";
  ctx.fillText(`Colors: ${swatches.length}`, pad, pad + 48);

  for (let i = 0; i < swatches.length; i++) {
    const x = pad + i * swatchW;
    const y = pad + headerH;
    const hex = swatches[i]!.hex;

    // Swatch rect
    ctx.fillStyle = hex;
    ctx.fillRect(x, y, swatchW - 6, swatchH);

    // Outline
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, swatchW - 6, swatchH);

    const best = bestTextColorOn(hex);

    // Hex label
    ctx.fillStyle = best.textHex;
    ctx.font = "700 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace";
    ctx.fillText(hex.toUpperCase(), x + 14, y + 34);

    // Contrast ratio + badge
    const ratio = best.ratio;
    const badge = getContrastBadge(ratio);
    ctx.font = "600 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText(`Contrast: ${ratio.toFixed(2)} (${badge})`, x + 14, y + 64);
  }

  downloadCanvasImage({ canvas, fileName });
}

export function ColorPaletteTrendingApp() {
  const searchParams = useSearchParams();

  const initialMode = React.useMemo<HarmonyMode>(() => {
    const raw = searchParams.get("mode");
    if (!raw) return "analogous";
    const m = raw as HarmonyMode;
    if (
      m !== "analogous" &&
      m !== "complementary" &&
      m !== "triadic" &&
      m !== "tetradic" &&
      m !== "monochrome"
    ) {
      return "analogous";
    }
    return m;
  }, [searchParams]);

  const initialCount = React.useMemo(() => {
    const raw = searchParams.get("count");
    const n = raw ? Number.parseInt(raw, 10) : 5;
    return Number.isFinite(n) ? Math.min(10, Math.max(3, n)) : 5;
  }, [searchParams]);

  const initialBaseHex = React.useMemo(() => {
    const raw = searchParams.get("base") ?? "#0ea5e9";
    return normalizeHex(raw) ?? "#0ea5e9";
  }, [searchParams]);

  const initialSatMul = React.useMemo(() => {
    const raw = searchParams.get("sat");
    const n = raw ? Number.parseFloat(raw) : 1;
    if (!Number.isFinite(n)) return 1;
    return Math.min(1.3, Math.max(0.6, n));
  }, [searchParams]);

  const initialLightMul = React.useMemo(() => {
    const raw = searchParams.get("light");
    const n = raw ? Number.parseFloat(raw) : 1;
    if (!Number.isFinite(n)) return 1;
    return Math.min(1.2, Math.max(0.7, n));
  }, [searchParams]);

  const [mode, setMode] = React.useState<HarmonyMode>(initialMode);
  const [count, setCount] = React.useState(initialCount);
  const [saturationMul, setSaturationMul] = React.useState(initialSatMul);
  const [lightnessMul, setLightnessMul] = React.useState(initialLightMul);

  const [hexInput, setHexInput] = React.useState(initialBaseHex);
  const [baseHex, setBaseHex] = React.useState(initialBaseHex);

  const [swatches, setSwatches] = React.useState<Swatch[]>(() => {
    const { hexes } = generatePaletteFromBase({
      baseHex: initialBaseHex,
      mode: initialMode,
      count: initialCount,
      saturation: initialSatMul,
      lightness: initialLightMul,
    });
    return hexes.map((hex) => ({ hex, locked: false }));
  });

  const initialFullscreenOpen = React.useMemo(() => {
    const raw = searchParams.get("fullscreen");
    return raw === "1" || raw === "true";
  }, [searchParams]);

  const [fullscreenOpen, setFullscreenOpen] = React.useState(
    initialFullscreenOpen,
  );

  const [trendQuery, setTrendQuery] = React.useState("");

  function applyBaseHex(nextHex: string) {
    const normalized = normalizeHex(nextHex);
    setHexInput(nextHex);
    if (!normalized) return;
    setBaseHex(normalized);

    setSwatches((prev) =>
      regenerateSwatches({
        baseHex: normalized,
        mode,
        count,
        saturationMul,
        lightnessMul,
        currentSwatches: prev,
      }),
    );
  }

  function applyMode(nextMode: HarmonyMode) {
    setMode(nextMode);
    setSwatches((prev) =>
      regenerateSwatches({
        baseHex,
        mode: nextMode,
        count,
        saturationMul,
        lightnessMul,
        currentSwatches: prev,
      }),
    );
  }

  function applyCount(nextCount: number) {
    setCount(nextCount);
    setSwatches((prev) =>
      regenerateSwatches({
        baseHex,
        mode,
        count: nextCount,
        saturationMul,
        lightnessMul,
        currentSwatches: prev,
      }),
    );
  }

  function applySliders(nextSaturationMul: number, nextLightnessMul: number) {
    setSaturationMul(nextSaturationMul);
    setLightnessMul(nextLightnessMul);
    setSwatches((prev) =>
      regenerateSwatches({
        baseHex,
        mode,
        count,
        saturationMul: nextSaturationMul,
        lightnessMul: nextLightnessMul,
        currentSwatches: prev,
      }),
    );
  }

  function onLockToggle(index: number) {
    setSwatches((prev) => {
      const next = prev.map((s, i) =>
        i === index ? { ...s, locked: !s.locked } : s,
      );
      return next;
    });
  }

  function onShuffle() {
    const nextBase = randomHex();
    setBaseHex(nextBase);
    setHexInput(nextBase);
    setSwatches((prev) =>
      regenerateSwatches({
        baseHex: nextBase,
        mode,
        count,
        saturationMul,
        lightnessMul,
        currentSwatches: prev,
      }),
    );
  }

  function onUseTrending(presetHexes: string[]) {
    const normalized = presetHexes.map((h) => normalizeHex(h)).filter(Boolean) as string[];
    const withLocks = normalized.map((hex) => ({ hex, locked: false }));
    setCount(withLocks.length);
    setSwatches(withLocks);
    setMode("analogous");
    // Use first swatch as base so regeneration works after clicking again.
    setBaseHex(normalized[0] ?? baseHex);
    setHexInput(normalized[0] ?? hexInput);
  }

  const trendPresets = React.useMemo(() => {
    const q = trendQuery.trim().toLowerCase();
    if (!q) return PRESET_TRENDING_PALETTES;
    return PRESET_TRENDING_PALETTES.filter((p) => {
      if (p.name.toLowerCase().includes(q)) return true;
      return p.hexes.some((h) => h.slice(1).toLowerCase().includes(q));
    });
  }, [trendQuery]);

  const cssVars = React.useMemo(() => {
    const lines = swatches.map((s, i) => `  --color-${i + 1}: ${s.hex};`);
    return `:root {\n${lines.join("\n")}\n}\n`;
  }, [swatches]);

  const paletteJson = React.useMemo(() => {
    return JSON.stringify(
      {
        base: baseHex,
        mode,
        colors: swatches.map((s) => s.hex),
      },
      null,
      2,
    );
  }, [baseHex, mode, swatches]);

  async function onCopyHex(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      toast.success(`Copied ${hex.toUpperCase()}`);
    } catch {
      toast.error("Copy failed");
    }
  }

  async function onCopyCssVars() {
    try {
      await navigator.clipboard.writeText(cssVars);
      toast.success("Copied CSS variables");
    } catch {
      toast.error("Copy failed");
    }
  }

  function onDownloadJson() {
    const fileName = `palette-${swatches.length}-${baseHex.replace("#", "")}.json`;
    downloadTextFile(paletteJson, fileName, "application/json;charset=utf-8");
    toast.success("Download started");
  }

  function onDownloadPng() {
    const safeBase = baseHex.replace("#", "");
    const fileName = `palette-${swatches.length}-${safeBase}.png`;
    downloadPalettePng({ swatches, fileName });
    toast.success("Download started");
  }

  function onDownloadCss() {
    const safeBase = baseHex.replace("#", "");
    const fileName = `palette-${swatches.length}-${safeBase}.css`;
    downloadTextFile(cssVars, fileName, "text/css;charset=utf-8");
    toast.success("Download started");
  }

  async function onShare() {
    try {
      const params = new URLSearchParams();
      params.set("base", baseHex);
      params.set("mode", mode);
      params.set("count", String(count));
      const url = new URL(window.location.href);
      url.search = params.toString();
      await navigator.clipboard.writeText(url.toString());
      toast.success("Share link copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Palette className="size-8 text-muted-foreground" aria-hidden />
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
            Color Palettes (Trending)
          </h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
          Generate beautiful palettes from a base color, lock swatches, and export
          to CSS/PNG/JSON. Includes quick accessibility contrast guidance per color.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[180px] flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">Base</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={normalizeHex(hexInput) ?? baseHex}
                  aria-label="Pick base color"
                  onChange={(e) => applyBaseHex(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border bg-background"
                />
                <Input
                  value={hexInput}
                  aria-label="Base hex"
                  spellCheck={false}
                  className="font-mono text-xs"
                  onChange={(e) => applyBaseHex(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">Harmony</span>
              <Select value={mode} onValueChange={(v) => applyMode(v as HarmonyMode)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Harmony mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analogous">Analogous</SelectItem>
                  <SelectItem value="complementary">Complementary</SelectItem>
                  <SelectItem value="triadic">Triadic</SelectItem>
                  <SelectItem value="tetradic">Tetradic</SelectItem>
                  <SelectItem value="monochrome">Monochrome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">Colors</span>
              <div className="w-[220px]">
                <Slider
                  value={[count]}
                  min={3}
                  max={10}
                  step={1}
                  onValueChange={(v) => applyCount(v[0] ?? 5)}
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>3</span>
                  <span className="font-medium text-foreground">{count}</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                Vibrance
              </span>
              <div className="w-[220px]">
                <Slider
                  value={[saturationMul]}
                  min={0.6}
                  max={1.3}
                  step={0.01}
                  onValueChange={(v) =>
                    applySliders(v[0] ?? 1, lightnessMul)
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                Lightness
              </span>
              <div className="w-[220px]">
                <Slider
                  value={[lightnessMul]}
                  min={0.7}
                  max={1.2}
                  step={0.01}
                  onValueChange={(v) =>
                    applySliders(saturationMul, v[0] ?? 1)
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={onShuffle}>
                <Shuffle className="size-4" aria-hidden />
                View variations
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCopyCssVars}
              >
                <Sparkles className="size-4" aria-hidden />
                Copy CSS
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFullscreenOpen(true)}
            >
              <Maximize2 className="size-4" aria-hidden />
              Visualize colors
            </Button>
            <Button type="button" variant="default" onClick={onDownloadPng}>
              <Download className="size-4" aria-hidden />
              Download PNG
            </Button>
            <Button type="button" variant="outline" onClick={onDownloadJson}>
              <Download className="size-4" aria-hidden />
              Download JSON
            </Button>
            <Button type="button" variant="outline" onClick={onDownloadCss}>
              <Download className="size-4" aria-hidden />
              Download CSS
            </Button>
            <Button type="button" variant="secondary" onClick={onShare}>
              <Copy className="size-4" aria-hidden />
              Share
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {swatches.map((s, i) => {
              const best = bestTextColorOn(s.hex);
              const ratioOnWhite = contrastRatio(s.hex, "#ffffff");
              const ratioOnBlack = contrastRatio(s.hex, "#000000");
              const badge = getContrastBadge(best.ratio);

              return (
                <div
                  key={`${s.hex}-${i}`}
                  className={cn(
                    "relative overflow-hidden rounded-lg border bg-background",
                  )}
                >
                  <div
                    className="h-[120px] w-full"
                    style={{ backgroundColor: s.hex }}
                  />

                  <div className="absolute left-2 top-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onLockToggle(i)}
                      className="rounded-md bg-black/30 p-1 text-white outline-none ring-0 hover:bg-black/40 focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={s.locked ? "Unlock swatch" : "Lock swatch"}
                    >
                      {s.locked ? (
                        <Lock className="size-4" aria-hidden />
                      ) : (
                        <Unlock className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-muted-foreground">
                          Color {i + 1}
                        </div>
                        <div
                          className="font-mono text-sm"
                          style={{ color: best.textHex }}
                        >
                          {s.hex.toUpperCase()}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Text contrast:{" "}
                          <span className="font-medium text-foreground">
                            {best.ratio.toFixed(2)} ({badge})
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          vs white: {ratioOnWhite.toFixed(2)} • vs black:{" "}
                          {ratioOnBlack.toFixed(2)}
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => void onCopyHex(s.hex)}
                      >
                        <Copy className="size-3.5" aria-hidden />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              Trending palettes
            </span>
            <Input
              value={trendQuery}
              onChange={(e) => setTrendQuery(e.target.value)}
              placeholder="Search by name or hex"
              aria-label="Search trending palettes"
              spellCheck={false}
              className="font-mono text-xs"
            />
          </div>

          <div className="overflow-auto rounded-xl border p-3">
            <div className="flex flex-col gap-3">
              {trendPresets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => onUseTrending(p.hexes)}
                  className="w-full rounded-lg border bg-background/50 p-3 text-left transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-sm">{p.name}</div>
                      <div className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                        {p.description}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.hexes.length} colors
                    </span>
                  </div>

                  <div className="mt-3 flex overflow-hidden rounded-md border">
                    {p.hexes.map((hex) => (
                      <div
                        key={hex}
                        className="group relative h-8 w-full"
                        style={{ backgroundColor: hex }}
                        aria-label={`Trending color ${hex}`}
                        title={hex}
                      >
                        <span className="absolute inset-0 flex items-center justify-center p-1 text-[10px] font-mono text-white/95 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          {hex.toUpperCase()}
                        </span>
                        <span className="absolute inset-0 bg-black/25 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Use</span>
                    <span className="truncate">palette</span>
                    <span className="ml-auto font-mono">
                      {stripHex(p.hexes[0] ?? "")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent
          className="top-0 left-0 translate-x-0 translate-y-0 inset-0 h-screen w-screen max-w-none sm:max-w-none overflow-hidden rounded-none border-0 shadow-none p-0 gap-0"
        >
          <DialogTitle className="sr-only">
            Visualize colors (fullscreen)
          </DialogTitle>
          <div
            className="h-screen w-screen"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${swatches.length}, minmax(0, 1fr))`,
            }}
          >
            {swatches.map((s, i) => {
              return (
                <div
                  key={`${s.hex}-${i}`}
                  className="group relative h-full w-full overflow-hidden"
                  style={{ backgroundColor: s.hex }}
                  aria-label={`Palette color ${i + 1}: ${s.hex}`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                    <div className="font-mono text-lg font-semibold text-white drop-shadow">
                      {s.hex.toUpperCase()}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        void onCopyHex(s.hex);
                      }}
                    >
                      <Copy className="size-4" aria-hidden />
                      Copy
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

