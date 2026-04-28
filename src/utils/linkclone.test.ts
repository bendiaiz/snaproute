import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cloneLink, cloneResultToJson, LinkRecord } from './linkclone';

const baseLink: LinkRecord = {
  url: 'https://example.com/original',
  slug: 'abc123',
  createdAt: '2024-01-01T00:00:00.000Z',
  tags: ['marketing'],
  expiresAt: '2025-01-01T00:00:00.000Z',
};

describe('cloneLink', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  it('creates a new record with the given slug', () => {
    const result = cloneLink(baseLink, { newSlug: 'xyz789' });
    expect(result.cloned.slug).toBe('xyz789');
  });

  it('sets createdAt to now', () => {
    const result = cloneLink(baseLink, { newSlug: 'xyz789' });
    expect(result.cloned.createdAt).toBe('2024-06-15T12:00:00.000Z');
  });

  it('preserves original fields by default', () => {
    const result = cloneLink(baseLink, { newSlug: 'xyz789' });
    expect(result.cloned.url).toBe(baseLink.url);
    expect(result.cloned.tags).toEqual(['marketing']);
    expect(result.cloned.expiresAt).toBe(baseLink.expiresAt);
  });

  it('applies overrides over original fields', () => {
    const result = cloneLink(baseLink, {
      newSlug: 'xyz789',
      overrides: { url: 'https://example.com/new', tags: ['sales'] },
    });
    expect(result.cloned.url).toBe('https://example.com/new');
    expect(result.cloned.tags).toEqual(['sales']);
  });

  it('does not mutate the original record', () => {
    cloneLink(baseLink, { newSlug: 'xyz789', overrides: { url: 'https://other.com' } });
    expect(baseLink.url).toBe('https://example.com/original');
  });

  it('returns the original record unchanged', () => {
    const result = cloneLink(baseLink, { newSlug: 'xyz789' });
    expect(result.original).toEqual(baseLink);
  });
});

describe('cloneResultToJson', () => {
  it('returns expected shape', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    const result = cloneLink(baseLink, { newSlug: 'xyz789' });
    const json = cloneResultToJson(result);

    expect(json.original).toMatchObject({ slug: 'abc123', url: baseLink.url });
    expect(json.cloned).toMatchObject({ slug: 'xyz789', tags: ['marketing'] });
  });

  it('sets alias to null when not present', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    const result = cloneLink(baseLink, { newSlug: 'xyz789' });
    const json = cloneResultToJson(result) as any;
    expect(json.cloned.alias).toBeNull();
  });

  it('sets tags to empty array when not present', () => {
    const noTagsLink = { ...baseLink, tags: undefined };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    const result = cloneLink(noTagsLink, { newSlug: 'xyz789' });
    const json = cloneResultToJson(result) as any;
    expect(json.cloned.tags).toEqual([]);
  });
});
