import type { ServiceLink } from "@/components/layouts/services-data";
import { getLocalizedServiceGroups } from "@/components/layouts/services-data-locale";
import { routing } from "@/i18n/routing";

const EXTRA_APP_TOOL_PATH_TO_GROUP: Record<string, string> = {
  "/data-grid": "viewers",
  "/data-grid-live": "viewers",
  "/data-grid-render": "viewers",
  "/request-converter": "converters",
  "/svg-to-code": "developer",
};

const EXCLUDED_RELATED_DIRECTORY_GROUP_IDS = new Set(["company"]);

export function stripLocaleFromPathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  const head = parts[0];
  if (head && (routing.locales as readonly string[]).includes(head)) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function normalizeAppToolPath(path: string): string {
  if (!path || path === "/") return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === "/image-convert" || p.startsWith("/image-convert/")) {
    return "/image-convert";
  }
  return p;
}

function buildHrefToGroupId(
  groups: ReturnType<typeof getLocalizedServiceGroups>,
): Map<string, string> {
  const m = new Map<string, string>();
  for (const g of groups) {
    for (const link of g.links) {
      m.set(link.href, g.id);
    }
  }
  return m;
}

export interface RelatedAppToolsPick {
  links: ServiceLink[];
  categoryTitle: string | null;
  groupId: string | null;
}

export function pickRelatedAppTools(args: {
  pathname: string;
  locale: string;
  limit?: number;
}): RelatedAppToolsPick {
  const limit = args.limit ?? 8;
  const stripped = stripLocaleFromPathname(args.pathname);
  const normalized = normalizeAppToolPath(stripped);

  const groups = getLocalizedServiceGroups(args.locale);
  const hrefToGroup = buildHrefToGroupId(groups);
  const groupId =
    hrefToGroup.get(normalized) ?? EXTRA_APP_TOOL_PATH_TO_GROUP[normalized];

  if (!groupId || EXCLUDED_RELATED_DIRECTORY_GROUP_IDS.has(groupId)) {
    return { links: [], categoryTitle: null, groupId: null };
  }

  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return { links: [], categoryTitle: null, groupId: null };
  }

  const candidates = group.links.filter((link) => {
    return normalizeAppToolPath(link.href) !== normalized;
  });

  candidates.sort((a, b) =>
    a.label.localeCompare(b.label, args.locale, { sensitivity: "base" }),
  );

  return {
    links: candidates.slice(0, limit),
    categoryTitle: group.title,
    groupId,
  };
}
