import { createLinkStore } from '../store/kv';
import { isExpired } from '../utils/expiry';

export interface Env {
  KV: KVNamespace;
  BASE_URL: string;
}

/**
 * Handler: GET /api/links/:slug/expire
 * Returns expiry info for a link, and whether it has expired.
 */
export function createExpireHandler(env: Env) {
  const store = createLinkStore(env.KV);

  return async (request: Request, slug: string): Promise<Response> => {
    const link = await store.get(slug);

    if (!link) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const expired = isExpired(link.expiresAt);

    if (request.method === 'DELETE' && expired) {
      await store.delete(slug);
      return Response.json({ slug, deleted: true, reason: 'expired' });
    }

    return Response.json({
      slug,
      expiresAt: link.expiresAt ?? null,
      expired,
    });
  };
}
