import { describe, it, expect, vi } from "vitest";
import { createPasswordHandler } from "./password";

function createMockKV(data: Record<string, unknown> = {}): KVNamespace {
  const store = new Map(Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace;
}

describe("createPasswordHandler", () => {
  const slug = "abc123";
  const link = { url: "https://example.com", password: "secret" };

  it("returns 404 for unknown slug", async () => {
    const handler = createPasswordHandler(createMockKV());
    const res = await handler(new Request("http://localhost"), slug);
    expect(res.status).toBe(404);
  });

  it("returns 400 if link has no password", async () => {
    const kv = createMockKV({ [slug]: { url: "https://example.com" } });
    const handler = createPasswordHandler(kv);
    const res = await handler(new Request("http://localhost"), slug);
    expect(res.status).toBe(400);
  });

  it("returns password required response on GET", async () => {
    const kv = createMockKV({ [slug]: link });
    const handler = createPasswordHandler(kv);
    const res = await handler(new Request("http://localhost", { method: "GET" }), slug);
    expect(res.status).toBe(401);
  });

  it("returns 403 on wrong password", async () => {
    const kv = createMockKV({ [slug]: link });
    const handler = createPasswordHandler(kv);
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ password: "wrong" }),
        headers: { "Content-Type": "application/json" },
      }),
      slug
    );
    expect(res.status).toBe(403);
  });

  it("returns url on correct password", async () => {
    const kv = createMockKV({ [slug]: link });
    const handler = createPasswordHandler(kv);
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ password: "secret" }),
        headers: { "Content-Type": "application/json" },
      }),
      slug
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe("https://example.com");
  });
});
