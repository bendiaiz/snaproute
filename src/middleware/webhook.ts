import { dispatchWebhook, webhookOptionsFromEnv, buildWebhookPayload, WebhookPayload } from "../utils/webhook";

export type WebhookEnv = Record<string, string | undefined>;

export type WebhookEventHandler = (
  event: WebhookPayload["event"],
  slug: string,
  extra?: Partial<Omit<WebhookPayload, "event" | "slug" | "timestamp">>
) => Promise<void>;

export function createWebhookEmitter(env: WebhookEnv): WebhookEventHandler {
  const options = webhookOptionsFromEnv(env);

  return async (event, slug, extra) => {
    if (!options) return;
    const payload = buildWebhookPayload(event, slug, extra);
    await dispatchWebhook(options, payload);
  };
}

export function withWebhookEmitter(
  handler: (req: Request, env: WebhookEnv, emit: WebhookEventHandler) => Promise<Response>
) {
  return (req: Request, env: WebhookEnv): Promise<Response> => {
    const emit = createWebhookEmitter(env);
    return handler(req, env, emit);
  };
}
