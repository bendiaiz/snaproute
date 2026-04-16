import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRedirect } from './redirect';

function createMockKV(data: Record<string, string> = {}) {
  return {
    get: vi.fn(async (key: string) => data[key] ?? null),
    put: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
  };
}

describe('handleRedirect', () => {
  let kv: ReturnType<typeof createMockKV>;

  beforeEach(() => {
    kv = createMockKV({
      'link:abc123': JSON.stringify({ url: 'https://example.com', createdAt: Date.now(), hits: 0 }),
    });
  });

  it('redirects to the original URL for a valid slug', async () => {
    const req = new Request('https://snap.route/abc123');
    const res = await handleRedirect(req, kv as any, 'abc123');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://example.com');
  });

  it('returns 404 for an unknown slug', async () => {
    const req = new Request('https://snap.route/unknown');
    const res = await handleRedirect(req, kv as any, 'unknown');
    expect(res.status).toBe(404);
  });

  it('increments hit count on redirect', async () => {
    const req = new Request('https://snap.route/abc123');
    await handleRedirect(req, kv as any, 'abc123');
    expect(kv.put).toHaveBeenCalledOnce();
    const putArg = JSON.parse(kv.put.mock.calls[0][1]);
    expect(putArg.hits).toBe(1);
  });

  it('returns 400 for an invalid slug format', async () => {
    const req = new Request('https://snap.route/bad slug!');
    const res = await handleRedirect(req, kv as any, 'bad slug!');
    expect(res.status).toBe(400);
  });
});
