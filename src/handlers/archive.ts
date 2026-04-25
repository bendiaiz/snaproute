/**
 * Archive / restore / list-archived handlers
 */
import { createLinkStore } from "../store/kv";
import { buildArchivedLink, archivedLinkToJson, archiveKey } from "../utils/linkarchive";

type Env = { KV: KVNamespace };

export function createArchiveHandler(env: Env) {
  const store = createLinkStore(env.KV);

  return async function archiveHandler(request: Request, slug: string): Promise<Response> {
    const method = request.method.toUpperCase();

    // POST /archive/:slug  — archive a link
    if (method === "POST") {
      const link = await store.get(slug);
      if (!link) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const archived = buildArchivedLink(slug, link.url, link.createdAt);
      await env.KV.put(archiveKey(slug), JSON.stringify(archived));
      await store.delete(slug);

      return new Response(JSON.stringify(archivedLinkToJson(archived)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // DELETE /archive/:slug — restore a link
    if (method === "DELETE") {
      const raw = await env.KV.get(archiveKey(slug));
      if (!raw) {
        return new Response(JSON.stringify({ error: "Not archived" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const archived = JSON.parse(raw);
      await store.put(slug, { url: archived.url, createdAt: archived.originalCreatedAt });
      await env.KV.delete(archiveKey(slug));

      return new Response(JSON.stringify({ restored: true, slug }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  };
}
