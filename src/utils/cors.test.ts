import { describe, it, expect } from "vitest";
import { createCorsHeaders, handlePreflight, applyCors } from "./cors";

const options = {
  allowedOrigins: ["https://example.com", "https://app.example.com"],
  allowedMethods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};

function makeRequest(method: string, origin?: string): Request {
  return new Request("https://snap.route/api", {
    method,
    headers: origin ? { Origin: origin } : {},
  });
}

describe("createCorsHeaders", () => {
  it("sets cors headers for allowed origin", () => {
    const headers = createCorsHeaders(makeRequest("GET", "https://example.com"), options);
    expect(headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    expect(headers.get("Access-Control-Allow-Methods")).toBe("GET, POST");
    expect(headers.get("Vary")).toBe("Origin");
  });

  it("returns empty headers for disallowed origin", () => {
    const headers = createCorsHeaders(makeRequest("GET", "https://evil.com"), options);
    expect(headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("allows wildcard origin", () => {
    const headers = createCorsHeaders(makeRequest("GET", "https://any.com"), {
      allowedOrigins: ["*"],
    });
    expect(headers.get("Access-Control-Allow-Origin")).toBe("https://any.com");
  });

  it("sets default max age when not specified", () => {
    const headers = createCorsHeaders(makeRequest("GET", "https://example.com"), options);
    expect(headers.get("Access-Control-Max-Age")).toBe("86400");
  });
});

describe("handlePreflight", () => {
  it("returns 204 for OPTIONS request", () => {
    const res = handlePreflight(makeRequest("OPTIONS", "https://example.com"), options);
    expect(res?.status).toBe(204);
  });

  it("returns null for non-OPTIONS request", () => {
    const res = handlePreflight(makeRequest("GET", "https://example.com"), options);
    expect(res).toBeNull();
  });
});

describe("applyCors", () => {
  it("merges cors headers into existing response", () => {
    const original = new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
    const result = applyCors(original, makeRequest("GET", "https://example.com"), options);
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    expect(result.headers.get("Content-Type")).toBe("application/json");
  });
});
