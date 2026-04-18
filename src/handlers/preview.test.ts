import { describe, it, expect } from "vitest";
import { createPreviewHandler } from "./preview";

function createMockKV(data: Record<string, string> = {}): KVNamespace {
  const store = new Map(Object.entries(data));
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value); },
    delete: async (key: string) => { store.delete(key); },
    list: async () => ({ keys: [], list_complete: true, cursor: "" }),
  } as unknown as KVNamespace;
}

const BASE_URL = "https://snap.io";

function makeEnv(kv: KVNamespace) {
  return { KV: kv, BASE_URL };
}

describe("createPreviewHandler", () => {
  it("returns 404 for unknown slug", async () => {
    const handler = createPreviewHandler(makeEnv(createMockKV()));
    const res = await handler(new Request("https://snap.io/preview/nope"), "nope");
    expect(res.status).toBe(404);
  });

  it("returns JSON preview by default", async () => {
    const kv = createMockKV({
      "link:abc": JSON.stringify({ url: "https://example.com", createdAt: "2024-01-01" }),
      "events:abc": JSON.stringify([]),
    });
    const handler = createPreviewHandler(makeEnv(kv));
    const res = await handler(new Request("https://snap.io/preview/abc"), "abc");
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.slug).toBe("abc");
    expect(body.shortUrl).toBe("https://snap.io/abc");
  });

  it("returns HTML when accept header is text/html", async () => {
    const kv = createMockKV({
      "link:abc": JSON.stringify({ url: "https://example.com", createdAt: "2024-01-01" }),
      "events:abc": JSON.stringify([]),
    });
    const handler = createPreviewHandler(makeEnv(kv));
    const req = new Request("https://snap.io/preview/abc", {
      headers: { accept: "text/html" },
    });
    const res = await handler(req, "abc");
    expect(res.headers.get("content-type")).toContain("text/html");
    const text = await res.text();
    expect(text).toContain("<!DOCTYPE html>");
  });
});
