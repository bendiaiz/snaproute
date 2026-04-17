import { createLinkStore } from '../store/kv';

export interface StatsResponse {
  slug: string;
  url: string;
  clicks: number;
  createdAt: string;
  lastClickedAt: string | null;
}

export function createStatsHandler(kv: KVNamespace) {
  const store = createLinkStore(kv);

  return async function statsHandler(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    const slug = pathname.replace(/^\/api\/stats\//, '').trim();

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Missing slug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const link = await store.get(slug);

    if (!link) {
      return new Response(JSON.stringify({ error: 'Slug not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stats: StatsResponse = {
      slug,
      url: link.url,
      clicks: link.clicks ?? 0,
      createdAt: link.createdAt,
      lastClickedAt: link.lastClickedAt ?? null,
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
