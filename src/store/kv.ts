export interface LinkRecord {
  url: string;
  createdAt: number;
  clicks: number;
  expiresAt?: number;
}

export interface LinkStore {
  get(slug: string): Promise<LinkRecord | null>;
  put(slug: string, record: LinkRecord): Promise<void>;
  delete(slug: string): Promise<void>;
  incrementClicks(slug: string): Promise<void>;
}

export function createLinkStore(kv: KVNamespace): LinkStore {
  return {
    async get(slug) {
      const raw = await kv.get(slug);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as LinkRecord;
      } catch {
        return null;
      }
    },

    async put(slug, record) {
      await kv.put(slug, JSON.stringify(record));
    },

    async delete(slug) {
      await kv.delete(slug);
    },

    async incrementClicks(slug) {
      const record = await this.get(slug);
      if (!record) return;
      record.clicks += 1;
      await kv.put(slug, JSON.stringify(record));
    },
  };
}
