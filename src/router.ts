import { createShortenHandler } from './handlers/shorten';
import { createRedirectHandler } from './handlers/redirect';
import { createStatsHandler } from './handlers/stats';
import { createDeleteHandler } from './handlers/delete';
import { createListHandler } from './handlers/list';
import { parseEnv } from './config/env';

export interface Env {
  SNAP_KV: KVNamespace;
  API_SECRET?: string;
  BASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const config = parseEnv(env);
    const { pathname, method } = new URL(request.url);
    const kv: KVNamespace = env.SNAP_KV;

    if (method === 'POST' && pathname === '/api/shorten') {
      return createShortenHandler(kv, config)(request);
    }

    if (method === 'GET' && pathname === '/api/links') {
      return createListHandler(kv)(request);
    }

    if (method === 'GET' && pathname.startsWith('/api/stats/')) {
      const slug = pathname.replace('/api/stats/', '');
      return createStatsHandler(kv)(slug);
    }

    if (method === 'DELETE' && pathname.startsWith('/api/links/')) {
      const slug = pathname.replace('/api/links/', '');
      return createDeleteHandler(kv)(slug, request);
    }

    if (method === 'GET' && pathname !== '/') {
      const slug = pathname.slice(1);
      return createRedirectHandler(kv)(slug);
    }

    return new Response('Not Found', { status: 404 });
  },
};
