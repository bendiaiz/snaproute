import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createExpireHandler } from './expire';

const NOW = new Date('2024-06-01T12:00:00Z').getTime();

function createMockKV(data: Record<string, string> = {}) {
  const store = new Map(Object.entries(data));
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
  } as unknown as KVNamespace;
}

const makeEnv = (kv: KVNamespace) => ({ KV: kv, BASE_URL: 'https://snap.io' });

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { vi.useRealTimers(); });

describe('createExpireHandler', () => {
  it('returns 404 for missing slug', async () => {
    const kv = createMockKV();
    const handler = createExpireHandler(makeEnv(kv));
    const res = await handler(new Request('https://snap.io/api/links/abc/expire'), 'abc');
    expect(res.status).toBe(404);
  });

  it('returns expiry info for active link', async () => {
    const future = new Date(NOW + 3600 * 1000).toISOString();
    const link = JSON.stringify({ url: 'https://example.com', expiresAt: future });
    const kv = createMockKV({ 'link:abc': link });
    const handler = createExpireHandler(makeEnv(kv));
    const res = await handler(new Request('https://snap.io/api/links/abc/expire'), 'abc');
    const body = await res.json() as any;
    expect(body.expired).toBe(false);
    expect(body.expiresAt).toBe(future);
  });

  it('reports expired link', async () => {
    const past = new Date(NOW - 1000).toISOString();
    const link = JSON.stringify({ url: 'https://example.com', expiresAt: past });
    const kv = createMockKV({ 'link:abc': link });
    const handler = createExpireHandler(makeEnv(kv));
    const res = await handler(new Request('https://snap.io/api/links/abc/expire'), 'abc');
    const body = await res.json() as any;
    expect(body.expired).toBe(true);
  });

  it('DELETE on expired link removes it', async () => {
    const past = new Date(NOW - 1000).toISOString();
    const link = JSON.stringify({ url: 'https://example.com', expiresAt: past });
    const kv = createMockKV({ 'link:abc': link });
    const handler = createExpireHandler(makeEnv(kv));
    const req = new Request('https://snap.io/api/links/abc/expire', { method: 'DELETE' });
    const res = await handler(req, 'abc');
    const body = await res.json() as any;
    expect(body.deleted).toBe(true);
    expect(kv.delete).toHaveBeenCalledWith('link:abc');
  });

  it('returns null expiresAt when no expiry set', async () => {
    const link = JSON.stringify({ url: 'https://example.com' });
    const kv = createMockKV({ 'link:abc': link });
    const handler = createExpireHandler(makeEnv(kv));
    const res = await handler(new Request('https://snap.io/api/links/abc/expire'), 'abc');
    const body = await res.json() as any;
    expect(body.expiresAt).toBeNull();
    expect(body.expired).toBe(false);
  });
});
