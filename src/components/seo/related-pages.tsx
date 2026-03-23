import { Link } from "@/i18n/navigation";
import type { PseoPageRecord } from "@/lib/pseo/types";
import { pseoPathForRecord } from "@/lib/seo/linking";
import { cn } from "@/lib/utils";

interface RelatedPagesProps {
  title: string;
  pages: PseoPageRecord[];
  className?: string;
}

export function RelatedPages({ title, pages, className }: RelatedPagesProps) {
  if (pages.length === 0) return null;

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-muted/20 p-6",
        className,
      )}
      aria-labelledby="related-pages-heading"
    >
      <h2
        id="related-pages-heading"
        className="font-semibold text-base text-foreground tracking-tight"
      >
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {pages.map((p) => (
          <li key={p.id}>
            <Link
              href={pseoPathForRecord(p)}
              className="font-medium text-primary text-sm underline-offset-4 hover:underline"
            >
              {p.heroHeading}
            </Link>
            <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
              {p.metaDescription.slice(0, 140)}
              {p.metaDescription.length > 140 ? "…" : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
