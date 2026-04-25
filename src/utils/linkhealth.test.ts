import { describe, it, expect, vi } from "vitest";
import { checkLinkHealth, linkHealthToJson } from "./linkhealth";

function makeFetch(status: number, headers: Record<string, string> = {}) {
  return vi.fn().mockResolvedValue({
    status,
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  });
}

describe("checkLinkHealth", () => {
  it("returns reachable=true for a 200 response", async () => {
    const result = await checkLinkHealth("https://example.com", {}, makeFetch(200));
    expect(result.reachable).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.error).toBeUndefined();
  });

  it("returns reachable=false for a 404 response", async () => {
    const result = await checkLinkHealth("https://example.com/gone", {}, makeFetch(404));
    expect(result.reachable).toBe(false);
    expect(result.statusCode).toBe(404);
  });

  it("captures redirect location when followRedirects=false", async () => {
    const fetchFn = makeFetch(301, { location: "https://new.example.com" });
    const result = await checkLinkHealth("https://example.com", { followRedirects: false }, fetchFn);
    expect(result.redirectUrl).toBe("https://new.example.com");
    expect(result.statusCode).toBe(301);
  });

  it("does not capture redirect location when followRedirects=true", async () => {
    const fetchFn = makeFetch(200, { location: "https://new.example.com" });
    const result = await checkLinkHealth("https://example.com", { followRedirects: true }, fetchFn);
    expect(result.redirectUrl).toBeNull();
  });

  it("returns reachable=false and error message on network failure", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("network error"));
    const result = await checkLinkHealth("https://unreachable.example", {}, fetchFn);
    expect(result.reachable).toBe(false);
    expect(result.statusCode).toBeNull();
    expect(result.error).toBe("network error");
  });

  it("includes a checkedAt ISO timestamp", async () => {
    const result = await checkLinkHealth("https://example.com", {}, makeFetch(200));
    expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("includes latencyMs as a number", async () => {
    const result = await checkLinkHealth("https://example.com", {}, makeFetch(200));
    expect(typeof result.latencyMs).toBe("number");
  });
});

describe("linkHealthToJson", () => {
  it("serializes result to snake_case keys", () => {
    const result = {
      url: "https://example.com",
      reachable: true,
      statusCode: 200,
      latencyMs: 42,
      redirectUrl: null,
      checkedAt: "2024-01-01T00:00:00.000Z",
    };
    const json = linkHealthToJson(result);
    expect(json.status_code).toBe(200);
    expect(json.latency_ms).toBe(42);
    expect(json.redirect_url).toBeNull();
    expect(json.checked_at).toBe("2024-01-01T00:00:00.000Z");
    expect(json.error).toBeUndefined();
  });

  it("includes error field when present", () => {
    const result = {
      url: "https://example.com",
      reachable: false,
      statusCode: null,
      latencyMs: 10,
      redirectUrl: null,
      checkedAt: "2024-01-01T00:00:00.000Z",
      error: "timeout",
    };
    const json = linkHealthToJson(result);
    expect(json.error).toBe("timeout");
  });
});
