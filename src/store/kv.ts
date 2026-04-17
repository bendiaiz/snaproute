export interface LinkRecord {
  slug: string;
  url: string;
  createdAt: number;
  expiresAt?: number;
}

export interface KVStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export function createLinkStore(kv: KVStore) {
  const PREFIX = 'link:';

  return {
    async getLink(slug: string): Promise<LinkRecord | null> {
      const raw = await kv.get(`${PREFIX}${slug}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as LinkRecord;
      } catch {
        return null;
      }
    },

    async putLink(record: LinkRecord, ttl?: number): Promise<void> {
      const options = ttl ? { expirationTtl: ttl } : undefined;
      await kv.put(`${PREFIX}${record.slug}`, JSON.stringify(record), options);
    },

    async deleteLink(slug: string): Promise<void> {
      await kv.delete(`${PREFIX}${slug}`);
    },

    /**
     * Checks whether a link exists and has not expired.
     * Relies on the stored `expiresAt` field for expiry validation
     * in cases where KV TTL may not have evicted the key yet.
     */
    async linkExists(slug: string): Promise<boolean> {
      const record = await this.getLink(slug);
      if (!record) return false;
      if (record.expiresAt && record.expiresAt < Date.now()) return false;
      return true;
    },
  };
}
