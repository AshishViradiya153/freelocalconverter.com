"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ActiveLinkProps extends React.ComponentProps<typeof Link> {
  /** Use `nested` so `/blog` stays active on `/blog/[slug]` (pathname prefix). */
  match?: "exact" | "nested";
}

export function ActiveLink({
  href,
  className,
  match = "exact",
  ...props
}: ActiveLinkProps) {
  const pathname = usePathname();
  const path = typeof href === "string" ? href : "";

  const isActive =
    match === "nested" && path !== "" && path !== "/"
      ? pathname === path || pathname.startsWith(`${path}/`)
      : pathname === path || (path === "/" && pathname === "/");

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link
        data-state={isActive ? "active" : "inactive"}
        href={href}
        className={cn(
          "font-normal text-foreground/60 data-[state=active]:text-accent-foreground",
          className,
        )}
        {...props}
      />
    </Button>
  );
}
