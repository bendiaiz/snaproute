import { describe, it, expect, vi } from "vitest";
import { withCors, corsOptionsFromEnv } from "./cors";

const options = {
  allowedOrigins: ["https://example.com"],
  allowedMethods: ["GET", "POST"],
};

function makeRequest(method: string, origin?: string): Request {
  return new Request("https://snap.route/", {
    method,
    headers: origin ? { Origin: origin } : {},
  });
}

describe("withCors", () => {
  it("passes through preflight with cors headers", async () => {
    const handler = vi.fn();
    const wrapped = withCors(handler as never, options);
    const res = await wrapped(makeRequest("OPTIONS", "https://example.com"), {});
    expect(res.status).toBe(204);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler and applies cors headers", async () => {
    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const wrapped = withCors(handler, options);
    const res = await wrapped(makeRequest("GET", "https://example.com"), {});
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not set cors headers for disallowed origin", async () => {
    const handler = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const wrapped = withCors(handler, options);
    const res = await wrapped(makeRequest("GET", "https://evil.com"), {});
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("corsOptionsFromEnv", () => {
  it("parses comma-separated origins", () => {
    const opts = corsOptionsFromEnv({
      ALLOWED_ORIGINS: "https://a.com, https://b.com",
    });
    expect(opts.allowedOrigins).toEqual(["https://a.com", "https://b.com"]);
  });

  it("defaults to wildcard when env not set", () => {
    const opts = corsOptionsFromEnv({});
    expect(opts.allowedOrigins).toEqual(["*"]);
  });
});
