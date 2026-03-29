import type { ImageConvertPair } from "@/lib/image/image-convert-pairs";
import { imageConvertPairTitle } from "@/lib/image/image-convert-pairs";
import { Link } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface RelatedImageConvertPairsProps {
  locale: string;
  pairs: ImageConvertPair[];
  title: string;
  className?: string;
}

export function RelatedImageConvertPairs({
  locale,
  pairs,
  title,
  className,
}: RelatedImageConvertPairsProps) {
  if (pairs.length === 0) return null;

  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-muted/20 p-6",
        className,
      )}
      aria-labelledby="related-image-convert-heading"
    >
      <h2
        id="related-image-convert-heading"
        className="font-semibold text-base text-foreground tracking-tight"
      >
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {pairs.map((p) => (
          <li key={p.pairSlug}>
            <Link
              href={`/image-convert/${p.pairSlug}`}
              className="font-medium text-primary text-sm underline-offset-4 hover:underline"
            >
              {imageConvertPairTitle(safeLocale, p.from, p.to)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
