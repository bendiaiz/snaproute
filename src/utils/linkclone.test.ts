import { describe, it, expect } from 'vitest';
import { cloneLink, cloneResultToJson } from './linkclone';

interface LinkRecord {
  url: string;
  slug: string;
  createdAt: number;
  tags?: string[];
  utmParams?: Record<string, string>;
  password?: string;
  expiresAt?: number;
}

function makeLink(overrides: Partial<LinkRecord> = {}): LinkRecord {
  return {
    url: 'https://example.com/original',
    slug: 'abc123',
    createdAt: 1700000000000,
    ...overrides,
  };
}

describe('cloneLink', () => {
  it('creates a new link with a new slug', () => {
    const original = makeLink();
    const result = cloneLink(original, 'xyz789');
    expect(result.slug).toBe('xyz789');
    expect(result.url).toBe(original.url);
  });

  it('resets createdAt to now', () => {
    const before = Date.now();
    const original = makeLink({ createdAt: 1000 });
    const result = cloneLink(original, 'newslug');
    expect(result.createdAt).toBeGreaterThanOrEqual(before);
  });

  it('copies tags from original', () => {
    const original = makeLink({ tags: ['promo', 'summer'] });
    const result = cloneLink(original, 'newslug');
    expect(result.tags).toEqual(['promo', 'summer']);
  });

  it('copies utmParams from original', () => {
    const original = makeLink({ utmParams: { utm_source: 'email' } });
    const result = cloneLink(original, 'newslug');
    expect(result.utmParams).toEqual({ utm_source: 'email' });
  });

  it('does not copy password by default', () => {
    const original = makeLink({ password: 'secret' });
    const result = cloneLink(original, 'newslug');
    expect(result.password).toBeUndefined();
  });

  it('copies password when includePassword is true', () => {
    const original = makeLink({ password: 'secret' });
    const result = cloneLink(original, 'newslug', { includePassword: true });
    expect(result.password).toBe('secret');
  });

  it('does not copy expiresAt by default', () => {
    const original = makeLink({ expiresAt: 9999999999999 });
    const result = cloneLink(original, 'newslug');
    expect(result.expiresAt).toBeUndefined();
  });

  it('copies expiresAt when includeExpiry is true', () => {
    const original = makeLink({ expiresAt: 9999999999999 });
    const result = cloneLink(original, 'newslug', { includeExpiry: true });
    expect(result.expiresAt).toBe(9999999999999);
  });
});

describe('cloneResultToJson', () => {
  it('returns expected json shape', () => {
    const original = makeLink();
    const cloned = cloneLink(original, 'newslug');
    const json = cloneResultToJson(original, cloned, 'https://snap.to');
    expect(json.originalSlug).toBe('abc123');
    expect(json.clonedSlug).toBe('newslug');
    expect(json.shortUrl).toBe('https://snap.to/newslug');
    expect(json.url).toBe(cloned.url);
  });
});
