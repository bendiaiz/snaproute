import { describe, it, expect, beforeEach } from 'vitest';
import { createLinkStore, LinkRecord } from './kv';

function createMockKV() {
  const store = new Map<string, string>();
  return {
    store,
    async get(key: string) { return store.get(key) ?? null; },
    async put(key: string, value: string) { store.set(key, value); },
    async delete(key: string) { store.delete(key); },
  };
}

describe('createLinkStore', () => {
  let mock: ReturnType<typeof createMockKV>;
  let linkStore: ReturnType<typeof createLinkStore>;

  beforeEach(() => {
    mock = createMockKV();
    linkStore = createLinkStore(mock);
  });

  const record: LinkRecord = {
    slug: 'abc123',
    url: 'https://example.com',
    createdAt: Date.now(),
  };

  it('returns null for missing slug', async () => {
    expect(await linkStore.getLink('nope')).toBeNull();
  });

  it('stores and retrieves a link', async () => {
    await linkStore.putLink(record);
    const result = await linkStore.getLink('abc123');
    expect(result).toEqual(record);
  });

  it('deletes a link', async () => {
    await linkStore.putLink(record);
    await linkStore.deleteLink('abc123');
    expect(await linkStore.getLink('abc123')).toBeNull();
  });

  it('returns null for malformed JSON', async () => {
    mock.store.set('link:bad', 'not-json');
    expect(await linkStore.getLink('bad')).toBeNull();
  });

  it('uses the correct KV key prefix when storing a link', async () => {
    await linkStore.putLink(record);
    expect(mock.store.has('link:abc123')).toBe(true);
    expect(mock.store.has('abc123')).toBe(false);
  });

  it('overwrites an existing link with the same slug', async () => {
    await linkStore.putLink(record);
    const updated: LinkRecord = { ...record, url: 'https://updated.com' };
    await linkStore.putLink(updated);
    const result = await linkStore.getLink('abc123');
    expect(result?.url).toBe('https://updated.com');
  });
});
