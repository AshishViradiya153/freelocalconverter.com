import { ToolSectionHeading } from "@/components/tool-ui";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface HubLinkItem {
  title: string;
  description: string;
  href: string;
}

interface HubLinksProps {
  title: string;
  items: HubLinkItem[];
  className?: string;
}

export function HubLinks({ title, items, className }: HubLinksProps) {
  if (items.length === 0) return null;

  return (
    <section
      className={cn("mt-12 border-border border-t pt-10", className)}
      aria-labelledby="hub-links-heading"
    >
      <ToolSectionHeading id="hub-links-heading">{title}</ToolSectionHeading>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg border border-transparent px-1 py-2 outline-none transition-colors hover:border-border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-2"
            >
              <span className="font-medium text-foreground text-sm underline-offset-4 group-hover:underline">
                {item.title}
              </span>
              <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                {item.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
