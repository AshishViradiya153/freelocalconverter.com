"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Position {
  x: number;
  y: number;
}

interface MeshGradientPositionControlProps {
  value: Position;
  onChange: (position: Position) => void;
  width: number;
  height: number;
  label?: string;
  className?: string;
}

export function MeshGradientPositionControl({
  value,
  onChange,
  width,
  height,
  label = "Text position",
  className,
}: MeshGradientPositionControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const GRID_SIZE = 20;

  const aspectRatio = width / height;
  const isWide = aspectRatio > 1;

  const containerStyle = isWide
    ? {
        width: "100%" as const,
        height: `${(1 / aspectRatio) * 100}%`,
        aspectRatio,
      }
    : {
        width: `${aspectRatio * 100}%`,
        height: "100%" as const,
        aspectRatio,
      };

  const absoluteToRelative = useCallback(
    (clientX: number, clientY: number): Position => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };

      const relX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const relY = ((clientY - rect.top) / rect.height) * 2 - 1;

      let newX = Math.max(-1, Math.min(1, relX)) * (width / 2);
      let newY = Math.max(-1, Math.min(1, relY)) * (height / 2);

      if (snapToGrid) {
        const gridStepX = width / 2 / (rect.width / GRID_SIZE);
        const gridStepY = height / 2 / (rect.height / GRID_SIZE);
        newX = Math.round(newX / gridStepX) * gridStepX;
        newY = Math.round(newY / gridStepY) * gridStepY;
      }

      return { x: newX, y: newY };
    },
    [snapToGrid, width, height],
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      onChange(absoluteToRelative(e.clientX, e.clientY));
    };

    const onUp = () => setIsDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, absoluteToRelative, onChange]);

  const handlePosition = {
    left: `${((value.x / (width / 2) + 1) / 2) * 100}%`,
    top: `${((value.y / (height / 2) + 1) / 2) * 100}%`,
  };

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex w-full items-center justify-between gap-2">
        <h4 className="text-muted-foreground text-sm">{label}</h4>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="mesh-snap-grid"
            className="cursor-pointer text-muted-foreground text-xs"
          >
            Snap to grid
          </Label>
          <Checkbox
            id="mesh-snap-grid"
            checked={snapToGrid}
            onCheckedChange={(v) => setSnapToGrid(v === true)}
          />
        </div>
      </div>
      <div
        ref={containerRef}
        className={cn(
          "relative mx-auto flex scale-95 rounded-xl border border-border/60 bg-muted/40 transition-all hover:scale-100 hover:border-border",
          className,
        )}
        onPointerDown={(e) => {
          setIsDragging(true);
          onChange(absoluteToRelative(e.clientX, e.clientY));
        }}
        style={{
          ...containerStyle,
          backgroundImage:
            "radial-gradient(circle at center, hsl(var(--foreground) / 0.12) 1px, transparent 1px)",
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      >
        <div
          className="absolute size-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full bg-primary active:cursor-grabbing"
          style={handlePosition}
        />
      </div>
    </div>
  );
}
