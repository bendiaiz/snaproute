import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildWebhookPayload,
  dispatchWebhook,
  signPayload,
  webhookOptionsFromEnv,
} from "./webhook";

describe("webhookOptionsFromEnv", () => {
  it("returns null when WEBHOOK_URL is missing", () => {
    expect(webhookOptionsFromEnv({})).toBeNull();
  });

  it("returns options with url and secret", () => {
    const opts = webhookOptionsFromEnv({
      WEBHOOK_URL: "https://example.com/hook",
      WEBHOOK_SECRET: "s3cr3t",
    });
    expect(opts?.url).toBe("https://example.com/hook");
    expect(opts?.secret).toBe("s3cr3t");
  });

  it("parses WEBHOOK_EVENTS list", () => {
    const opts = webhookOptionsFromEnv({
      WEBHOOK_URL: "https://example.com/hook",
      WEBHOOK_EVENTS: "link.created, link.deleted",
    });
    expect(opts?.events).toEqual(["link.created", "link.deleted"]);
  });
});

describe("buildWebhookPayload", () => {
  it("includes event, slug, and timestamp", () => {
    const p = buildWebhookPayload("link.created", "abc123", { url: "https://example.com" });
    expect(p.event).toBe("link.created");
    expect(p.slug).toBe("abc123");
    expect(p.url).toBe("https://example.com");
    expect(typeof p.timestamp).toBe("string");
  });
});

describe("signPayload", () => {
  it("returns a hex string", async () => {
    const sig = await signPayload("hello", "secret");
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for same inputs", async () => {
    const a = await signPayload("data", "key");
    const b = await signPayload("data", "key");
    expect(a).toBe(b);
  });
});

describe("dispatchWebhook", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("returns false when event is filtered out", async () => {
    const result = await dispatchWebhook(
      { url: "https://example.com/hook", events: ["link.deleted"] },
      buildWebhookPayload("link.created", "abc")
    );
    expect(result).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts payload and returns true on success", async () => {
    const result = await dispatchWebhook(
      { url: "https://example.com/hook" },
      buildWebhookPayload("link.clicked", "abc")
    );
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("returns false on fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const result = await dispatchWebhook(
      { url: "https://example.com/hook" },
      buildWebhookPayload("link.created", "abc")
    );
    expect(result).toBe(false);
  });
});
