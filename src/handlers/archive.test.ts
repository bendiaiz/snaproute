import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createArchiveHandler } from './archive';
import { createLinkStore } from '../store/kv';

function createMockKV(initial: Record<string, string> = {}): KVNamespace {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
    list: vi.fn(async ({ prefix }: { prefix?: string } = {}) => ({
      keys: [...store.keys()]
        .filter(k => !prefix || k.startsWith(prefix))
        .map(name => ({ name })),
      list_complete: true,
      cursor: undefined,
    })),
  } as unknown as KVNamespace;
}

function makeEnv(kv: KVNamespace) {
  return { KV: kv, BASE_URL: 'https://snap.route' };
}

describe('createArchiveHandler', () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV({
      'link:abc123': JSON.stringify({ url: 'https://example.com', slug: 'abc123', createdAt: Date.now() }),
    });
  });

  it('archives an existing link', async () => {
    const handler = createArchiveHandler(createLinkStore(kv));
    const req = new Request('https://snap.route/api/links/abc123/archive', { method: 'POST' });
    const res = await handler(req, makeEnv(kv), 'abc123');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe('abc123');
    expect(body.archived).toBe(true);
  });

  it('returns 404 for unknown slug', async () => {
    const handler = createArchiveHandler(createLinkStore(kv));
    const req = new Request('https://snap.route/api/links/unknown/archive', { method: 'POST' });
    const res = await handler(req, makeEnv(kv), 'unknown');
    expect(res.status).toBe(404);
  });

  it('unarchives a previously archived link', async () => {
    const archivedKv = createMockKV({
      'link:abc123': JSON.stringify({ url: 'https://example.com', slug: 'abc123', createdAt: Date.now(), archived: true }),
    });
    const handler = createArchiveHandler(createLinkStore(archivedKv));
    const req = new Request('https://snap.route/api/links/abc123/archive', {
      method: 'DELETE',
    });
    const res = await handler(req, makeEnv(archivedKv), 'abc123');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.archived).toBe(false);
  });

  it('returns 405 for unsupported methods', async () => {
    const handler = createArchiveHandler(createLinkStore(kv));
    const req = new Request('https://snap.route/api/links/abc123/archive', { method: 'GET' });
    const res = await handler(req, makeEnv(kv), 'abc123');
    expect(res.status).toBe(405);
  });
});
