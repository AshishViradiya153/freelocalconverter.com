import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface BreadcrumbNavItem {
  name: string;
  /** Pathname for `Link` (no locale prefix). Omit on the current page crumb. */
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbNavItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("text-muted-foreground text-sm", className)}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-2">
              {i > 0 ? (
                <span className="text-border" aria-hidden>
                  /
                </span>
              ) : null}
              {isLast || item.href === undefined ? (
                <span className="text-foreground/80">{item.name}</span>
              ) : (
                <Link
                  href={item.href}
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
