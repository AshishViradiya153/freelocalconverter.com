"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TestimonialEntry {
  name: string;
  role: string;
  quote: string;
  bg: string;
}

const testimonials: TestimonialEntry[] = [
  {
    name: "Harsh Boghani",
    role: "User",
    quote:
      '"it was great experience, considering everything happens locally makes it even more impressive. W work."',
    bg: "#6b8a7a",
  },
  {
    name: "Harsh Bhat",
    role: "User",
    quote:
      '"damn good ui 🚀"',
    bg: "#8c6b7c",
  },
  {
    name: "Maulik Dhameliya",
    role: "User",
    quote: '"very well executed and tones of free tools with privacy first"',
    bg: "#5c7a8c",
  },
  {
    name: "Kahan Anghan",
    role: "User",
    quote:
      '"that mesh gradient feature here is top notch, i have never seen mesh gradient like this anywhere else ever"',
    bg: "#d4956a",
  },
];

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function Testimonial() {
  const total = testimonials.length;
  const [current, setCurrent] = React.useState(0);

  const cardSet = React.useMemo(() => {
    if (total === 0) return [];
    
    const displayCount = Math.min(total, 7);
    const start = -Math.floor((displayCount - 1) / 2);
    const dynamicOffsets = Array.from({ length: displayCount }).map((_, i) => start + i);

    return dynamicOffsets.map((offset) => {
      const idx = mod(current + offset, total);
      const isActive = offset === 0;

      // Stable pseudo-randomness based on index for a "randomised" organic feel
      const rand = Math.sin((idx + 1) * 88.88); 
      const randLeftOffset = rand * 35; 
      const randRotate = rand * 10;

      const slot = {
        left: `calc(50% - 130px + ${offset * 180 + randLeftOffset}px)`,
        rotate: isActive ? 0 : offset * 3 + randRotate,
        zIndex: 10 - Math.abs(offset),
      };

      return {
        idx,
        offset,
        data: testimonials[idx]!,
        isActive,
        slot,
      };
    });
  }, [current, total]);

  function onShift(nextDirection: "next" | "prev", target?: number) {
    setCurrent((prev) => {
      if (typeof target === "number") return target;
      return nextDirection === "next"
        ? mod(prev + 1, total)
        : mod(prev - 1, total);
    });
  }

  return (
    <section className="w-full overflow-hidden border-border border-b-4 bg-muted/40 py-14 md:py-16">
      <div className="flex w-full flex-col items-center">
        <div className="relative h-[380px] w-full">
          {cardSet.map(({ idx, offset, slot, data, isActive }) => {
            const width = isActive ? 260 : 220;
            const rotate = slot.rotate;
            return (
              <article
                key={idx}
                className={cn(
                  "absolute top-1/2 flex min-h-[270px] cursor-pointer flex-col gap-3 border-[2.5px] px-4 pt-5 pb-4 transition-all duration-500 ease-out",
                  isActive
                    ? "cursor-default"
                    : "hover:z-9 hover:shadow-[6px_12px_28px_rgba(0,0,0,0.22)]",
                )}
                style={{
                  left: slot.left,
                  width,
                  zIndex: slot.zIndex,
                  transform: `translateY(-50%) rotate(${rotate}deg)`,
                  boxShadow: isActive
                    ? "10px 10px 0 #111111"
                    : slot.zIndex >= 4
                      ? "7px 7px 0 #111111"
                      : slot.zIndex === 2
                        ? "5px 5px 0 #111111"
                        : "3px 3px 0 #111111",
                  background: isActive ? "#FFDC3B" : "#ffffff",
                  borderColor: isActive ? "#FFDC3B" : "#111111",
                  clipPath: isActive
                    ? "polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 0 100%)"
                    : undefined,
                }}
                onClick={() => {
                  if (isActive) return;
                  onShift(offset > 0 ? "next" : "prev", idx);
                }}
              >
                {isActive ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-0 right-0 h-10 w-10"
                    style={{
                      background: "#d4b52d",
                      clipPath: "polygon(0 0, 100% 100%, 100% 0)",
                    }}
                  />
                ) : null}
                <div
                  className={cn(
                    "z-1 flex h-14 w-14 shrink-0 items-center justify-center border-2 font-serif font-bold text-[22px] text-white",
                    isActive ? "border-black/30" : "border-black",
                  )}
                  style={{ background: data.bg }}
                >
                  {data.name[0]}
                </div>
                <p
                  className={cn(
                    "z-1 flex-1 text-[13.5px] leading-[1.6] text-foreground",
                    isActive ? "text-[15.5px]" : "",
                  )}
                >
                  {data.quote}
                </p>
                <p
                  className={cn(
                    "z-1 mt-1 text-xs italic",
                    isActive ? "text-black/70" : "text-muted-foreground",
                  )}
                >
                  {`- ${data.name}, ${data.role}`}
                </p>
              </article>
            );
          })}
        </div>
        <div className="mt-8 flex items-center gap-8">
          <button
            type="button"
            className="px-2 py-1 text-3xl leading-none transition-transform hover:scale-125 active:scale-90 disabled:opacity-50"
            onClick={() => onShift("prev")}
            aria-label="Previous testimonial"
          >
            ←
          </button>
          <button
            type="button"
            className="px-2 py-1 text-3xl leading-none transition-transform hover:scale-125 active:scale-90 disabled:opacity-50"
            onClick={() => onShift("next")}
            aria-label="Next testimonial"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
