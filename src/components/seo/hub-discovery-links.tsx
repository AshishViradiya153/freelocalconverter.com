import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { toolsHubPath } from "@/lib/seo/linking";
import { cn } from "@/lib/utils";

interface HubDiscoveryLinksProps {
  locale: string;
  className?: string;
}

/**
 * Internal links to primary hubs (tools, guides, blog) for gallery and utility pages.
 */
export async function HubDiscoveryLinks({
  locale,
  className,
}: HubDiscoveryLinksProps) {
  const pseo = await getTranslations({ locale, namespace: "pseo" });
  const blog = await getTranslations({ locale, namespace: "blog" });

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm",
        className,
      )}
    >
      <span>{pseo("hubDiscoveryIntro")}</span>
      <Link
        href={toolsHubPath()}
        className="text-primary underline-offset-4 hover:underline"
      >
        {pseo("crumbTools")}
      </Link>
      <span className="text-border" aria-hidden>
        ·
      </span>
      <Link
        href="/guides"
        className="text-primary underline-offset-4 hover:underline"
      >
        {pseo("crumbGuides")}
      </Link>
      <span className="text-border" aria-hidden>
        ·
      </span>
      <Link
        href="/blog"
        className="text-primary underline-offset-4 hover:underline"
      >
        {blog("label")}
      </Link>
    </p>
  );
}
