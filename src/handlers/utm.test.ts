import { describe, it, expect } from 'vitest';
import { createUTMHandler } from './utm';

function createMockKV(initial: Record<string, string> = {}): KVNamespace {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value); },
    delete: async (key: string) => { store.delete(key); },
    list: async () => ({ keys: [], list_complete: true, cursor: '' }),
    getWithMetadata: async (key: string) => ({ value: store.get(key) ?? null, metadata: null }),
  } as unknown as KVNamespace;
}

const linkData = JSON.stringify({ url: 'https://example.com', createdAt: Date.now() });

describe('createUTMHandler', () => {
  it('GET returns empty utm for clean url', async () => {
    const kv = createMockKV({ 'link:abc': linkData });
    const handler = createUTMHandler(kv);
    const res = await handler(new Request('http://snap/utm/abc'), 'abc');
    expect(res.status).toBe(200);
    const json = await res.json<any>();
    expect(json.utm).toEqual({});
  });

  it('PUT attaches utm params to url', async () => {
    const kv = createMockKV({ 'link:abc': linkData });
    const handler = createUTMHandler(kv);
    const res = await handler(
      new Request('http://snap/utm/abc', {
        method: 'PUT',
        body: JSON.stringify({ utm_source: 'twitter', utm_medium: 'social' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      'abc'
    );
    expect(res.status).toBe(200);
    const json = await res.json<any>();
    expect(json.utm['utm_source']).toBe('twitter');
    expect(json.url).toContain('utm_source=twitter');
  });

  it('PUT returns 400 if no utm params', async () => {
    const kv = createMockKV({ 'link:abc': linkData });
    const handler = createUTMHandler(kv);
    const res = await handler(
      new Request('http://snap/utm/abc', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }),
      'abc'
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown slug', async () => {
    const kv = createMockKV();
    const handler = createUTMHandler(kv);
    const res = await handler(new Request('http://snap/utm/xyz'), 'xyz');
    expect(res.status).toBe(404);
  });
});
