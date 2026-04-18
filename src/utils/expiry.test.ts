import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveExpiry,
  expiresAtFromTtl,
  isExpired,
  formatTtlHuman,
} from './expiry';

const NOW = new Date('2024-06-01T12:00:00Z').getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveExpiry', () => {
  it('returns ttlSeconds when provided', () => {
    expect(resolveExpiry({ ttlSeconds: 3600 })).toBe(3600);
  });

  it('returns null for non-positive ttl', () => {
    expect(resolveExpiry({ ttlSeconds: 0 })).toBeNull();
    expect(resolveExpiry({ ttlSeconds: -1 })).toBeNull();
  });

  it('computes ttl from expiresAt', () => {
    const future = new Date(NOW + 7200 * 1000).toISOString();
    expect(resolveExpiry({ expiresAt: future })).toBe(7200);
  });

  it('returns null for past expiresAt', () => {
    const past = new Date(NOW - 1000).toISOString();
    expect(resolveExpiry({ expiresAt: past })).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(resolveExpiry({ expiresAt: 'not-a-date' })).toBeNull();
  });

  it('returns null when no options given', () => {
    expect(resolveExpiry({})).toBeNull();
  });
});

describe('expiresAtFromTtl', () => {
  it('returns ISO string offset by ttl', () => {
    const result = expiresAtFromTtl(3600);
    expect(result).toBe(new Date(NOW + 3600 * 1000).toISOString());
  });
});

describe('isExpired', () => {
  it('returns false when no expiresAt', () => {
    expect(isExpired(undefined)).toBe(false);
  });

  it('returns true for past date', () => {
    expect(isExpired(new Date(NOW - 1000).toISOString())).toBe(true);
  });

  it('returns false for future date', () => {
    expect(isExpired(new Date(NOW + 1000).toISOString())).toBe(false);
  });
});

describe('formatTtlHuman', () => {
  it('formats seconds', () => expect(formatTtlHuman(45)).toBe('45s'));
  it('formats minutes', () => expect(formatTtlHuman(120)).toBe('2m'));
  it('formats hours', () => expect(formatTtlHuman(7200)).toBe('2h'));
  it('formats days', () => expect(formatTtlHuman(172800)).toBe('2d'));
});
