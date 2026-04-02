import type {
  ServiceGroup,
  ServiceLink,
} from "@/components/layouts/services-data";

export interface ToolSearchItem extends ServiceLink {
  group: string;
  groupId?: string;
}

export function flattenServiceGroups(groups: ServiceGroup[]): ToolSearchItem[] {
  return groups.flatMap((group) =>
    group.links.map((link) => ({
      ...link,
      group: group.title,
      groupId: group.id,
    })),
  );
}

export function normalizeSearchValue(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

export function isSubsequenceMatch(needle: string, haystack: string) {
  if (!needle) return true;

  let needleIndex = 0;
  for (let i = 0; i < haystack.length; i += 1) {
    if (haystack[i] === needle[needleIndex]) needleIndex += 1;
    if (needleIndex === needle.length) return true;
  }

  return false;
}

/** Where the weakest query token matched: title (0) is best, fuzzy (4) is weakest. */
const TIER_TITLE = 0;
const TIER_DESCRIPTION = 1;
const TIER_GROUP = 2;
const TIER_HREF = 3;
const TIER_FUZZY = 4;

export interface ToolSearchRank {
  score: number;
  matchedInTitle: boolean;
  matchedInDescription: boolean;
  /** Worst per-token tier; lower means matches are stronger (closer to title). 0 = every token hit the title. */
  maxMatchTier: number;
}

function tokenMatchTier(
  token: string,
  label: string,
  description: string,
  group: string,
  href: string,
  searchableText: string,
): number | null {
  if (label.includes(token)) return TIER_TITLE;
  if (description.includes(token)) return TIER_DESCRIPTION;
  if (group.includes(token)) return TIER_GROUP;
  if (href.includes(token)) return TIER_HREF;
  if (isSubsequenceMatch(token, searchableText)) return TIER_FUZZY;
  return null;
}

function computeToolSearchRank(item: ToolSearchItem, query: string): ToolSearchRank {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return {
      score: 0,
      matchedInTitle: false,
      matchedInDescription: false,
      maxMatchTier: 99,
    };
  }

  const label = normalizeSearchValue(item.label);
  const description = normalizeSearchValue(item.description);
  const group = normalizeSearchValue(item.group);
  const href = normalizeSearchValue(item.href);
  const searchableText = `${label} ${description} ${group} ${href}`;
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  if (!queryTokens.length) {
    return {
      score: 0,
      matchedInTitle: false,
      matchedInDescription: false,
      maxMatchTier: 99,
    };
  }

  let score = 0;

  if (label.startsWith(normalizedQuery)) score += 650;
  if (label.includes(normalizedQuery))
    score += 350 - label.indexOf(normalizedQuery);
  if (searchableText.includes(normalizedQuery)) {
    score += 220 - searchableText.indexOf(normalizedQuery);
  }

  const tokenTiers: number[] = [];
  let matchedInTitle = false;
  let matchedInDescription = false;

  for (const token of queryTokens) {
    const tier = tokenMatchTier(token, label, description, group, href, searchableText);
    if (tier === null) {
      return {
        score: 0,
        matchedInTitle: false,
        matchedInDescription: false,
        maxMatchTier: 99,
      };
    }
    tokenTiers.push(tier);
    if (tier === TIER_TITLE) {
      score += 170 - label.indexOf(token);
      matchedInTitle = true;
    } else if (tier === TIER_DESCRIPTION) {
      score += 110 - description.indexOf(token);
      matchedInDescription = true;
    } else if (tier === TIER_GROUP) {
      score += 90 - group.indexOf(token);
    } else if (tier === TIER_HREF) {
      score += 85 - href.indexOf(token);
    } else {
      score += 45;
    }
  }

  if (queryTokens.length > 1) score += 80;

  const maxMatchTier = Math.max(...tokenTiers);
  const normalizedScore = Math.max(score, 0);
  return {
    score: normalizedScore,
    matchedInTitle:
      matchedInTitle || label.includes(normalizedQuery) || label.startsWith(normalizedQuery),
    matchedInDescription:
      matchedInDescription || description.includes(normalizedQuery),
    maxMatchTier,
  };
}

export interface ToolSearchRankedEntry {
  item: ToolSearchItem;
  rank: ToolSearchRank;
}

export function compareToolSearchRankedEntries(
  a: ToolSearchRankedEntry,
  b: ToolSearchRankedEntry,
  options?: { preferInCategory?: (item: ToolSearchItem) => boolean },
): number {
  if (a.rank.maxMatchTier !== b.rank.maxMatchTier) {
    return a.rank.maxMatchTier - b.rank.maxMatchTier;
  }
  if (b.rank.score !== a.rank.score) {
    return b.rank.score - a.rank.score;
  }
  if (options?.preferInCategory) {
    const pa = options.preferInCategory(a.item) ? 1 : 0;
    const pb = options.preferInCategory(b.item) ? 1 : 0;
    if (pb !== pa) return pb - pa;
  }
  return a.item.label.localeCompare(b.item.label);
}

export function getSearchRank(item: ToolSearchItem, query: string): ToolSearchRank {
  return computeToolSearchRank(item, query);
}

export function getSearchScore(item: ToolSearchItem, query: string) {
  return computeToolSearchRank(item, query).score;
}
