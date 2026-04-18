/**
 * Utilities for generating slugs from URLs or custom aliases.
 */

const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'dashboard',
  'health',
  'stats',
  'shorten',
  'list',
  'delete',
]);

/**
 * Sanitize a custom alias provided by the user.
 * Allows alphanumeric, hyphens, and underscores, 3-64 chars.
 */
export function sanitizeAlias(alias: string): string | null {
  const cleaned = alias.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (cleaned.length < 3 || cleaned.length > 64) return null;
  return cleaned;
}

/**
 * Check whether a slug is reserved for internal routes.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Derive a readable slug hint from a URL's hostname + path.
 * Returns null if nothing useful can be extracted.
 */
export function slugHintFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = [parsed.hostname.replace(/^www\./, ''), ...parsed.pathname.split('/').filter(Boolean)];
    const hint = parts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
    return hint.length >= 3 ? hint : null;
  } catch {
    return null;
  }
}
