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

export interface ToolSearchRank {
  score: number;
  matchedInTitle: boolean;
  matchedInDescription: boolean;
}

function computeToolSearchRank(item: ToolSearchItem, query: string): ToolSearchRank {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return { score: 0, matchedInTitle: false, matchedInDescription: false };
  }

  const label = normalizeSearchValue(item.label);
  const description = normalizeSearchValue(item.description);
  const group = normalizeSearchValue(item.group);
  const href = normalizeSearchValue(item.href);
  const searchableText = `${label} ${description} ${group} ${href}`;
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  if (!queryTokens.length) {
    return { score: 0, matchedInTitle: false, matchedInDescription: false };
  }

  let score = 0;

  if (label.startsWith(normalizedQuery)) score += 650;
  if (label.includes(normalizedQuery))
    score += 350 - label.indexOf(normalizedQuery);
  if (searchableText.includes(normalizedQuery)) {
    score += 220 - searchableText.indexOf(normalizedQuery);
  }

  let matchedTokenCount = 0;
  let matchedInTitle = false;
  let matchedInDescription = false;
  for (const token of queryTokens) {
    if (label.includes(token)) {
      score += 170 - label.indexOf(token);
      matchedTokenCount += 1;
      matchedInTitle = true;
      continue;
    }

    if (description.includes(token)) {
      score += 110 - description.indexOf(token);
      matchedTokenCount += 1;
      matchedInDescription = true;
      continue;
    }

    if (group.includes(token)) {
      score += 90 - group.indexOf(token);
      matchedTokenCount += 1;
      continue;
    }

    if (href.includes(token)) {
      score += 85 - href.indexOf(token);
      matchedTokenCount += 1;
      continue;
    }

    if (isSubsequenceMatch(token, searchableText)) {
      score += 45;
      matchedTokenCount += 1;
    }
  }

  if (matchedTokenCount !== queryTokens.length) {
    return { score: 0, matchedInTitle: false, matchedInDescription: false };
  }
  if (queryTokens.length > 1) score += 80;

  const normalizedScore = Math.max(score, 0);
  return {
    score: normalizedScore,
    matchedInTitle:
      matchedInTitle || label.includes(normalizedQuery) || label.startsWith(normalizedQuery),
    matchedInDescription: matchedInDescription || description.includes(normalizedQuery),
  };
}

export function getSearchRank(item: ToolSearchItem, query: string): ToolSearchRank {
  return computeToolSearchRank(item, query);
}

export function getSearchScore(item: ToolSearchItem, query: string) {
  return computeToolSearchRank(item, query).score;
}
