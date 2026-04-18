import { describe, it, expect, vi } from 'vitest';
import { withRateLimit, rateLimitOptionsFromEnv } from './ratelimit';

function makeRequest(ip = '1.2.3.4'): Request {
  return new Request('https://example.com/shorten', {
    method: 'POST',
    headers: { 'cf-connecting-ip': ip },
  });
}

function createMockKV(initialCount = 0) {
  const store = new Map<string, string>();
  if (initialCount > 0) {
    store.set('rl:1.2.3.4', JSON.stringify({ count: initialCount, reset: Date.now() + 60_000 }));
  }
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
  };
}

describe('rateLimitOptionsFromEnv', () => {
  it('returns defaults when env is empty', () => {
    const opts = rateLimitOptionsFromEnv({});
    expect(opts.limit).toBe(60);
    expect(opts.windowMs).toBe(60_000);
  });

  it('parses env values', () => {
    const opts = rateLimitOptionsFromEnv({ RATE_LIMIT_MAX: '10', RATE_LIMIT_WINDOW_MS: '30000' });
    expect(opts.limit).toBe(10);
    expect(opts.windowMs).toBe(30_000);
  });
});

describe('withRateLimit', () => {
  it('passes through when no KV store present', async () => {
    const inner = vi.fn(async () => new Response('ok', { status: 200 }));
    const handler = withRateLimit(inner);
    const res = await handler(makeRequest(), {});
    expect(res.status).toBe(200);
    expect(inner).toHaveBeenCalled();
  });

  it('allows request under limit', async () => {
    const kv = createMockKV(0);
    const inner = vi.fn(async () => new Response('ok', { status: 200 }));
    const handler = withRateLimit(inner, { limit: 5, windowMs: 60_000 });
    const res = await handler(makeRequest(), { KV: kv } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
  });

  it('blocks request over limit', async () => {
    const kv = createMockKV(10);
    const inner = vi.fn(async () => new Response('ok', { status: 200 }));
    const handler = withRateLimit(inner, { limit: 5, windowMs: 60_000 });
    const res = await handler(makeRequest(), { KV: kv } as any);
    expect(res.status).toBe(429);
    expect(inner).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toBe('Too Many Requests');
  });
});
