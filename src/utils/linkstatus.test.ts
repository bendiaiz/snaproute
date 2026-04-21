import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkLinkStatus, linkStatusToJson } from "./linkstatus";

function mockFetch(status: number, ok = true): typeof fetch {
  return vi.fn().mockResolvedValue({
    status,
    ok,
  } as Response);
}

describe("checkLinkStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns ok for 200 responses", async () => {
    vi.stubGlobal("fetch", mockFetch(200));
    const result = await checkLinkStatus("https://example.com");
    expect(result.status).toBe("ok");
    expect(result.httpStatus).toBe(200);
    expect(result.url).toBe("https://example.com");
    expect(result.checkedAt).toBeTruthy();
  });

  it("returns redirect for 301 responses", async () => {
    vi.stubGlobal("fetch", mockFetch(301));
    const result = await checkLinkStatus("https://example.com/old");
    expect(result.status).toBe("redirect");
    expect(result.httpStatus).toBe(301);
  });

  it("returns broken for 404 responses", async () => {
    vi.stubGlobal("fetch", mockFetch(404, false));
    const result = await checkLinkStatus("https://example.com/gone");
    expect(result.status).toBe("broken");
    expect(result.httpStatus).toBe(404);
  });

  it("returns broken for 500 responses", async () => {
    vi.stubGlobal("fetch", mockFetch(500, false));
    const result = await checkLinkStatus("https://example.com/error");
    expect(result.status).toBe("broken");
  });

  it("returns timeout when fetch is aborted", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    const result = await checkLinkStatus("https://slow.example.com");
    expect(result.status).toBe("timeout");
  });

  it("returns unknown for network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network failure")));
    const result = await checkLinkStatus("https://unreachable.example.com");
    expect(result.status).toBe("unknown");
  });
});

describe("linkStatusToJson", () => {
  it("serializes a full result", () => {
    const json = linkStatusToJson({
      url: "https://example.com",
      status: "ok",
      httpStatus: 200,
      latencyMs: 42,
      checkedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(json).toEqual({
      url: "https://example.com",
      status: "ok",
      http_status: 200,
      latency_ms: 42,
      checked_at: "2024-01-01T00:00:00.000Z",
    });
  });

  it("uses null for missing optional fields", () => {
    const json = linkStatusToJson({
      url: "https://example.com",
      status: "timeout",
      checkedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(json.http_status).toBeNull();
    expect(json.latency_ms).toBeNull();
  });
});
