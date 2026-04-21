import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkLink, isAllowedProtocol } from "./linkcheck";

describe("isAllowedProtocol", () => {
  it("allows https URLs", () => {
    expect(isAllowedProtocol("https://example.com")).toBe(true);
  });

  it("allows http URLs", () => {
    expect(isAllowedProtocol("http://example.com")).toBe(true);
  });

  it("rejects javascript: URLs", () => {
    expect(isAllowedProtocol("javascript:alert(1)")).toBe(false);
  });

  it("rejects ftp: URLs by default", () => {
    expect(isAllowedProtocol("ftp://example.com")).toBe(false);
  });

  it("allows custom protocol list", () => {
    expect(isAllowedProtocol("ftp://example.com", ["ftp:"])).toBe(true);
  });

  it("returns false for malformed URLs", () => {
    expect(isAllowedProtocol("not a url")).toBe(false);
  });
});

describe("checkLink", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ok true for a 200 response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, url: "https://example.com" } as ResponseInit) as Response
    );
    const result = await checkLink("https://example.com");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it("returns ok false for a 404 response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 404 }) as Response
    );
    const result = await checkLink("https://example.com/missing");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  it("returns protocol_not_allowed for disallowed protocol", async () => {
    const result = await checkLink("ftp://example.com");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("protocol_not_allowed");
  });

  it("returns timeout error when fetch is aborted", async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException("The operation was aborted", "AbortError"));
    const result = await checkLink("https://slow.example.com", { timeoutMs: 1 });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("timeout");
  });

  it("returns fetch_error on network failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network failure"));
    const result = await checkLink("https://example.com");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("fetch_error");
  });
});
