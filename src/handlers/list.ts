import { createLinkStore } from '../store/kv';

export interface LinkEntry {
  slug: string;
  url: string;
  createdAt: string;
  clicks: number;
}

export interface ListResponse {
  links: LinkEntry[];
  total: number;
}

export function createListHandler(kv: KVNamespace) {
  const store = createLinkStore(kv);

  return async function listHandler(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const cursor = searchParams.get('cursor') ?? undefined;

    let result: { keys: { name: string }[]; list_complete: boolean; cursor?: string };
    try {
      result = await kv.list({ prefix: 'link:', limit, cursor });
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to list links' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const links: LinkEntry[] = [];
    for (const key of result.keys) {
      const slug = key.name.replace('link:', '');
      const entry = await store.get(slug);
      if (entry) {
        links.push({
          slug,
          url: entry.url,
          createdAt: entry.createdAt,
          clicks: entry.clicks ?? 0,
        });
      }
    }

    const body: ListResponse & { cursor?: string } = {
      links,
      total: links.length,
      ...(result.list_complete ? {} : { cursor: result.cursor }),
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
