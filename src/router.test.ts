import { describe, it, expect, vi } from 'vitest';
import router from './router';

function createMockEnv(store: Record<string, unknown> = {}): { SNAP_KV: KVNamespace; BASE_URL: string } {
  const internal: Record<string, string> = {};
  for (const [k, v] of Object.entries(store)) {
    internal[k] = JSON.stringify(v);
  }
  return {
    BASE_URL: 'https://snap.route',
    SNAP_KV: {
      get: vi.fn(async (key: string) => {
        const val = internal[key];
        return val ? JSON.parse(val) : null;
      }),
      put: vi.fn(async (key: string, value: string) => { internal[key] = value; }),
      delete: vi.fn(async (key: string) => { delete internal[key]; }),
      list: vi.fn(async () => ({ keys: [], list_complete: true })),
    } as unknown as KVNamespace,
  };
}

describe('router', () => {
  it('POST /api/shorten returns 200', async () => {
    const env = createMockEnv();
    const req = new Request('https://snap.route/api/shorten', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await router.fetch(req, env);
    expect(res.status).toBe(200);
  });

  it('GET /api/links returns 200', async () => {
    const env = createMockEnv();
    const res = await router.fetch(new Request('https://snap.route/api/links'), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.links).toEqual([]);
  });

  it('GET unknown slug returns 404', async () => {
    const env = createMockEnv();
    const res = await router.fetch(new Request('https://snap.route/noexist'), env);
    expect(res.status).toBe(404);
  });

  it('GET / returns 404', async () => {
    const env = createMockEnv();
    const res = await router.fetch(new Request('https://snap.route/'), env);
    expect(res.status).toBe(404);
  });
});
