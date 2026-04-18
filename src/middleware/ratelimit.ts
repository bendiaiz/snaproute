import { createRateLimiter, rateLimitHeaders } from '../utils/ratelimit';

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function rateLimitOptionsFromEnv(env: Record<string, string>): RateLimitOptions {
  return {
    limit: env.RATE_LIMIT_MAX ? parseInt(env.RATE_LIMIT_MAX, 10) : 60,
    windowMs: env.RATE_LIMIT_WINDOW_MS ? parseInt(env.RATE_LIMIT_WINDOW_MS, 10) : 60_000,
  };
}

export function withRateLimit(
  handler: (req: Request, env: Record<string, string>) => Promise<Response>,
  options?: Partial<RateLimitOptions>
) {
  return async (req: Request, env: Record<string, string>): Promise<Response> => {
    const opts = { ...rateLimitOptionsFromEnv(env), ...options };
    const store = (env as any).KV;

    if (!store) {
      return handler(req, env);
    }

    const ip =
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-forwarded-for') ??
      'unknown';

    const limiter = createRateLimiter(store, opts.limit, opts.windowMs);
    const result = await limiter(ip);
    const headers = rateLimitHeaders(result);

    if (!result.allowed) {
      return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    const response = await handler(req, env);
    const merged = new Response(response.body, response);
    Object.entries(headers).forEach(([k, v]) => merged.headers.set(k, v));
    return merged;
  };
}
