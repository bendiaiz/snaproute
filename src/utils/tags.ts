/**
 * Tag utilities for organizing and filtering short links.
 */

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 32;
export const TAG_PATTERN = /^[a-z0-9_-]+$/;

export function sanitizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export function isValidTag(tag: string): boolean {
  const s = sanitizeTag(tag);
  return s.length > 0 && s.length <= MAX_TAG_LENGTH && TAG_PATTERN.test(s);
}

export function parseTags(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map(sanitizeTag)
    .filter(isValidTag)
    .slice(0, MAX_TAGS);
}

export function serializeTags(tags: string[]): string {
  return [...new Set(tags)].sort().join(",");
}

export function filterByTag(items: Array<{ tags?: string[] }>, tag: string): typeof items {
  const needle = sanitizeTag(tag);
  return items.filter((item) => item.tags?.includes(needle));
}

export function tagsFromParams(params: URLSearchParams): string[] {
  const raw = params.get("tags");
  return parseTags(raw);
}
