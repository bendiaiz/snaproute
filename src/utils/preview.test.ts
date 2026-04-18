import { describe, it, expect } from "vitest";
import { buildShortUrl, buildPreview, previewToHtml } from "./preview";

const BASE = "https://snap.io";

describe("buildShortUrl", () => {
  it("combines base and slug", () => {
    expect(buildShortUrl(BASE, "abc123")).toBe("https://snap.io/abc123");
  });

  it("strips trailing slash from base", () => {
    expect(buildShortUrl("https://snap.io/", "abc")).toBe("https://snap.io/abc");
  });
});

describe("buildPreview", () => {
  it("returns correct preview shape", () => {
    const p = buildPreview(BASE, "abc", "https://example.com", 5, "2024-01-01");
    expect(p.slug).toBe("abc");
    expect(p.shortUrl).toBe("https://snap.io/abc");
    expect(p.qrUrl).toBe("https://snap.io/qr/abc");
    expect(p.clicks).toBe(5);
    expect(p.createdAt).toBe("2024-01-01");
  });
});

describe("previewToHtml", () => {
  it("includes slug in output", () => {
    const p = buildPreview(BASE, "abc", "https://example.com", 0, "2024-01-01");
    const html = previewToHtml(p);
    expect(html).toContain("abc");
    expect(html).toContain("https://example.com");
    expect(html).toContain("<img");
  });

  it("includes og meta tags", () => {
    const p = buildPreview(BASE, "test", "https://dest.com", 2, "2024-06-01");
    const html = previewToHtml(p);
    expect(html).toContain('property="og:url"');
    expect(html).toContain('property="og:title"');
  });
});
