import { describe, it, expect, vi } from 'vitest';
import { createListHandler } from './list';

function createMockKV(store: Record<string, unknown> = {}): KVNamespace {
  const internal: Record<string, string> = {};
  for (const [k, v] of Object.entries(store)) {
    internal[k] = JSON.stringify(v);
  }
  return {
    get: vi.fn(async (key: string) => {
      const val = internal[key];
      return val ? JSON.parse(val) : null;
    }),
    put: vi.fn(async (key: string, value: string) => { internal[key] = value; }),
    delete: vi.fn(async (key: string) => { delete internal[key]; }),
    list: vi.fn(async ({ prefix, limit }: { prefix?: string; limit?: number; cursor?: string }) => {
      const keys = Object.keys(internal)
        .filter(k => !prefix || k.startsWith(prefix))
        .slice(0, limit ?? 50)
        .map(name => ({ name }));
      return { keys, list_complete: true, cursor: undefined };
    }),
  } as unknown as KVNamespace;
}

describe('createListHandler', () => {
  it('returns empty list when no links exist', async () => {
    const kv = createMockKV();
    const handler = createListHandler(kv);
    const res = await handler(new Request('https://snap.route/api/links'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.links).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('returns stored links', async () => {
    const kv = createMockKV({
      'link:abc123': { url: 'https://example.com', createdAt: '2024-01-01T00:00:00Z', clicks: 5 },
    });
    const handler = createListHandler(kv);
    const res = await handler(new Request('https://snap.route/api/links'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.links[0].slug).toBe('abc123');
    expect(body.links[0].clicks).toBe(5);
  });

  it('respects limit query param', async () => {
    const kv = createMockKV();
    const listSpy = vi.spyOn(kv, 'list');
    const handler = createListHandler(kv);
    await handler(new Request('https://snap.route/api/links?limit=10'));
    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });

  it('caps limit at 100', async () => {
    const kv = createMockKV();
    const listSpy = vi.spyOn(kv, 'list');
    const handler = createListHandler(kv);
    await handler(new Request('https://snap.route/api/links?limit=999'));
    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });
});
