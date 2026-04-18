export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimiter(store: RateLimitStore, options: RateLimitOptions) {
  const { limit, windowMs } = options;
  const windowSec = Math.ceil(windowMs / 1000);

  return async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
    const key = `rl:${identifier}`;
    const now = Date.now();
    const resetAt = now + windowMs;

    const raw = await store.get(key);
    const current = raw ? parseInt(raw, 10) : 0;

    if (current >= limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    await store.put(key, String(current + 1), { expirationTtl: windowSec });

    return {
      allowed: true,
      remaining: limit - current - 1,
      resetAt,
    };
  };
}

export function rateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

/**
 * Returns a 429 Response with rate limit headers when a request has been blocked.
 */
export function rateLimitExceededResponse(result: RateLimitResult, limit: number): Response {
  const headers = {
    ...rateLimitHeaders(result, limit),
    'Content-Type': 'application/json',
    'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
  return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
    status: 429,
    headers,
  });
}
