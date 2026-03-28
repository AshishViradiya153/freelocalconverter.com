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

export function getSearchScore(item: ToolSearchItem, query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return 0;

  const label = normalizeSearchValue(item.label);
  const description = normalizeSearchValue(item.description);
  const group = normalizeSearchValue(item.group);
  const href = normalizeSearchValue(item.href);
  const searchableText = `${label} ${description} ${group} ${href}`;
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  if (!queryTokens.length) return 0;

  let score = 0;

  if (label.startsWith(normalizedQuery)) score += 650;
  if (label.includes(normalizedQuery))
    score += 350 - label.indexOf(normalizedQuery);
  if (searchableText.includes(normalizedQuery)) {
    score += 220 - searchableText.indexOf(normalizedQuery);
  }

  let matchedTokenCount = 0;
  for (const token of queryTokens) {
    if (label.includes(token)) {
      score += 170 - label.indexOf(token);
      matchedTokenCount += 1;
      continue;
    }

    if (description.includes(token)) {
      score += 110 - description.indexOf(token);
      matchedTokenCount += 1;
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

  if (matchedTokenCount !== queryTokens.length) return 0;
  if (queryTokens.length > 1) score += 80;

  return Math.max(score, 0);
}
