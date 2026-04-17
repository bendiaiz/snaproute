import { describe, it, expect, beforeEach } from 'vitest';
import { createAnalyticsStore } from './analytics';
import { ClickEvent } from '../utils/analytics';

function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value); },
    delete: async (key: string) => { store.delete(key); },
    list: async () => ({ keys: [], list_complete: true, cursor: undefined }),
    getWithMetadata: async (key: string) => ({ value: store.get(key) ?? null, metadata: null }),
  } as unknown as KVNamespace;
}

function makeEvent(slug: string, overrides: Partial<ClickEvent> = {}): ClickEvent {
  return {
    slug,
    timestamp: Date.now(),
    ip: '1.2.3.4',
    userAgent: 'TestAgent',
    referer: 'https://example.com',
    country: 'US',
    ...overrides,
  };
}

describe('createAnalyticsStore', () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV();
  });

  it('returns empty stats for unknown slug', async () => {
    const store = createAnalyticsStore(kv);
    const stats = await store.getStats('unknown');
    expect(stats.totalClicks).toBe(0);
    expect(stats.lastClickAt).toBeNull();
  });

  it('records events and returns aggregated stats', async () => {
    const store = createAnalyticsStore(kv);
    await store.record(makeEvent('abc', { country: 'US', referer: 'https://a.com' }));
    await store.record(makeEvent('abc', { country: 'DE', referer: 'https://b.com' }));
    const stats = await store.getStats('abc');
    expect(stats.totalClicks).toBe(2);
    expect(stats.topCountries['US']).toBe(1);
    expect(stats.topCountries['DE']).toBe(1);
  });

  it('getRawEvents returns stored events', async () => {
    const store = createAnalyticsStore(kv);
    await store.record(makeEvent('xyz'));
    const events = await store.getRawEvents('xyz');
    expect(events).toHaveLength(1);
    expect(events[0].slug).toBe('xyz');
  });

  it('isolates events per slug', async () => {
    const store = createAnalyticsStore(kv);
    await store.record(makeEvent('slug1'));
    await store.record(makeEvent('slug2'));
    await store.record(makeEvent('slug2'));
    expect((await store.getStats('slug1')).totalClicks).toBe(1);
    expect((await store.getStats('slug2')).totalClicks).toBe(2);
  });
});
