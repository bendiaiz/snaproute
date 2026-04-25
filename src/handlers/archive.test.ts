import { describe, it, expect, beforeEach } from "vitest";
import { createArchiveHandler } from "./archive";

function createMockKV() {
  const store = new Map<string, string>();
  return {
    _store: store,
    async get(key: string) { return store.get(key) ?? null; },
    async put(key: string, value: string) { store.set(key, value); },
    async delete(key: string) { store.delete(key); },
  };
}

function makeEnv(kv: ReturnType<typeof createMockKV>) {
  return { KV: kv as unknown as KVNamespace };
}

describe("createArchiveHandler", () => {
  let kv: ReturnType<typeof createMockKV>;

  beforeEach(() => {
    kv = createMockKV();
  });

  it("archives an existing link", async () => {
    kv._store.set("abc", JSON.stringify({ url: "https://example.com", createdAt: "2024-01-01T00:00:00.000Z" }));
    const handler = createArchiveHandler(makeEnv(kv));
    const res = await handler(new Request("http://localhost", { method: "POST" }), "abc");
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.slug).toBe("abc");
    expect(body.url).toBe("https://example.com");
    expect(typeof body.archivedAt).toBe("string");
    // original link removed
    expect(kv._store.has("abc")).toBe(false);
    // archive entry created
    expect(kv._store.has("archive:abc")).toBe(true);
  });

  it("returns 404 when archiving a non-existent link", async () => {
    const handler = createArchiveHandler(makeEnv(kv));
    const res = await handler(new Request("http://localhost", { method: "POST" }), "missing");
    expect(res.status).toBe(404);
  });

  it("restores an archived link", async () => {
    const archived = { slug: "abc", url: "https://example.com", archivedAt: "2024-06-01T00:00:00.000Z", originalCreatedAt: "2024-01-01T00:00:00.000Z" };
    kv._store.set("archive:abc", JSON.stringify(archived));
    const handler = createArchiveHandler(makeEnv(kv));
    const res = await handler(new Request("http://localhost", { method: "DELETE" }), "abc");
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.restored).toBe(true);
    expect(kv._store.has("archive:abc")).toBe(false);
    expect(kv._store.has("abc")).toBe(true);
  });

  it("returns 404 when restoring a non-archived link", async () => {
    const handler = createArchiveHandler(makeEnv(kv));
    const res = await handler(new Request("http://localhost", { method: "DELETE" }), "notarchived");
    expect(res.status).toBe(404);
  });

  it("returns 405 for unsupported methods", async () => {
    const handler = createArchiveHandler(makeEnv(kv));
    const res = await handler(new Request("http://localhost", { method: "GET" }), "abc");
    expect(res.status).toBe(405);
  });
});
