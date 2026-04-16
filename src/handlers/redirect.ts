import { createLinkStore } from '../store/kv';
import { isValidSlug } from '../utils/nanoid';

export interface LinkRecord {
  url: string;
  createdAt: number;
  hits: number;
}

export async function handleRedirect(
  _req: Request,
  kv: KVNamespace,
  slug: string
): Promise<Response> {
  if (!isValidSlug(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = createLinkStore(kv);
  const raw = await store.get(slug);

  if (!raw) {
    return new Response(JSON.stringify({ error: 'Short link not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let record: LinkRecord;
  try {
    record = JSON.parse(raw) as LinkRecord;
  } catch {
    return new Response(JSON.stringify({ error: 'Corrupted link record' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updated: LinkRecord = { ...record, hits: record.hits + 1 };
  await store.put(slug, JSON.stringify(updated));

  return new Response(null, {
    status: 302,
    headers: { Location: record.url },
  });
}
