"use client";

import {
  Copy,
  Download,
  Lock,
  Maximize2,
  Palette,
  Shuffle,
  Unlock,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  createLinearGradientExportCanvas,
  downloadCanvasPng,
} from "@/lib/canvas-png-export";
import {
  buildCssLinearGradient,
  clamp,
  type GradientStop,
  generateGradientFromBase,
  normalizeAngle,
  PRESET_TRENDING_GRADIENTS,
} from "@/lib/color-gradients";
import {
  bestTextColorOn,
  contrastRatio,
  type HarmonyMode,
  hslToRgb,
  normalizeHex,
  rgbToHex,
  wcagContrastBadge,
} from "@/lib/color-palette";
import { downloadTextFile } from "@/lib/download-text-file";
import { cn } from "@/lib/utils";

type Swatch = GradientStop;

function stripHex(hex: string) {
  return hex.replace(/^#/, "").toUpperCase();
}

function randomHex(): string {
  const h = Math.random() * 360;
  const s = 0.55 + Math.random() * 0.35;
  const l = 0.28 + Math.random() * 0.44;
  return rgbToHex(hslToRgb({ h, s, l }));
}

export function ColorGradientApp() {
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
    return Number.isFinite(n) ? clamp(n, 3, 10) : 5;
  }, [searchParams]);

  const initialAngle = React.useMemo(() => {
    const raw = searchParams.get("angle");
    const n = raw ? Number.parseFloat(raw) : 120;
    return Number.isFinite(n) ? normalizeAngle(n) : 120;
  }, [searchParams]);

  const initialBaseHex = React.useMemo(() => {
    const raw = searchParams.get("base") ?? "#0ea5e9";
    return normalizeHex(raw) ?? "#0ea5e9";
  }, [searchParams]);

  const initialSatMul = React.useMemo(() => {
    const raw = searchParams.get("sat");
    const n = raw ? Number.parseFloat(raw) : 1;
    return Number.isFinite(n) ? clamp(n, 0.5, 1.5) : 1;
  }, [searchParams]);

  const initialLightMul = React.useMemo(() => {
    const raw = searchParams.get("light");
    const n = raw ? Number.parseFloat(raw) : 1;
    return Number.isFinite(n) ? clamp(n, 0.6, 1.4) : 1;
  }, [searchParams]);

  const [mode, setMode] = React.useState<HarmonyMode>(initialMode);
  const [count, setCount] = React.useState(initialCount);
  const [angle, setAngle] = React.useState(initialAngle);
  const [saturationMul, setSaturationMul] = React.useState(initialSatMul);
  const [lightnessMul, setLightnessMul] = React.useState(initialLightMul);

  const [hexInput, setHexInput] = React.useState(initialBaseHex);
  const [baseHex, setBaseHex] = React.useState(initialBaseHex);

  const [stops, setStops] = React.useState<Swatch[]>(() => {
    const spec = generateGradientFromBase({
      baseHex: initialBaseHex,
      mode: initialMode,
      stopsCount: initialCount,
      saturationMul: initialSatMul,
      lightnessMul: initialLightMul,
      angle: initialAngle,
    });
    return spec.stops.map((hex) => ({ hex, locked: false }));
  });

  const [fullscreenOpen, setFullscreenOpen] = React.useState(false);
  const [fullscreenView, setFullscreenView] = React.useState<
    "plate" | "gradient"
  >("plate");

  React.useEffect(() => {
    setFullscreenOpen(false);
    setFullscreenView("plate");

    setMode(initialMode);
    setCount(initialCount);
    setAngle(initialAngle);
    setSaturationMul(initialSatMul);
    setLightnessMul(initialLightMul);
    setHexInput(initialBaseHex);
    setBaseHex(initialBaseHex);

    const spec = generateGradientFromBase({
      baseHex: initialBaseHex,
      mode: initialMode,
      stopsCount: initialCount,
      saturationMul: initialSatMul,
      lightnessMul: initialLightMul,
      angle: initialAngle,
    });
    setStops(spec.stops.map((hex) => ({ hex, locked: false })));
  }, [
    initialAngle,
    initialBaseHex,
    initialCount,
    initialLightMul,
    initialMode,
    initialSatMul,
  ]);

  const hexStops = React.useMemo(() => stops.map((s) => s.hex), [stops]);
  const cssGradient = React.useMemo(
    () => buildCssLinearGradient(angle, hexStops),
    [angle, hexStops],
  );

  function regenerateStops(nextParams: {
    baseHex: string;
    mode: HarmonyMode;
    count: number;
    saturationMul: number;
    lightnessMul: number;
    angle: number;
  }) {
    setStops((prev) => {
      const spec = generateGradientFromBase({
        baseHex: nextParams.baseHex,
        mode: nextParams.mode,
        stopsCount: nextParams.count,
        saturationMul: nextParams.saturationMul,
        lightnessMul: nextParams.lightnessMul,
        angle: nextParams.angle,
      });

      const locks = prev.map((s) => s.locked);
      const nextUnlocked = spec.stops;
      const next: Swatch[] = Array.from(
        { length: nextParams.count },
        (_, i) => {
          const locked = Boolean(locks[i]);
          const fromPrev = prev[i]?.hex;
          const nextHex = nextUnlocked[i] ?? fromPrev ?? "#000000";
          return { hex: locked ? (fromPrev ?? nextHex) : nextHex, locked };
        },
      );
      return next;
    });
  }

  function applyBaseHex(next: string) {
    const normalized = normalizeHex(next);
    if (!normalized) return;
    setHexInput(next);
    setBaseHex(normalized);
    regenerateStops({
      baseHex: normalized,
      mode,
      count,
      saturationMul,
      lightnessMul,
      angle,
    });
  }

  function applyMode(next: HarmonyMode) {
    setMode(next);
    regenerateStops({
      baseHex,
      mode: next,
      count,
      saturationMul,
      lightnessMul,
      angle,
    });
  }

  function applyCount(nextCount: number) {
    const n = clamp(nextCount, 3, 10);
    setCount(n);
    regenerateStops({
      baseHex,
      mode,
      count: n,
      saturationMul,
      lightnessMul,
      angle,
    });
  }

  function applySliders(nextSat: number, nextLight: number) {
    setSaturationMul(nextSat);
    setLightnessMul(nextLight);
    regenerateStops({
      baseHex,
      mode,
      count,
      saturationMul: nextSat,
      lightnessMul: nextLight,
      angle,
    });
  }

  function onToggleLock(i: number) {
    setStops((prev) =>
      prev.map((s, ix) => (ix === i ? { ...s, locked: !s.locked } : s)),
    );
  }

  const [trendQuery, setTrendQuery] = React.useState("");

  const trendPresets = React.useMemo(() => {
    const q = trendQuery.trim().toLowerCase();
    if (!q) return PRESET_TRENDING_GRADIENTS;
    return PRESET_TRENDING_GRADIENTS.filter((p) => {
      if (p.name.toLowerCase().includes(q)) return true;
      return p.spec.stops.some((h) => h.slice(1).toLowerCase().includes(q));
    });
  }, [trendQuery]);

  function onUsePreset(presetStops: string[], presetAngle: number) {
    setAngle(normalizeAngle(presetAngle));
    const normalized = presetStops
      .map((h) => normalizeHex(h))
      .filter(Boolean) as string[];
    const first = normalized[0] ?? baseHex;
    setCount(normalized.length);
    setBaseHex(first);
    setHexInput(first);
    setStops(normalized.map((hex) => ({ hex, locked: false })));
  }

  function onCopyCssGradient() {
    void navigator.clipboard
      .writeText(cssGradient)
      .then(() => toast.success("Copied CSS gradient"))
      .catch(() => toast.error("Copy failed"));
  }

  function onCopyShareLink() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("base", baseHex);
      url.searchParams.set("mode", mode);
      url.searchParams.set("count", String(count));
      url.searchParams.set("angle", String(angle));
      url.searchParams.set("sat", String(saturationMul));
      url.searchParams.set("light", String(lightnessMul));
      void navigator.clipboard
        .writeText(url.toString())
        .then(() => toast.success("Share link copied"))
        .catch(() => toast.error("Copy failed"));
    } catch {
      toast.error("Copy failed");
    }
  }

  const gradientJson = React.useMemo(() => {
    return JSON.stringify(
      {
        base: baseHex,
        mode,
        angle,
        colors: hexStops,
      },
      null,
      2,
    );
  }, [baseHex, mode, angle, hexStops]);

  function onDownloadJson() {
    const safeBase = baseHex.replace("#", "");
    const fileName = `gradient-${hexStops.length}-${safeBase}-${Math.round(angle)}.json`;
    downloadTextFile(gradientJson, fileName, "application/json;charset=utf-8");
    toast.success("Download started");
  }

  function onDownloadCss() {
    const safeBase = baseHex.replace("#", "");
    const fileName = `gradient-${hexStops.length}-${safeBase}-${Math.round(angle)}.css`;
    const cssVars = hexStops
      .map((h, i) => `  --color-${i + 1}: ${h};`)
      .join("\n");
    const css = `:root {\n${cssVars}\n  --gradient: ${cssGradient};\n}\n`;
    downloadTextFile(css, fileName, "text/css;charset=utf-8");
    toast.success("Download started");
  }

  function onDownloadPng() {
    const canvas = createLinearGradientExportCanvas({
      angleDeg: angle,
      hexStops,
    });
    const safeBase = stripHex(baseHex);
    const fileName = `gradient-${hexStops.length}-${safeBase}-${Math.round(angle)}.png`;
    downloadCanvasPng(canvas, fileName);
    toast.success("Download started");
  }

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Palette className="size-8 text-muted-foreground" aria-hidden />
          <h1 className={toolHeroTitleClassName}>Gradients (Trending)</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
          Generate gradients from a base color, lock stops, then copy or export
          CSS/PNG/JSON with quick contrast guidance per stop.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="flex flex-col gap-4">
          <div
            role="img"
            className="h-[220px] w-full rounded-xl border"
            style={{ background: cssGradient }}
            aria-label="Gradient preview"
          />

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[180px] flex-col gap-2">
              <span className="font-medium text-muted-foreground text-xs">
                Base
              </span>
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
              <span className="font-medium text-muted-foreground text-xs">
                Harmony
              </span>
              <Select
                value={mode}
                onValueChange={(v) => applyMode(v as HarmonyMode)}
              >
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
              <span className="font-medium text-muted-foreground text-xs">
                Stops
              </span>
              <div className="w-[220px]">
                <Slider
                  value={[count]}
                  min={3}
                  max={10}
                  step={1}
                  onValueChange={(v) => applyCount(v[0] ?? 5)}
                />
                <div className="mt-1 flex justify-between text-muted-foreground text-xs">
                  <span>3</span>
                  <span className="font-medium text-foreground">{count}</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-muted-foreground text-xs">
                Angle
              </span>
              <div className="w-[220px]">
                <Slider
                  value={[angle]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(v) => setAngle(normalizeAngle(v[0] ?? angle))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-muted-foreground text-xs">
                Vibrance
              </span>
              <div className="w-[220px]">
                <Slider
                  value={[saturationMul]}
                  min={0.6}
                  max={1.3}
                  step={0.01}
                  onValueChange={(v) => applySliders(v[0] ?? 1, lightnessMul)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium text-muted-foreground text-xs">
                Lightness
              </span>
              <div className="w-[220px]">
                <Slider
                  value={[lightnessMul]}
                  min={0.7}
                  max={1.2}
                  step={0.01}
                  onValueChange={(v) => applySliders(saturationMul, v[0] ?? 1)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const nextBase = randomHex();
                  applyBaseHex(nextBase);
                  toast.success("Viewing variations");
                }}
              >
                <Shuffle className="size-4" aria-hidden />
                View variations
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCopyCssGradient}
              >
                <Copy className="size-4" aria-hidden />
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
            <Button type="button" variant="secondary" onClick={onCopyShareLink}>
              <Copy className="size-4" aria-hidden />
              Share
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {stops.map((s, i) => {
              const best = bestTextColorOn(s.hex);
              const badge = wcagContrastBadge(best.ratio);
              const ratioOnWhite = contrastRatio(s.hex, "#ffffff");
              const ratioOnBlack = contrastRatio(s.hex, "#000000");
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

                  <div className="absolute top-2 left-2">
                    <button
                      type="button"
                      onClick={() => onToggleLock(i)}
                      className="rounded-md bg-black/30 p-1 text-white outline-none ring-0 hover:bg-black/40 focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={s.locked ? "Unlock stop" : "Lock stop"}
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
                        <div className="font-medium text-muted-foreground text-xs">
                          Stop {i + 1}
                        </div>
                        <div
                          className="font-mono text-sm"
                          style={{ color: best.textHex }}
                        >
                          {s.hex.toUpperCase()}
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">
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
                        onClick={() => {
                          void navigator.clipboard
                            .writeText(s.hex)
                            .then(() =>
                              toast.success(`Copied ${s.hex.toUpperCase()}`),
                            )
                            .catch(() => toast.error("Copy failed"));
                        }}
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
            <span className="font-medium text-muted-foreground text-xs">
              Trending gradients
            </span>
            <Input
              value={trendQuery}
              onChange={(e) => setTrendQuery(e.target.value)}
              placeholder="Search by name or hex"
              aria-label="Search trending gradients"
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
                  onClick={() => onUsePreset(p.spec.stops, p.spec.angle)}
                  className="group w-full rounded-lg border bg-background/50 p-3 text-left transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-sm">
                        {p.name}
                      </div>
                      <div className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                        {p.description}
                      </div>
                    </div>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {p.spec.stops.length} stops
                    </span>
                  </div>

                  <div
                    role="img"
                    className="relative mt-3 h-20 w-full overflow-hidden rounded-md border"
                    style={{
                      background: buildCssLinearGradient(
                        p.spec.angle,
                        p.spec.stops,
                      ),
                    }}
                    aria-label={`Trending gradient preview ${p.name}`}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute inset-0 flex flex-wrap items-center justify-center gap-1 p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      {p.spec.stops.map((hex, i) => (
                        <span
                          key={`${hex}-${i}`}
                          className="rounded border border-white/15 bg-black/35 px-1 py-[2px] font-mono text-[10px] text-white"
                        >
                          {stripHex(hex)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-muted-foreground text-xs">
                    <span className="font-medium text-foreground">Use</span>
                    <span className="ml-auto font-mono">
                      {stripHex(p.spec.stops[0] ?? "#000000")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <Dialog
          open={fullscreenOpen}
          onOpenChange={(open) => {
            setFullscreenOpen(open);
            if (open) setFullscreenView("plate");
          }}
        >
          <DialogContent className="inset-0 top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none sm:max-w-none">
            <DialogTitle className="sr-only">
              Visualize colors (fullscreen)
            </DialogTitle>
            <div className="relative h-screen w-screen">
              {fullscreenView === "plate" ? (
                <div
                  className="h-screen w-screen"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))`,
                  }}
                >
                  {stops.map((s, i) => (
                    <div
                      key={`${s.hex}-${i}`}
                      role="group"
                      className="group relative h-full w-full overflow-hidden"
                      style={{ backgroundColor: s.hex }}
                      aria-label={`Gradient stop ${i + 1}: ${s.hex}`}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />

                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                        <div className="font-mono font-semibold text-lg text-white drop-shadow">
                          {s.hex.toUpperCase()}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            void navigator.clipboard
                              .writeText(s.hex)
                              .then(() =>
                                toast.success(`Copied ${s.hex.toUpperCase()}`),
                              )
                              .catch(() => toast.error("Copy failed"));
                          }}
                        >
                          <Copy className="size-4" aria-hidden />
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  role="region"
                  className="absolute inset-0"
                  style={{
                    background: cssGradient,
                  }}
                  aria-label="Gradient view"
                >
                  <div className="absolute inset-0 bg-black/15" />
                  <div className="absolute top-12 left-1/2 w-[min(520px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border bg-background/70 p-4 backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm leading-tight">
                          Gradient
                        </div>
                        <div className="mt-1 font-mono text-muted-foreground text-xs">
                          {stops.length} stops · {Math.round(angle)}deg
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onCopyCssGradient}
                      >
                        <Copy className="size-4" aria-hidden />
                        Copy CSS
                      </Button>
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-24 flex justify-center gap-2 px-4">
                    {stops.map((s, i) => (
                      <div
                        key={`${s.hex}-${i}`}
                        role="img"
                        className="h-10 w-14 rounded-lg border shadow-sm"
                        style={{ backgroundColor: s.hex }}
                        title={s.hex.toUpperCase()}
                        aria-label={`Stop ${i + 1}: ${s.hex}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border bg-background/70 p-1 backdrop-blur">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={fullscreenView === "plate" ? "secondary" : "ghost"}
                    className="h-9 rounded-full px-4"
                    aria-pressed={fullscreenView === "plate"}
                    onClick={() => setFullscreenView("plate")}
                  >
                    Plate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      fullscreenView === "gradient" ? "secondary" : "ghost"
                    }
                    className="h-9 rounded-full px-4"
                    aria-pressed={fullscreenView === "gradient"}
                    onClick={() => setFullscreenView("gradient")}
                  >
                    Gradient
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
