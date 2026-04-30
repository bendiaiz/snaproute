import { createLinkStore } from '../store/kv';
import { cloneLink, cloneResultToJson } from '../utils/linkclone';
import { generateSlug } from '../utils/nanoid';
import { sanitizeAlias } from '../utils/slugify';

export function createCloneHandler(env: Record<string, string>) {
  const store = createLinkStore(env.KV as unknown as KVNamespace);
  const baseUrl = env.BASE_URL ?? 'https://localhost';

  return async function cloneHandler(request: Request, slug: string): Promise<Response> {
    const existing = await store.get(slug);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const includePassword = body.includePassword === true;
    const includeExpiry = body.includeExpiry === true;

    let newSlug: string;
    if (typeof body.slug === 'string' && body.slug.length > 0) {
      const alias = sanitizeAlias(body.slug);
      if (!alias) {
        return new Response(JSON.stringify({ error: 'Invalid slug' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const conflict = await store.get(alias);
      if (conflict) {
        return new Response(JSON.stringify({ error: 'Slug already taken' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      newSlug = alias;
    } else {
      newSlug = generateSlug();
    }

    const cloned = cloneLink(existing, newSlug, { includePassword, includeExpiry });
    await store.put(newSlug, cloned);

    const json = cloneResultToJson(existing, cloned, baseUrl);
    return new Response(JSON.stringify(json), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
