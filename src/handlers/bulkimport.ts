import { createLinkStore } from "../store/kv";
import { generateSlug } from "../utils/nanoid";
import { sanitizeAlias } from "../utils/slugify";
import { parseBulkImportBody, buildBulkResultSummary, BulkImportEntry, BulkImportResult } from "../utils/bulkimport";
import { expiresAtFromTtl } from "../utils/expiry";

export function createBulkImportHandler(env: { KV: KVNamespace; BASE_URL: string }) {
  const store = createLinkStore(env.KV);

  return async (request: Request): Promise<Response> => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    let entries: BulkImportEntry[];
    try {
      entries = parseBulkImportBody(body);
    } catch (e: unknown) {
      return new Response(JSON.stringify({ error: (e as Error).message }), { status: 422 });
    }

    const result: BulkImportResult = { success: [], failed: [] };

    for (const entry of entries) {
      try {
        let slug = entry.alias ? sanitizeAlias(entry.alias) : generateSlug();
        const existing = await store.get(slug);
        if (existing) {
          if (entry.alias) throw new Error("alias already taken");
          slug = generateSlug();
        }
        const expiresAt = entry.ttl ? expiresAtFromTtl(entry.ttl) : undefined;
        await store.put(slug, { url: entry.url, slug, tags: entry.tags, expiresAt, createdAt: Date.now() });
        result.success.push({ ...entry, slug });
      } catch (e: unknown) {
        result.failed.push({ entry, reason: (e as Error).message });
      }
    }

    return new Response(JSON.stringify(buildBulkResultSummary(result)), {
      status: 207,
      headers: { "Content-Type": "application/json" },
    });
  };
}
