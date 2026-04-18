/**
 * Link expiry utilities
 */

export const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface ExpiryOptions {
  ttlSeconds?: number;
  expiresAt?: string; // ISO string
}

export function resolveExpiry(options: ExpiryOptions): number | null {
  if (options.expiresAt) {
    const ts = Date.parse(options.expiresAt);
    if (isNaN(ts)) return null;
    const ttl = Math.floor((ts - Date.now()) / 1000);
    return ttl > 0 ? ttl : null;
  }
  if (options.ttlSeconds !== undefined) {
    return options.ttlSeconds > 0 ? options.ttlSeconds : null;
  }
  return null;
}

export function expiresAtFromTtl(ttlSeconds: number): string {
  return new Date(Date.now() + ttlSeconds * 1000).toISOString();
}

export function isExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false;
  return Date.parse(expiresAt) < Date.now();
}

export function formatTtlHuman(ttlSeconds: number): string {
  if (ttlSeconds < 60) return `${ttlSeconds}s`;
  if (ttlSeconds < 3600) return `${Math.floor(ttlSeconds / 60)}m`;
  if (ttlSeconds < 86400) return `${Math.floor(ttlSeconds / 3600)}h`;
  return `${Math.floor(ttlSeconds / 86400)}d`;
}
