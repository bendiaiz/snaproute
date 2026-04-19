import { describe, it, expect, beforeEach } from 'vitest';
import { createAliasHandler } from './alias';

function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string) { const v = store.get(key); return v ? JSON.parse(v) : null; },
    async put(key: string, value: unknown) { store.set(key, JSON.stringify(value)); },
    async delete(key: string) { store.delete(key); },
    async list() { return { keys: [], list_complete: true, cursor: '' }; },
  } as unknown as KVNamespace;
}

const BASE = 'https://snap.io';

describe('createAliasHandler', () => {
  let kv: KVNamespace;
  let handler: ReturnType<typeof createAliasHandler>;

  beforeEach(() => {
    kv = createMockKV();
    handler = createAliasHandler(kv, BASE);
  });

  it('returns 404 for unknown slug', async () => {
    const req = new Request('https://snap.io/api/links/nope/alias', {
      method: 'PATCH',
      body: JSON.stringify({ alias: 'new-alias' }),
    });
    const res = await handler(req, 'nope');
    expect(res.status).toBe(404);
  });

  it('returns 405 for wrong method', async () => {
    const req = new Request('https://snap.io/api/links/abc/alias', { method: 'POST' });
    const res = await handler(req, 'abc');
    expect(res.status).toBe(405);
  });

  it('renames slug successfully', async () => {
    await kv.put('old-slug', { url: 'https://example.com' } as any);
    const req = new Request('https://snap.io/api/links/old-slug/alias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: 'new-slug' }),
    });
    const res = await handler(req, 'old-slug');
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.slug).toBe('new-slug');
    expect(data.shortUrl).toBe('https://snap.io/new-slug');
  });

  it('returns 409 on alias collision', async () => {
    await kv.put('old-slug', { url: 'https://a.com' } as any);
    await kv.put('taken', { url: 'https://b.com' } as any);
    const req = new Request('https://snap.io/api/links/old-slug/alias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: 'taken' }),
    });
    const res = await handler(req, 'old-slug');
    expect(res.status).toBe(409);
  });

  it('returns 422 for invalid alias', async () => {
    await kv.put('old-slug', { url: 'https://a.com' } as any);
    const req = new Request('https://snap.io/api/links/old-slug/alias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: 'a' }),
    });
    const res = await handler(req, 'old-slug');
    expect(res.status).toBe(422);
  });
});
