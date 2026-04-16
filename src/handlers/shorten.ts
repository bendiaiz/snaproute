import { generateSlug, isValidSlug } from '../utils/nanoid';
import { createLinkStore, KVStore, LinkRecord } from '../store/kv';

export interface ShortenRequest {
  url: string;
  customSlug?: string;
  ttl?: number;
}

export interface ShortenResponse {
  slug: string;
  shortUrl: string;
  expiresAt?: number;
}

export async function handleShorten(
  req: ShortenRequest,
  kv: KVStore,
  baseUrl: string
): Promise<{ status: number; body: object }> {
  const { url, customSlug, ttl } = req;

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return { status: 400, body: { error: 'Invalid URL' } };
  }

  let slug = customSlug ?? generateSlug();

  if (customSlug && !isValidSlug(customSlug)) {
    return { status: 400, body: { error: 'Invalid custom slug' } };
  }

  const store = createLinkStore(kv);

  if (customSlug) {
    const existing = await store.getLink(slug);
    if (existing) {
      return { status: 409, body: { error: 'Slug already in use' } };
    }
  }

  const now = Date.now();
  const record: LinkRecord = {
    slug,
    url,
    createdAt: now,
    ...(ttl ? { expiresAt: now + ttl * 1000 } : {}),
  };

  await store.putLink(record, ttl);

  const response: ShortenResponse = {
    slug,
    shortUrl: `${baseUrl}/${slug}`,
    ...(record.expiresAt ? { expiresAt: record.expiresAt } : {}),
  };

  return { status: 201, body: response };
}
