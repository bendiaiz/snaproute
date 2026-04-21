import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWebhookEmitter, withWebhookEmitter } from "./webhook";

const baseEnv = {
  WEBHOOK_URL: "https://hooks.example.com/snap",
  WEBHOOK_SECRET: "topsecret",
};

describe("createWebhookEmitter", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("does nothing when WEBHOOK_URL is not set", async () => {
    const emit = createWebhookEmitter({});
    await emit("link.created", "abc");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("dispatches webhook when URL is configured", async () => {
    const emit = createWebhookEmitter(baseEnv);
    await emit("link.created", "abc", { url: "https://example.com" });
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://hooks.example.com/snap");
    const body = JSON.parse(init.body);
    expect(body.event).toBe("link.created");
    expect(body.slug).toBe("abc");
    expect(body.url).toBe("https://example.com");
  });

  it("includes signature header when secret is set", async () => {
    const emit = createWebhookEmitter(baseEnv);
    await emit("link.deleted", "xyz");
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers["X-Snaproute-Signature"]).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("withWebhookEmitter", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("passes emit function to inner handler", async () => {
    const inner = vi.fn().mockResolvedValue(new Response("ok"));
    const wrapped = withWebhookEmitter(inner);
    const req = new Request("https://snap.test/");
    const res = await wrapped(req, baseEnv);
    expect(res.status).toBe(200);
    expect(inner).toHaveBeenCalledOnce();
    const [, , emit] = inner.mock.calls[0];
    expect(typeof emit).toBe("function");
  });
});
