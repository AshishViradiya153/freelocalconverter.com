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
    name: "Aarav",
    role: "Data Analyst at OrbitOps",
    quote:
      '"FreeLocalConverter replaced three separate tools for our CSV and JSON cleanup workflows. It is fast, clear, and genuinely useful every day."',
    bg: "#8b6e5a",
  },
  {
    name: "Maya",
    role: "Operations Lead at Finch Labs",
    quote:
      '"The local-first approach was the reason we switched. We can process sensitive files in-browser without sending them to random servers."',
    bg: "#7a5c6e",
  },
  {
    name: "Leo",
    role: "Product Manager at Northstar",
    quote:
      '"Our team adopted FreeLocalConverter in one afternoon. The tools are simple enough for non-technical teammates and powerful enough for engineers."',
    bg: "#c47c72",
  },
  {
    name: "Sara",
    role: "Compliance Specialist at Redwood Health",
    quote:
      '"Privacy messaging is not just marketing here. The workflows we use run on the client, which makes internal approvals much easier."',
    bg: "#5c7a8c",
  },
  {
    name: "Noah",
    role: "Growth Engineer at PixelMint",
    quote:
      '"From PDF and image helpers to developer utilities, FreeLocalConverter feels like a complete toolbox instead of a single-purpose app."',
    bg: "#d4956a",
  },
  {
    name: "Elena",
    role: "Localization Manager at LinguaForge",
    quote:
      '"We serve users in multiple regions, so the multilingual support matters a lot. The interface feels thoughtfully built for a global audience."',
    bg: "#7a7a88",
  },
];

const slots = [
  { className: "sn3", left: "calc(50% - 680px)", rotate: -9, zIndex: 1 },
  { className: "sn2", left: "calc(50% - 490px)", rotate: -6, zIndex: 2 },
  { className: "sn1", left: "calc(50% - 305px)", rotate: -3, zIndex: 4 },
  { className: "s0", left: "calc(50% - 130px)", rotate: 0, zIndex: 10 },
  { className: "s1", left: "calc(50% + 20px)", rotate: 3, zIndex: 4 },
  { className: "s2", left: "calc(50% + 210px)", rotate: 6, zIndex: 2 },
  { className: "s3", left: "calc(50% + 400px)", rotate: 9, zIndex: 1 },
] as const;

const offsets = [-3, -2, -1, 0, 1, 2, 3] as const;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function Testimonial() {
  const total = testimonials.length;
  const [current, setCurrent] = React.useState(2);

  const cardSet = React.useMemo(
    () =>
      offsets.map((offset, i) => {
        const idx = mod(current + offset, total);
        return {
          idx,
          offset,
          slot: slots[i],
          data: testimonials[idx],
          isActive: offset === 0,
        };
      }),
    [current, total],
  );

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
                key={`${slot.className}-${idx}-${current}`}
                className={cn(
                  "absolute top-1/2 flex min-h-[270px] cursor-pointer flex-col gap-3 border-[2.5px] px-4 pt-5 pb-4",
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
