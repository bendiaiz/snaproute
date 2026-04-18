import { createLinkStore } from '../store/kv';
import { generateSlug, isValidSlug } from '../utils/nanoid';
import { sanitizeAlias, isReservedSlug } from '../utils/slugify';
import { parseEnv } from '../config/env';

interface ShortenBody {
  url: string;
  alias?: string;
}

export function createShortenHandler(env: Record<string, unknown>) {
  const { BASE_URL } = parseEnv(env);
  const store = createLinkStore(env.KV as KVNamespace);

  return async (request: Request): Promise<Response> => {
    let body: ShortenBody;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { url, alias } = body;

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'Missing required field: url' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return Response.json({ error: 'Invalid URL' }, { status: 400 });
    }

    let slug: string;

    if (alias !== undefined) {
      const cleaned = sanitizeAlias(alias);
      if (!cleaned) {
        return Response.json({ error: 'Invalid alias: must be 3-64 alphanumeric/hyphen/underscore chars' }, { status: 400 });
      }
      if (isReservedSlug(cleaned)) {
        return Response.json({ error: 'Alias is reserved' }, { status: 409 });
      }
      const existing = await store.get(cleaned);
      if (existing) {
        return Response.json({ error: 'Alias already in use' }, { status: 409 });
      }
      slug = cleaned;
    } else {
      slug = generateSlug();
    }

    await store.put(slug, { url, createdAt: new Date().toISOString() });

    return Response.json(
      { slug, shortUrl: `${BASE_URL}/${slug}`, url },
      { status: 201 }
    );
  };
}
