"use client";

import { Download } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { paintMeshGradientFrame } from "@/lib/mesh-gradient/paint-mesh-frame";
import type { TrendingMeshGradientItem } from "@/lib/mesh-gradient/trending-mesh-types";
import { cn } from "@/lib/utils";

import "context-filter-polyfill";

const PREVIEW_W = 400;
const PREVIEW_H = 225;

const MESH_EXPORT_WIDTH = 1920;
const MESH_EXPORT_HEIGHT = 1080;

interface MeshGradientTrendingCardProps {
  item: TrendingMeshGradientItem;
  openLabel: string;
  downloadLabel: string;
}

export function MeshGradientTrendingCard({
  item,
  openLabel,
  downloadLabel,
}: MeshGradientTrendingCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true);
      },
      { rootMargin: "160px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    const c = canvasRef.current;
    if (!c) return;
    if (!scratchRef.current) {
      scratchRef.current = document.createElement("canvas");
    }
    paintMeshGradientFrame(c, scratchRef.current, item, {
      width: PREVIEW_W,
      height: PREVIEW_H,
    });
  }, [visible, item]);

  function onDownloadPng(e: ReactMouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!scratchRef.current) {
      scratchRef.current = document.createElement("canvas");
    }
    const out = document.createElement("canvas");
    paintMeshGradientFrame(out, scratchRef.current, item, {
      width: MESH_EXPORT_WIDTH,
      height: MESH_EXPORT_HEIGHT,
    });
    const url = out.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `mesh-gradient-${item.id}-${MESH_EXPORT_WIDTH}x${MESH_EXPORT_HEIGHT}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Download started");
  }

  return (
    <div ref={wrapRef} className="min-w-0">
      <div
        className={cn(
          "group flex flex-col gap-2 rounded-xl border border-border/60 bg-card/40 p-2 transition-colors",
          "hover:border-border hover:bg-card/80",
        )}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted/30 ring-1 ring-border/40">
          <canvas
            ref={canvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            className="h-full w-full object-cover"
            aria-hidden
          />
          <Link
            href={`/gradient-generator?mesh=${item.id}`}
            aria-label={`${openLabel}: ${item.name}`}
            className="absolute inset-0 z-0"
          />
          <div className="pointer-events-none absolute inset-0 flex justify-end p-1.5">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="pointer-events-auto z-10 size-8 shrink-0 bg-background/85 shadow-sm backdrop-blur-sm"
              aria-label={downloadLabel}
              title={downloadLabel}
              onClick={onDownloadPng}
            >
              <Download className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
        <Link
          href={`/gradient-generator?mesh=${item.id}`}
          className="truncate px-0.5 font-medium text-foreground text-sm group-hover:underline"
        >
          {item.name}
        </Link>
      </div>
    </div>
  );
}
