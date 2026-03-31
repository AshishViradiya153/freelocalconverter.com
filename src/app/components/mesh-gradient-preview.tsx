"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  AURORA_NOISE_DATA_URL,
  blobBorderRadius,
} from "@/lib/mesh-gradient/aurora-types";
import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { useMeshGradientStore } from "@/stores/mesh-gradient-store";

interface MeshGradientPreviewProps {
  className?: string;
}

export const MeshGradientPreview = forwardRef<
  HTMLDivElement,
  MeshGradientPreviewProps
>(function MeshGradientPreview({ className }, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.5);

  const dragBlobIdRef = useRef<string | null>(null);
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const blobs = useMeshGradientStore((s) => s.blobs);
  const backgroundColor = useMeshGradientStore((s) => s.backgroundColor);
  const blur = useMeshGradientStore((s) => s.blur);
  const noiseOpacity = useMeshGradientStore((s) => s.noiseOpacity);
  const resolution = useMeshGradientStore((s) => s.resolution);
  const selectedBlobId = useMeshGradientStore((s) => s.selectedBlobId);
  const setSelectedBlobId = useMeshGradientStore((s) => s.setSelectedBlobId);
  const updateBlob = useMeshGradientStore((s) => s.updateBlob);

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
  const overlayImageUrl = useMeshGradientStore((s) => s.overlayImageUrl);
  const imagePosition = useMeshGradientStore((s) => s.imagePosition);
  const imageWidthPercent = useMeshGradientStore((s) => s.imageWidthPercent);
  const imageBorderWidth = useMeshGradientStore((s) => s.imageBorderWidth);
  const imageBorderColor = useMeshGradientStore((s) => s.imageBorderColor);
  const imageBorderRadius = useMeshGradientStore((s) => s.imageBorderRadius);
  const imageShadow = useMeshGradientStore((s) => s.imageShadow);

  const setExportRef = useCallback(
    (el: HTMLDivElement | null) => {
      containerRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref != null)
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [ref],
  );

  useEffect(() => {
    const flushPosition = () => {
      rafRef.current = null;
      const id = dragBlobIdRef.current;
      const p = pendingPosRef.current;
      if (id && p) {
        updateBlob(id, { x: p.x, y: p.y });
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragBlobIdRef.current) return;
      const root = containerRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
      );
      const y = Math.max(
        0,
        Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
      );
      pendingPosRef.current = { x, y };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flushPosition);
      }
    };

    const endDrag = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const id = dragBlobIdRef.current;
      const p = pendingPosRef.current;
      if (id && p) {
        updateBlob(id, { x: p.x, y: p.y });
      }
      dragBlobIdRef.current = null;
      pendingPosRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [updateBlob]);

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
        "flex max-h-[min(56vh,520px)] min-h-[280px] w-full items-center justify-center rounded-xl p-4 lg:max-h-[min(56vh,min(520px,calc(100dvh-6rem)))]",
        className,
      )}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: resolution.width * scale,
          height: resolution.height * scale,
        }}
      >
        <div
          ref={setExportRef}
          className="relative isolate overflow-hidden rounded-xl"
          style={{
            width: resolution.width,
            height: resolution.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            backgroundColor,
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("[data-aurora-blob]")) return;
            setSelectedBlobId(null);
          }}
          role="presentation"
        >
          <div
            data-aurora-backdrop
            className="pointer-events-auto absolute inset-[-20%] z-0 h-[140%] w-[140%]"
          >
            {blobs.map((blob, index) => (
              <div
                key={blob.id}
                data-aurora-blob
                className={cn(
                  "absolute cursor-grab touch-none select-none active:cursor-grabbing",
                  selectedBlobId === blob.id &&
                    "ring-4 ring-primary/40 ring-offset-0 shadow-lg",
                )}
                style={{
                  left: `${blob.x}%`,
                  top: `${blob.y}%`,
                  width: `${blob.size}%`,
                  height: `${blob.size}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: blob.opacity,
                  zIndex: blob.zIndex ?? index + 1,
                  borderRadius: blobBorderRadius(blob.shape),
                  backgroundColor: blob.color,
                  filter: blur > 0 ? `blur(${blur}px)` : undefined,
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedBlobId(blob.id);
                  dragBlobIdRef.current = blob.id;
                  pendingPosRef.current = null;
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ))}
          </div>
          {noiseOpacity > 0 ? (
            <div
              className="pointer-events-none absolute inset-0 z-1 mix-blend-overlay"
              style={{
                opacity: noiseOpacity,
                backgroundImage: AURORA_NOISE_DATA_URL,
              }}
            />
          ) : null}

          {overlayImageUrl ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-8">
              <img
                src={overlayImageUrl}
                alt=""
                className="max-h-[95%] object-contain"
                style={{
                  width: `${imageWidthPercent}%`,
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  borderStyle: "solid",
                  borderWidth: `${imageBorderWidth}px`,
                  borderColor: imageBorderColor,
                  borderRadius: `${imageBorderRadius}px`,
                  boxShadow: `${imageShadow.offsetX}px ${imageShadow.offsetY}px ${imageShadow.blur}px ${imageShadow.color}`,
                }}
              />
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center">
            {text.trim() ? (
              <p
                className={cn(
                  "max-w-[92%] transition-[color,transform,opacity] duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)]",
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
});
