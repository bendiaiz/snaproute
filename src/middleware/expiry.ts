import { createLinkStore } from '../store/kv';
import { isExpired } from '../utils/expiry';

export interface Env {
  KV: KVNamespace;
  [key: string]: unknown;
}

/**
 * Middleware: intercepts redirect requests and blocks expired links.
 * Wraps a handler that receives (request, slug).
 */
export function withExpiryCheck(
  handler: (req: Request, slug: string, env: Env) => Promise<Response>,
) {
  return async (req: Request, slug: string, env: Env): Promise<Response> => {
    const store = createLinkStore(env.KV);
    const link = await store.get(slug);

    if (!link) {
      return handler(req, slug, env);
    }

    if (isExpired(link.expiresAt)) {
      // Optionally auto-delete on access
      await store.delete(slug);
      return Response.json(
        { error: 'This link has expired', slug },
        { status: 410 },
      );
    }

    return handler(req, slug, env);
  };
}
