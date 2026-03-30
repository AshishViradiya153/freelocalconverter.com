"use client";

import { layout, prepare, setLocale } from "@chenglou/pretext";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { FOOTER_BRAND_MESH_PRESET } from "@/lib/mesh-gradient/footer-brand-mesh-preset";
import { paintMeshGradientFrame } from "@/lib/mesh-gradient/paint-mesh-frame";
import { cn } from "@/lib/utils";

const MESH_PRESET = FOOTER_BRAND_MESH_PRESET;

function buildCanvasFont(weight: number, sizePx: number, family: string) {
  return `${weight} ${sizePx}px ${family}`;
}

function lineCountFor(
  text: string,
  font: string,
  maxWidth: number,
  lineHeightPx: number,
) {
  return layout(prepare(text, font), maxWidth, lineHeightPx).lineCount;
}

/** Largest font size (px) so Pretext reports a single line at `maxWidth`. */
function maxFontSizeSingleLine(
  text: string,
  weight: number,
  family: string,
  maxWidth: number,
  minPx: number,
  maxPx: number,
): number {
  if (maxWidth <= 0) return minPx;
  const hiCap = Math.max(minPx, maxPx);
  let lo = minPx;
  let hi = hiCap;
  let best = minPx;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    const lineHeightPx = mid * 1.08;
    const font = buildCanvasFont(weight, mid, family);
    const count = lineCountFor(text, font, maxWidth, lineHeightPx);
    if (count <= 1) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  let out = Math.max(minPx, Math.min(hiCap, best));
  for (let s = 0; s < 40; s++) {
    const lh = out * 1.08;
    const font = buildCanvasFont(weight, out, family);
    if (lineCountFor(text, font, maxWidth, lh) <= 1) break;
    out = Math.max(minPx, out - 0.4);
  }
  return out;
}

function useMeshPaintCanvases() {
  const ref = React.useRef<{
    out: HTMLCanvasElement;
    scratch: HTMLCanvasElement;
  } | null>(null);
  if (typeof document !== "undefined" && ref.current === null) {
    ref.current = {
      out: document.createElement("canvas"),
      scratch: document.createElement("canvas"),
    };
  }
  return ref;
}

export function FooterBrandPretextMesh() {
  const locale = useLocale();
  const t = useTranslations("footer");
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const probeRef = React.useRef<HTMLSpanElement>(null);
  const canvasPairRef = useMeshPaintCanvases();

  const [width, setWidth] = React.useState(0);
  const [fontFamily, setFontFamily] = React.useState("monospace");
  const [fontWeight, setFontWeight] = React.useState(900);
  const [meshDataUrl, setMeshDataUrl] = React.useState<string | null>(null);

  const phrase = t("brandStamp");
  const text = phrase.toLocaleUpperCase(locale);

  React.useLayoutEffect(() => {
    setLocale(locale);
  }, [locale]);

  React.useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const style = getComputedStyle(probe);
    setFontFamily(style.fontFamily || "monospace");
    const w = Number.parseInt(style.fontWeight, 10);
    setFontWeight(Number.isFinite(w) ? w : 900);
  }, [locale]);

  React.useLayoutEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    function sync() {
      const next = Math.max(0, Math.floor(node?.getBoundingClientRect().width ?? 0));
      setWidth((prev) => (prev === next ? prev : next));
    }

    const ro = new ResizeObserver(() => sync());
    ro.observe(node);
    sync();
    return () => ro.disconnect();
  }, []);

  const innerWidth = Math.max(0, width - 4);
  const maxPx = Math.min(112, Math.max(28, innerWidth * 0.34));
  const minPx = 13;

  const fontSizePx = React.useMemo(
    () =>
      maxFontSizeSingleLine(
        text,
        fontWeight,
        fontFamily,
        innerWidth,
        minPx,
        maxPx,
      ),
    [fontFamily, fontWeight, innerWidth, maxPx, minPx, text],
  );

  const meshH = Math.max(48, Math.ceil(fontSizePx * 1.45));

  React.useLayoutEffect(() => {
    if (innerWidth <= 0 || fontSizePx <= 0) {
      setMeshDataUrl(null);
      return;
    }
    const pair = canvasPairRef.current;
    if (!pair) return;

    paintMeshGradientFrame(pair.out, pair.scratch, MESH_PRESET, {
      width: Math.max(1, innerWidth),
      height: meshH,
    });
    setMeshDataUrl(pair.out.toDataURL("image/png"));
  }, [fontSizePx, innerWidth, meshH]);

  return (
    <div ref={wrapRef} className="relative w-full min-w-0">
      <span
        ref={probeRef}
        className="pointer-events-none absolute h-0 w-0 overflow-hidden font-black font-mono opacity-0"
        aria-hidden
      >
        M
      </span>

      <div className="flex w-full min-w-0 justify-center overflow-x-auto overflow-y-visible px-1">
        <span
          className={cn(
            "inline-block max-w-full whitespace-nowrap text-center font-black font-mono uppercase leading-none tracking-tighter",
            meshDataUrl ? "bg-clip-text" : "text-brutal-canvas-foreground",
          )}
          style={
            meshDataUrl
              ? {
                  backgroundImage: `url(${meshDataUrl})`,
                  backgroundSize: "100% 100%",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  fontSize: `${fontSizePx}px`,
                }
              : { fontSize: `${fontSizePx}px` }
          }
        >
          {text}
        </span>
      </div>
    </div>
  );
}
