import { describe, it, expect, beforeEach } from 'vitest';
import { createRateLimiter, rateLimitHeaders } from './ratelimit';

function createMockStore() {
  const data = new Map<string, string>();
  return {
    async get(key: string) {
      return data.get(key) ?? null;
    },
    async put(key: string, value: string) {
      data.set(key, value);
    },
    _data: data,
  };
}

describe('createRateLimiter', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
  });

  it('allows requests under the limit', async () => {
    const check = createRateLimiter(store, { limit: 3, windowMs: 60000 });
    const result = await check('user-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('tracks multiple requests', async () => {
    const check = createRateLimiter(store, { limit: 3, windowMs: 60000 });
    await check('user-1');
    await check('user-1');
    const result = await check('user-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('blocks requests over the limit', async () => {
    const check = createRateLimiter(store, { limit: 2, windowMs: 60000 });
    await check('user-1');
    await check('user-1');
    const result = await check('user-1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('isolates different identifiers', async () => {
    const check = createRateLimiter(store, { limit: 1, windowMs: 60000 });
    await check('user-1');
    const result = await check('user-2');
    expect(result.allowed).toBe(true);
  });
});

describe('rateLimitHeaders', () => {
  it('returns correct headers', () => {
    const result = { allowed: true, remaining: 4, resetAt: 1700000000000 };
    const headers = rateLimitHeaders(result, 5);
    expect(headers['X-RateLimit-Limit']).toBe('5');
    expect(headers['X-RateLimit-Remaining']).toBe('4');
    expect(headers['X-RateLimit-Reset']).toBe('1700000000');
  });
});
