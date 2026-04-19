import { describe, it, expect } from "vitest";
import { buildLinkInfo, linkInfoToJson } from "./linkinfo";
import type { LinkData } from "../store/kv";

const BASE_URL = "https://snap.io";

function makeLink(overrides: Partial<LinkData> = {}): LinkData {
  return {
    url: "https://example.com",
    createdAt: "2024-01-01T00:00:00.000Z",
    clicks: 5,
    tags: ["news", "tech"],
    ...overrides,
  };
}

describe("buildLinkInfo", () => {
  it("builds basic info", () => {
    const info = buildLinkInfo("abc123", makeLink(), BASE_URL);
    expect(info.slug).toBe("abc123");
    expect(info.shortUrl).toBe("https://snap.io/abc123");
    expect(info.clicks).toBe(5);
    expect(info.tags).toEqual(["news", "tech"]);
    expect(info.expired).toBe(false);
  });

  it("marks expired links", () => {
    const link = makeLink({ expiresAt: "2020-01-01T00:00:00.000Z" });
    const info = buildLinkInfo("xyz", link, BASE_URL);
    expect(info.expired).toBe(true);
    expect(info.expiresAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("includes alias when present", () => {
    const link = makeLink({ alias: "my-link" });
    const info = buildLinkInfo("abc", link, BASE_URL);
    expect(info.alias).toBe("my-link");
  });

  it("defaults clicks to 0 if missing", () => {
    const link = makeLink({ clicks: undefined });
    const info = buildLinkInfo("abc", link, BASE_URL);
    expect(info.clicks).toBe(0);
  });
});

describe("linkInfoToJson", () => {
  it("serializes to flat JSON-friendly object", () => {
    const info = buildLinkInfo("abc", makeLink(), BASE_URL);
    const json = linkInfoToJson(info);
    expect(json.slug).toBe("abc");
    expect(json.short_url).toBe("https://snap.io/abc");
    expect(json.tags).toBe("news,tech");
    expect(json.clicks).toBe(5);
  });

  it("omits alias when not set", () => {
    const info = buildLinkInfo("abc", makeLink(), BASE_URL);
    const json = linkInfoToJson(info);
    expect(json).not.toHaveProperty("alias");
  });

  it("includes expiry fields when present", () => {
    const link = makeLink({ expiresAt: "2020-01-01T00:00:00.000Z" });
    const info = buildLinkInfo("abc", link, BASE_URL);
    const json = linkInfoToJson(info);
    expect(json).toHaveProperty("expires_at");
    expect(json.expired).toBe(true);
  });
});
