import { createLinkStore, KVStore } from '../store/kv';

export async function handleRedirect(
  slug: string,
  kv: KVStore
): Promise<{ status: number; location?: string; body?: object }> {
  if (!slug) {
    return { status: 400, body: { error: 'Missing slug' } };
  }

  const store = createLinkStore(kv);
  const record = await store.getLink(slug);

  if (!record) {
    return { status: 404, body: { error: 'Not found' } };
  }

  if (record.expiresAt && Date.now() > record.expiresAt) {
    await store.deleteLink(slug);
    return { status: 410, body: { error: 'Link expired' } };
  }

  return { status: 301, location: record.url };
}
