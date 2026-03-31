import type * as React from "react";
import { cn } from "@/lib/utils";

export function BlogProse({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-4 text-muted-foreground text-sm leading-relaxed",
        "[&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:tracking-tight",
        "[&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-base [&_h3]:text-foreground",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-muted-foreground",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:marker:text-muted-foreground",
        "[&_strong]:font-medium [&_strong]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
