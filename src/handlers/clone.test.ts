import { describe, it, expect, vi } from 'vitest';
import { createCloneHandler } from './clone';

function createMockKV(initial: Record<string, unknown> = {}) {
  const store = new Map<string, string>(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    get: vi.fn(async (key: string) => {
      const val = store.get(key);
      return val ? JSON.parse(val) : null;
    }),
    put: vi.fn(async (key: string, value: unknown) => {
      store.set(key, JSON.stringify(value));
    }),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
    list: vi.fn(async () => ({ keys: [], list_complete: true })),
  };
}

const baseLink = { url: 'https://example.com', slug: 'orig1', createdAt: 1000 };

function makeEnv(kv: ReturnType<typeof createMockKV>) {
  return { KV: kv as unknown as KVNamespace, BASE_URL: 'https://snap.to' };
}

describe('createCloneHandler', () => {
  it('returns 404 when source slug not found', async () => {
    const kv = createMockKV();
    const handler = createCloneHandler(makeEnv(kv) as unknown as Record<string, string>);
    const req = new Request('https://snap.to/api/links/missing/clone', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    const res = await handler(req, 'missing');
    expect(res.status).toBe(404);
  });

  it('clones a link with a generated slug', async () => {
    const kv = createMockKV({ orig1: baseLink });
    const handler = createCloneHandler(makeEnv(kv) as unknown as Record<string, string>);
    const req = new Request('https://snap.to/api/links/orig1/clone', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    const res = await handler(req, 'orig1');
    expect(res.status).toBe(201);
    const json = await res.json() as Record<string, unknown>;
    expect(json.originalSlug).toBe('orig1');
    expect(typeof json.clonedSlug).toBe('string');
    expect(json.shortUrl).toMatch(/^https:\/\/snap\.to\//)
  });

  it('clones with a custom slug', async () => {
    const kv = createMockKV({ orig1: baseLink });
    const handler = createCloneHandler(makeEnv(kv) as unknown as Record<string, string>);
    const req = new Request('https://snap.to/api/links/orig1/clone', { method: 'POST', body: JSON.stringify({ slug: 'myclone' }), headers: { 'Content-Type': 'application/json' } });
    const res = await handler(req, 'orig1');
    expect(res.status).toBe(201);
    const json = await res.json() as Record<string, unknown>;
    expect(json.clonedSlug).toBe('myclone');
  });

  it('returns 409 when custom slug is taken', async () => {
    const kv = createMockKV({ orig1: baseLink, myclone: { ...baseLink, slug: 'myclone' } });
    const handler = createCloneHandler(makeEnv(kv) as unknown as Record<string, string>);
    const req = new Request('https://snap.to/api/links/orig1/clone', { method: 'POST', body: JSON.stringify({ slug: 'myclone' }), headers: { 'Content-Type': 'application/json' } });
    const res = await handler(req, 'orig1');
    expect(res.status).toBe(409);
  });

  it('does not copy password unless requested', async () => {
    const kv = createMockKV({ orig1: { ...baseLink, password: 'secret' } });
    const handler = createCloneHandler(makeEnv(kv) as unknown as Record<string, string>);
    const req = new Request('https://snap.to/api/links/orig1/clone', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    const res = await handler(req, 'orig1');
    expect(res.status).toBe(201);
    expect(kv.put).toHaveBeenCalled();
    const [, saved] = kv.put.mock.calls[0] as [string, Record<string, unknown>];
    expect(saved.password).toBeUndefined();
  });
});
