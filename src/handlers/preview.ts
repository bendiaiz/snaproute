import { createLinkStore } from "../store/kv";
import { createAnalyticsStore } from "../store/analytics";
import { buildPreview, previewToHtml } from "../utils/preview";

export interface PreviewEnv {
  KV: KVNamespace;
  BASE_URL: string;
}

export function createPreviewHandler(env: PreviewEnv) {
  const links = createLinkStore(env.KV);
  const analytics = createAnalyticsStore(env.KV);

  return async (request: Request, slug: string): Promise<Response> => {
    const accept = request.headers.get("accept") ?? "";

    const entry = await links.get(slug);
    if (!entry) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    const events = await analytics.getEvents(slug);
    const clicks = events.length;

    const preview = buildPreview(
      env.BASE_URL,
      slug,
      entry.url,
      clicks,
      entry.createdAt
    );

    if (accept.includes("text/html")) {
      return new Response(previewToHtml(preview), {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    return new Response(JSON.stringify(preview), {
      headers: { "content-type": "application/json" },
    });
  };
}
