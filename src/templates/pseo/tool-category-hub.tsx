import {
  type BreadcrumbNavItem,
  Breadcrumbs,
} from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PseoContentLocaleNotice } from "@/components/seo/pseo-content-locale-notice";
import {
  ToolSectionHeading,
  toolHeroTitleClassName,
} from "@/components/tool-ui";
import { Link } from "@/i18n/navigation";
import type { PseoPageRecord, ToolCategoryDefinition } from "@/lib/pseo/types";
import { hubPathForToolCategory, pseoPathForRecord } from "@/lib/seo/linking";
import { buildAbsoluteUrl } from "@/lib/seo/paths";
import {
  type BreadcrumbItem,
  buildBreadcrumbListJsonLd,
  buildJsonLdGraph,
} from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

interface ToolCategoryHubTemplateProps {
  locale: string;
  category: ToolCategoryDefinition;
  tools: PseoPageRecord[];
  breadcrumbNav: BreadcrumbNavItem[];
  schemaBreadcrumbs: BreadcrumbItem[];
  badgeToolsHub: string;
  pagesInCategoryHub: string;
}

export function ToolCategoryHubTemplate({
  locale,
  category,
  tools,
  breadcrumbNav,
  schemaBreadcrumbs,
  badgeToolsHub,
  pagesInCategoryHub,
}: ToolCategoryHubTemplateProps) {
  const hubPath = hubPathForToolCategory(category.slug);
  const hubUrl = buildAbsoluteUrl(locale, hubPath);

  const breadcrumbJson = buildBreadcrumbListJsonLd(schemaBreadcrumbs);

  const graph = buildJsonLdGraph([
    breadcrumbJson as unknown as Record<string, unknown>,
    {
      "@type": "CollectionPage",
      name: category.title,
      description: category.description,
      url: hubUrl,
    },
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <div className="container max-w-3xl py-10 pb-20">
        <Breadcrumbs items={breadcrumbNav} />
        <div className="mt-4">
          <PseoContentLocaleNotice locale={locale} />
        </div>
        <header className="mt-8 border-border border-b pb-8">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {badgeToolsHub}
          </p>
          <h1 className={cn(toolHeroTitleClassName, "mt-2")}>
            {category.title}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
            {category.description}
          </p>
        </header>

        <div className="mt-10 space-y-4 text-muted-foreground text-sm leading-relaxed">
          {category.hubIntro.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        <section className="mt-12" aria-labelledby="tools-in-category-heading">
          <ToolSectionHeading id="tools-in-category-heading">
            {pagesInCategoryHub}
          </ToolSectionHeading>
          <ul className="mt-6 flex flex-col gap-6">
            {tools.map((tool) => (
              <li key={tool.id}>
                <article>
                  <Link
                    href={pseoPathForRecord(tool)}
                    className="group block rounded-lg border border-transparent outline-none transition-colors hover:border-border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <div className="rounded-lg px-1 py-2 sm:px-2">
                      <h3 className="font-semibold text-base text-foreground tracking-tight group-hover:underline">
                        {tool.heroHeading}
                      </h3>
                      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                        {tool.metaDescription}
                      </p>
                    </div>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
