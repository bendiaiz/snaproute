import { createLinkStore } from '../store/kv';
import { isValidSlug } from '../utils/nanoid';

export function createDeleteHandler(kv: KVNamespace, adminSecret: string) {
  return async function deleteHandler(request: Request): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const slug = url.pathname.split('/').pop();

    if (!slug || !isValidSlug(slug)) {
      return new Response(JSON.stringify({ error: 'Invalid slug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const store = createLinkStore(kv);
    const existing = await store.get(slug);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Slug not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await store.delete(slug);

    return new Response(JSON.stringify({ success: true, slug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
