"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { MeshGradientCanvas } from "@/app/components/mesh-gradient-canvas";
import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { useMeshGradientStore } from "@/stores/mesh-gradient-store";

interface MeshGradientPreviewProps {
  className?: string;
}

export function MeshGradientPreview({ className }: MeshGradientPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const resolution = useMeshGradientStore((s) => s.resolution);
  const text = useMeshGradientStore((s) => s.text);
  const fontSize = useMeshGradientStore((s) => s.fontSize);
  const fontWeight = useMeshGradientStore((s) => s.fontWeight);
  const letterSpacing = useMeshGradientStore((s) => s.letterSpacing);
  const opacity = useMeshGradientStore((s) => s.opacity);
  const lineHeight = useMeshGradientStore((s) => s.lineHeight);
  const textColor = useMeshGradientStore((s) => s.textColor);
  const isItalic = useMeshGradientStore((s) => s.isItalic);
  const isUnderline = useMeshGradientStore((s) => s.isUnderline);
  const isStrikethrough = useMeshGradientStore((s) => s.isStrikethrough);
  const textShadow = useMeshGradientStore((s) => s.textShadow);
  const textPosition = useMeshGradientStore((s) => s.textPosition);
  const textAlign = useMeshGradientStore((s) => s.textAlign);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const cr = el.getBoundingClientRect();
      const next = Math.min(
        cr.width / resolution.width,
        cr.height / resolution.height,
        1,
      );
      setScale(next > 0 ? next : 0.05);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [resolution.width, resolution.height]);

  const fontPx = fontSize * 16;

  return (
    <div
      ref={wrapRef}
      className={cn(
        "flex max-h-[min(56vh,520px)] min-h-[280px] w-full items-center justify-center rounded-xl bg-muted/30 p-4 lg:max-h-[min(56vh,min(520px,calc(100dvh-6rem)))]",
        className,
      )}
    >
      <div
        className="relative"
        style={{
          width: resolution.width * scale,
          height: resolution.height * scale,
        }}
      >
        <div
          className="relative overflow-hidden rounded-xl ring-1 ring-border/60"
          style={{
            width: resolution.width,
            height: resolution.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <MeshGradientCanvas className="absolute inset-0 size-full max-h-none rounded-none border-0" />
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            {text.trim() ? (
              <p
                className={cn(
                  "transition-[color,transform,opacity] duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)]",
                  fontSans.className,
                )}
                style={{
                  fontSize: `${fontPx}px`,
                  fontWeight,
                  letterSpacing: `${letterSpacing}em`,
                  lineHeight,
                  color: textColor,
                  fontStyle: isItalic ? "italic" : "normal",
                  textDecoration:
                    `${isUnderline ? "underline" : ""} ${isStrikethrough ? "line-through" : ""}`.trim(),
                  textShadow: `${textShadow.offsetX}px ${textShadow.offsetY}px ${textShadow.blur}px ${textShadow.color}`,
                  transform: `translate(${textPosition.x}px, ${textPosition.y}px)`,
                  whiteSpace: "pre-wrap",
                  textAlign,
                  opacity: opacity / 100,
                  maxWidth: "92%",
                }}
              >
                {text}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
