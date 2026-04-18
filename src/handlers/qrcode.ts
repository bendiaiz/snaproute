import { createLinkStore } from "../store/kv";
import { buildQRCodeUrl, qrOptionsFromParams } from "../utils/qrcode";

export interface QRCodeEnv {
  KV: KVNamespace;
  BASE_URL: string;
}

export function createQRCodeHandler(env: QRCodeEnv) {
  const store = createLinkStore(env.KV);

  return async function handleQRCode(request: Request, slug: string): Promise<Response> {
    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const link = await store.get(slug);
    if (!link) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const options = qrOptionsFromParams(url.searchParams);
    const shortUrl = `${env.BASE_URL.replace(/\/$/, "")}/${slug}`;
    const qrUrl = buildQRCodeUrl(shortUrl, options);

    const accept = request.headers.get("Accept") ?? "";
    if (accept.includes("text/html")) {
      const html = `<!DOCTYPE html><html><body><img src="${qrUrl}" alt="QR code for ${slug}" /></body></html>`;
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(
      JSON.stringify({ slug, short_url: shortUrl, qr_url: qrUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };
}
