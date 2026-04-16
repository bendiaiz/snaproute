import { describe, it, expect, beforeEach } from 'vitest';
import { handleShorten } from './shorten';

function createMockKV() {
  const store = new Map<string, string>();
  return {
    store,
    async get(key: string) { return store.get(key) ?? null; },
    async put(key: string, value: string) { store.set(key, value); },
    async delete(key: string) { store.delete(key); },
  };
}

describe('handleShorten', () => {
  let kv: ReturnType<typeof createMockKV>;
  const base = 'https://snap.route';

  beforeEach(() => { kv = createMockKV(); });

  it('rejects missing url', async () => {
    const res = await handleShorten({ url: '' }, kv, base);
    expect(res.status).toBe(400);
  });

  it('rejects non-http url', async () => {
    const res = await handleShorten({ url: 'ftp://bad.com' }, kv, base);
    expect(res.status).toBe(400);
  });

  it('creates a short link', async () => {
    const res = await handleShorten({ url: 'https://example.com' }, kv, base);
    expect(res.status).toBe(201);
    const body = res.body as any;
    expect(body.shortUrl).toMatch(/^https:\/\/snap\.route\/.+/);
  });

  it('uses custom slug', async () => {
    const res = await handleShorten({ url: 'https://example.com', customSlug: 'mylink' }, kv, base);
    expect(res.status).toBe(201);
    expect((res.body as any).slug).toBe('mylink');
  });

  it('rejects duplicate custom slug', async () => {
 handleShorten({ url: 'https://a.com', customSlug: 'dup' }, kv, base);
    const res = await handleShorten({ url: 'https://b.com', customSlug: 'dup' }, kv, base);
    expect(res.status).toBe(409);
  });

  it('sets expiresAt when ttl provided', async () => {
    const res = await handleShorten({ url: 'https://example.com', ttl: 3600 }, kv, base);
    expect((res.body as any).expiresAt).toBeDefined();
  });
});
