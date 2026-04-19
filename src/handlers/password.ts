import { createLinkStore } from "../store/kv";
import { passwordRequiredResponse, passwordForbiddenResponse } from "../utils/password";

export function createPasswordHandler(kv: KVNamespace) {
  const store = createLinkStore(kv);

  return async function handler(request: Request, slug: string): Promise<Response> {
    const link = await store.get(slug);

    if (!link) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!link.password) {
      return new Response(JSON.stringify({ error: "No password set" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "GET") {
      return passwordRequiredResponse(slug);
    }

    if (request.method === "POST") {
      let body: { password?: string };
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!body.password || body.password !== link.password) {
        return passwordForbiddenResponse();
      }

      return new Response(JSON.stringify({ url: link.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method Not Allowed", { status: 405 });
  };
}
