import * as React from "react";

import { cn } from "@/lib/utils";

export function BlogPageFrame({
  header,
  children,
  className,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-4 border-border bg-background shadow-brutal-sm",
        className,
      )}
    >
      {header}
      <div className="p-4 sm:p-6 md:p-8">{children}</div>
    </div>
  );
}

