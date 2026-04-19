import { describe, it, expect } from "vitest";
import { createBulkImportHandler } from "./bulkimport";

function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => { store.set(k, v); },
    delete: async (k: string) => { store.delete(k); },
    list: async () => ({ keys: [], list_complete: true, cursor: undefined }),
    getWithMetadata: async (k: string) => ({ value: store.get(k) ?? null, metadata: null }),
  } as unknown as KVNamespace;
}

const makeEnv = () => ({ KV: createMockKV(), BASE_URL: "https://snap.io" });

const makeRequest = (body: unknown) =>
  new Request("https://snap.io/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("createBulkImportHandler", () => {
  it("returns 207 with summary on valid input", async () => {
    const handler = createBulkImportHandler(makeEnv());
    const res = await handler(makeRequest([{ url: "https://example.com" }]));
    expect(res.status).toBe(207);
    const json = await res.json() as { created: number; failed: number };
    expect(json.created).toBe(1);
    expect(json.failed).toBe(0);
  });

  it("returns 422 on invalid body", async () => {
    const handler = createBulkImportHandler(makeEnv());
    const res = await handler(makeRequest({ url: "https://x.com" }));
    expect(res.status).toBe(422);
  });

  it("returns 400 on non-JSON", async () => {
    const handler = createBulkImportHandler(makeEnv());
    const req = new Request("https://snap.io/bulk", { method: "POST", body: "not json" });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("records failures for duplicate aliases", async () => {
    const env = makeEnv();
    const handler = createBulkImportHandler(env);
    await handler(makeRequest([{ url: "https://a.com", alias: "dup" }]));
    const res = await handler(makeRequest([{ url: "https://b.com", alias: "dup" }]));
    const json = await res.json() as { failed: number };
    expect(json.failed).toBe(1);
  });
});
