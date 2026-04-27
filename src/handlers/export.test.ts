import { describe, it, expect, vi } from "vitest";
import { createExportHandler } from "./export";
import type { LinkRecord } from "../store/kv";

const makeLink = (slug: string, overrides: Partial<LinkRecord> = {}): LinkRecord => ({
  slug,
  url: `https://example.com/${slug}`,
  createdAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

function createMockKV(links: LinkRecord[] = []) {
  return {
    list: vi.fn(async () => links),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as KVNamespace;
}

describe("createExportHandler", () => {
  it("returns JSON by default", async () => {
    const kv = createMockKV([makeLink("abc")]);
    const handler = createExportHandler({ LINKS: kv });
    const res = await handler(new Request("https://snap.io/export"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].slug).toBe("abc");
  });

  it("returns CSV when format=csv", async () => {
    const kv = createMockKV([makeLink("xyz")]);
    const handler = createExportHandler({ LINKS: kv });
    const res = await handler(new Request("https://snap.io/export?format=csv"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("slug,url");
    expect(text).toContain("xyz");
  });

  it("sets Content-Disposition header with filename", async () => {
    const kv = createMockKV([makeLink("abc")]);
    const handler = createExportHandler({ LINKS: kv });
    const res = await handler(new Request("https://snap.io/export"));
    const cd = res.headers.get("Content-Disposition") ?? "";
    expect(cd).toContain("attachment");
    expect(cd).toContain(".json");
  });

  it("filters by tag when tag param provided", async () => {
    const kv = createMockKV([
      makeLink("a", { tags: ["promo"] }),
      makeLink("b", { tags: ["internal"] }),
    ]);
    const handler = createExportHandler({ LINKS: kv });
    const res = await handler(new Request("https://snap.io/export?tag=promo"));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].slug).toBe("a");
  });

  it("returns empty JSON array when no links", async () => {
    const kv = createMockKV([]);
    const handler = createExportHandler({ LINKS: kv });
    const res = await handler(new Request("https://snap.io/export"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("sets X-Total-Count header", async () => {
    const kv = createMockKV([makeLink("a"), makeLink("b")]);
    const handler = createExportHandler({ LINKS: kv });
    const res = await handler(new Request("https://snap.io/export"));
    expect(res.headers.get("X-Total-Count")).toBe("2");
  });
});
