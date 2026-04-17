import { parseEnv } from './config/env';
import { createDeleteHandler } from './handlers/delete';

export interface Env {
  KV: KVNamespace;
  ADMIN_SECRET: string;
  BASE_URL: string;
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const config = parseEnv(env);
  const url = new URL(request.url);
  const { pathname, method } = url as { pathname: string } & { method?: string };
  const reqMethod = request.method;

  // DELETE /api/links/:slug
  if (reqMethod === 'DELETE' && pathname.startsWith('/api/links/')) {
    const deleteHandler = createDeleteHandler(env.KV, config.adminSecret);
    return deleteHandler(request);
  }

  // POST /api/shorten
  if (reqMethod === 'POST' && pathname === '/api/shorten') {
    const { createShortenHandler } = await import('./handlers/shorten');
    return createShortenHandler(env.KV, config.baseUrl)(request);
  }

  // GET /api/stats/:slug
  if (reqMethod === 'GET' && pathname.startsWith('/api/stats/')) {
    const { createStatsHandler } = await import('./handlers/stats');
    return createStatsHandler(env.KV)(request);
  }

  // GET /:slug — redirect
  if (reqMethod === 'GET' && pathname.length > 1) {
    const { createRedirectHandler } = await import('./handlers/redirect');
    return createRedirectHandler(env.KV)(request);
  }

  return new Response('Not Found', { status: 404 });
}
