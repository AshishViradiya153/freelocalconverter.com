"use client";

import { cn } from "@/lib/utils";

interface AdSlotProps {
  variant: "rail" | "banner";
  className?: string;
}

/**
 * Reserved ad regions (placeholder). Wire a provider in this component when you add ads.
 */
export function AdSlot({ variant, className }: AdSlotProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-border border-dashed bg-muted/30 text-center",
        variant === "rail" && "min-h-[280px] w-full px-2 py-4",
        variant === "banner" && "min-h-[100px] w-full px-2 py-3",
        className,
      )}
      data-ad-variant={variant}
    >
      <span className="text-muted-foreground text-xs">Advertisement (placeholder)</span>
    </div>
  );
}
