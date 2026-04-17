import { describe, it, expect, vi } from 'vitest';
import { handleRequest, Env } from './router';

function createMockEnv(): Env {
  const store = new Map<string, string>();
  return {
    KV: {
      async get(key: string) { return store.get(key) ?? null; },
      async put(key: string, value: string) { store.set(key, value); },
      async delete(key: string) { store.delete(key); },
      async list() { return { keys: [], list_complete: true, cursor: '' }; },
      async getWithMetadata(key: string) { return { value: store.get(key) ?? null, metadata: null }; },
    } as unknown as KVNamespace,
    ADMIN_SECRET: 'secret',
    BASE_URL: 'https://snap.route',
  };
}

describe('router', () => {
  it('returns 404 for unknown routes', async () => {
    const env = createMockEnv();
    const req = new Request('https://snap.route/api/unknown');
    const res = await handleRequest(req, env);
    expect(res.status).toBe(404);
  });

  it('routes DELETE /api/links/:slug', async () => {
    const env = createMockEnv();
    await env.KV.put('abc123', JSON.stringify({ url: 'https://example.com', createdAt: Date.now(), clicks: 0 }));
    const req = new Request('https://snap.route/api/links/abc123', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer secret' },
    });
    const res = await handleRequest(req, env);
    expect(res.status).toBe(200);
  });

  it('routes POST /api/shorten', async () => {
    const env = createMockEnv();
    const req = new Request('https://snap.route/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const res = await handleRequest(req, env);
    expect(res.status).toBe(201);
  });
});
