export interface WebhookPayload {
  event: "link.created" | "link.clicked" | "link.deleted" | "link.expired";
  slug: string;
  url?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface WebhookOptions {
  url: string;
  secret?: string;
  events?: WebhookPayload["event"][];
}

export function webhookOptionsFromEnv(
  env: Record<string, string | undefined>
): WebhookOptions | null {
  const url = env["WEBHOOK_URL"];
  if (!url) return null;
  return {
    url,
    secret: env["WEBHOOK_SECRET"],
    events: env["WEBHOOK_EVENTS"]
      ? (env["WEBHOOK_EVENTS"].split(",").map((e) => e.trim()) as WebhookPayload["event"][])
      : undefined,
  };
}

export function buildWebhookPayload(
  event: WebhookPayload["event"],
  slug: string,
  extra?: Partial<Omit<WebhookPayload, "event" | "slug" | "timestamp">>
): WebhookPayload {
  return {
    event,
    slug,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

export async function signPayload(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function dispatchWebhook(
  options: WebhookOptions,
  payload: WebhookPayload
): Promise<boolean> {
  if (options.events && !options.events.includes(payload.event)) {
    return false;
  }
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.secret) {
    headers["X-Snaproute-Signature"] = await signPayload(body, options.secret);
  }
  try {
    const res = await fetch(options.url, { method: "POST", headers, body });
    return res.ok;
  } catch {
    return false;
  }
}
