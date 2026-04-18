import { describe, it, expect } from 'vitest';
import { sanitizeAlias, isReservedSlug, slugHintFromUrl } from './slugify';

describe('sanitizeAlias', () => {
  it('returns lowercased cleaned alias', () => {
    expect(sanitizeAlias('My-Link_1')).toBe('my-link_1');
  });

  it('strips invalid characters', () => {
    expect(sanitizeAlias('hello world!')).toBe('helloworld');
  });

  it('returns null when too short', () => {
    expect(sanitizeAlias('ab')).toBeNull();
  });

  it('returns null when too long', () => {
    expect(sanitizeAlias('a'.repeat(65))).toBeNull();
  });

  it('accepts exactly 3 chars', () => {
    expect(sanitizeAlias('abc')).toBe('abc');
  });

  it('accepts exactly 64 chars', () => {
    const s = 'a'.repeat(64);
    expect(sanitizeAlias(s)).toBe(s);
  });
});

describe('isReservedSlug', () => {
  it('flags reserved slugs', () => {
    expect(isReservedSlug('admin')).toBe(true);
    expect(isReservedSlug('API')).toBe(true);
    expect(isReservedSlug('dashboard')).toBe(true);
  });

  it('allows non-reserved slugs', () => {
    expect(isReservedSlug('mylink')).toBe(false);
    expect(isReservedSlug('abc123')).toBe(false);
  });
});

describe('slugHintFromUrl', () => {
  it('extracts hostname and path', () => {
    expect(slugHintFromUrl('https://www.example.com/blog/post')).toBe('example-com-blog-post');
  });

  it('strips www prefix', () => {
    const hint = slugHintFromUrl('https://www.github.com');
    expect(hint).toBe('github-com');
  });

  it('returns null for invalid URL', () => {
    expect(slugHintFromUrl('not-a-url')).toBeNull();
  });

  it('returns null when hint too short', () => {
    expect(slugHintFromUrl('https://ab')).toBeNull();
  });

  it('truncates to 32 chars', () => {
    const hint = slugHintFromUrl('https://very-long-hostname-that-exceeds-limits.com/some/deep/path');
    expect(hint!.length).toBeLessThanOrEqual(32);
  });
});
