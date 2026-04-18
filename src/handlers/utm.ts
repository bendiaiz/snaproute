import { createLinkStore } from '../store/kv';
import { parseUTMParams, appendUTMParams, hasUTMParams, serializeUTM } from '../utils/utm';

export function createUTMHandler(kv: KVNamespace) {
  const store = createLinkStore(kv);

  return async function utmHandler(request: Request, slug: string): Promise<Response> {
    const link = await store.get(slug);
    if (!link) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'GET') {
      const existing = new URL(link.url);
      const utm = parseUTMParams(existing.searchParams);
      return new Response(JSON.stringify({ slug, utm: serializeUTM(utm) }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'PUT') {
      const body = await request.json<Record<string, string>>();
      const utm = {
        source: body['utm_source'],
        medium: body['utm_medium'],
        campaign: body['utm_campaign'],
        term: body['utm_term'],
        content: body['utm_content'],
      };
      if (!hasUTMParams(utm)) {
        return new Response(JSON.stringify({ error: 'No UTM params provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const updatedUrl = appendUTMParams(link.url, utm);
      await store.put(slug, { ...link, url: updatedUrl });
      return new Response(JSON.stringify({ slug, url: updatedUrl, utm: serializeUTM(utm) }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method Not Allowed', { status: 405 });
  };
}
