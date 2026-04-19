/**
 * Handler: update the alias (custom slug) of an existing link
 */

import { createLinkStore } from '../store/kv';
import { validateAlias } from '../utils/alias';

export function createAliasHandler(kv: KVNamespace, baseUrl: string) {
  const store = createLinkStore(kv);

  return async function aliasHandler(request: Request, slug: string): Promise<Response> {
    if (request.method !== 'PATCH' && request.method !== 'PUT') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const existing = await store.get(slug);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawAlias = typeof body.alias === 'string' ? body.alias : '';
    const validation = validateAlias(rawAlias);

    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newSlug = validation.alias!;

    const collision = await store.get(newSlug);
    if (collision) {
      return new Response(JSON.stringify({ error: 'Alias already in use' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await store.put(newSlug, existing);
    await store.delete(slug);

    const shortUrl = `${baseUrl}/${newSlug}`;
    return new Response(JSON.stringify({ slug: newSlug, shortUrl, url: existing.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
