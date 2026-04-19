import { describe, it, expect } from "vitest";
import { parseBulkImportBody, buildBulkResultSummary } from "./bulkimport";

describe("parseBulkImportBody", () => {
  it("parses valid entries", () => {
    const result = parseBulkImportBody([
      { url: "https://example.com", alias: "ex", tags: ["a"], ttl: 3600 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://example.com");
    expect(result[0].alias).toBe("ex");
    expect(result[0].ttl).toBe(3600);
  });

  it("throws if not array", () => {
    expect(() => parseBulkImportBody({})).toThrow("Expected an array");
  });

  it("throws if exceeds 500", () => {
    const big = Array.from({ length: 501 }, (_, i) => ({ url: `https://x.com/${i}` }));
    expect(() => parseBulkImportBody(big)).toThrow("Exceeds max");
  });

  it("throws on invalid url", () => {
    expect(() => parseBulkImportBody([{ url: "not-a-url" }])).toThrow("invalid url");
  });

  it("ignores non-string alias and tags", () => {
    const result = parseBulkImportBody([{ url: "https://a.com", alias: 123, tags: "bad" }]);
    expect(result[0].alias).toBeUndefined();
    expect(result[0].tags).toBeUndefined();
  });
});

describe("buildBulkResultSummary", () => {
  it("summarizes results correctly", () => {
    const summary = buildBulkResultSummary({
      success: [{ url: "https://a.com", slug: "abc" }],
      failed: [{ entry: { url: "https://b.com" }, reason: "duplicate" }],
    });
    expect(summary.total).toBe(2);
    expect(summary.created).toBe(1);
    expect(summary.failed).toBe(1);
  });
});
