import { describe, it, expect, beforeEach } from 'vitest';
import { createDeleteHandler } from './delete';

const ADMIN_SECRET = 'test-secret';

function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string) { return store.get(key) ?? null; },
    async put(key: string, value: string) { store.set(key, value); },
    async delete(key: string) { store.delete(key); },
    async list() { return { keys: [], list_complete: true, cursor: '' }; },
    async getWithMetadata(key: string) { return { value: store.get(key) ?? null, metadata: null }; },
  } as unknown as KVNamespace;
}

describe('deleteHandler', () => {
  let kv: KVNamespace;
  let handler: (req: Request) => Promise<Response>;

  beforeEach(() => {
    kv = createMockKV();
    handler = createDeleteHandler(kv, ADMIN_SECRET);
  });

  it('returns 401 if no auth header', async () => {
    const req = new Request('http://localhost/api/links/abc123', { method: 'DELETE' });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 if wrong secret', async () => {
    const req = new Request('http://localhost/api/links/abc123', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer wrong' },
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 if slug not found', async () => {
    const req = new Request('http://localhost/api/links/abc123', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    });
    const res = await handler(req);
    expect(res.status).toBe(404);
  });

  it('deletes existing slug and returns 200', async () => {
    await kv.put('abc123', JSON.stringify({ url: 'https://example.com', createdAt: Date.now(), clicks: 0 }));
    const req = new Request('http://localhost/api/links/abc123', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; slug: string };
    expect(body.success).toBe(true);
    expect(body.slug).toBe('abc123');
    expect(await kv.get('abc123')).toBeNull();
  });
});
