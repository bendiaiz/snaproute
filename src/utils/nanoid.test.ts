import { describe, it, expect } from 'vitest';
import { generateSlug, isValidSlug } from './nanoid';

describe('generateSlug', () => {
  it('returns a string of the default length (7)', () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(7);
  });

  it('returns a string of a custom length', () => {
    expect(generateSlug(12)).toHaveLength(12);
    expect(generateSlug(3)).toHaveLength(3);
  });

  it('only contains alphanumeric characters', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateSlug()).toMatch(/^[A-Za-z0-9]+$/);
    }
  });

  it('generates unique slugs', () => {
    const slugs = new Set(Array.from({ length: 1000 }, () => generateSlug()));
    // Extremely unlikely to collide across 1000 samples
    expect(slugs.size).toBeGreaterThan(990);
  });
});

describe('isValidSlug', () => {
  it('accepts valid alphanumeric slugs', () => {
    expect(isValidSlug('abc123')).toBe(true);
    expect(isValidSlug('ABCdef')).toBe(true);
    expect(isValidSlug('a1B2c3D')).toBe(true);
  });

  it('rejects slugs that are too short', () => {
    expect(isValidSlug('ab')).toBe(false);
    expect(isValidSlug('')).toBe(false);
  });

  it('rejects slugs that are too long', () => {
    expect(isValidSlug('a'.repeat(33))).toBe(false);
  });

  it('rejects slugs with special characters', () => {
    expect(isValidSlug('hello-world')).toBe(false);
    expect(isValidSlug('foo_bar')).toBe(false);
    expect(isValidSlug('foo bar')).toBe(false);
    expect(isValidSlug('abc!')).toBe(false);
  });
});
