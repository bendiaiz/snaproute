import { describe, it, expect, vi } from 'vitest';
import { createStatsHandler } from './stats';

function createMockKV(store: Record<string, unknown> = {}): KVNamespace {
  return {
    get: vi.fn(async (key: string) => {
      const value = store[key];
      return value ? JSON.stringify(value) : null;
    }),
    put: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    list: vi.fn(async () => ({ keys: [], list_complete: true, cursor: '' })),
    getWithMetadata: vi.fn(async () => ({ value: null, metadata: null })),
  } as unknown as KVNamespace;
}

describe('statsHandler', () => {
  it('returns 400 when slug is missing', async () => {
    const handler = createStatsHandler(createMockKV());
    const req = new Request('http://localhost/api/stats/');
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing slug');
  });

  it('returns 404 when slug does not exist', async () => {
    const handler = createStatsHandler(createMockKV());
    const req = new Request('http://localhost/api/stats/unknown');
    const res = await handler(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Slug not found');
  });

  it('returns stats for a valid slug', async () => {
    const mockData = {
      abc123: {
        url: 'https://example.com',
        clicks: 42,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: '2024-06-01T12:00:00.000Z',
      },
    };
    const handler = createStatsHandler(createMockKV(mockData));
    const req = new Request('http://localhost/api/stats/abc123');
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe('abc123');
    expect(body.url).toBe('https://example.com');
    expect(body.clicks).toBe(42);
    expect(body.lastClickedAt).toBe('2024-06-01T12:00:00.000Z');
  });

  it('defaults clicks to 0 when not set', async () => {
    const mockData = {
      xyz: { url: 'https://test.com', createdAt: '2024-01-01T00:00:00.000Z' },
    };
    const handler = createStatsHandler(createMockKV(mockData));
    const req = new Request('http://localhost/api/stats/xyz');
    const res = await handler(req);
    const body = await res.json();
    expect(body.clicks).toBe(0);
    expect(body.lastClickedAt).toBeNull();
  });
});
