import { describe, it, expect } from "vitest";
import {
  isAllowedDomain,
  hostnameFromRequest,
  resolveBaseUrl,
  customDomainOptionsFromEnv,
} from "./customdomain";

describe("isAllowedDomain", () => {
  it("returns true for exact match", () => {
    expect(isAllowedDomain("go.example.com", ["go.example.com"])).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAllowedDomain("GO.EXAMPLE.COM", ["go.example.com"])).toBe(true);
  });

  it("returns false for unknown domain", () => {
    expect(isAllowedDomain("evil.com", ["go.example.com"])).toBe(false);
  });

  it("returns false for empty list", () => {
    expect(isAllowedDomain("go.example.com", [])).toBe(false);
  });
});

describe("hostnameFromRequest", () => {
  it("extracts hostname from request URL", () => {
    const req = new Request("https://go.example.com/abc");
    expect(hostnameFromRequest(req)).toBe("go.example.com");
  });

  it("returns empty string for invalid URL", () => {
    const req = { url: "not-a-url" } as Request;
    expect(hostnameFromRequest(req)).toBe("");
  });
});

describe("resolveBaseUrl", () => {
  const options = {
    allowedDomains: ["go.example.com"],
    defaultDomain: "https://snap.route",
  };

  it("uses custom domain when allowed", () => {
    expect(resolveBaseUrl("go.example.com", options)).toBe("https://go.example.com");
  });

  it("falls back to default domain", () => {
    expect(resolveBaseUrl("unknown.com", options)).toBe("https://snap.route");
  });

  it("strips trailing slash from default domain", () => {
    expect(resolveBaseUrl("x.com", { ...options, defaultDomain: "https://snap.route/" })).toBe("https://snap.route");
  });
});

describe("customDomainOptionsFromEnv", () => {
  it("parses comma-separated allowed domains", () => {
    const opts = customDomainOptionsFromEnv({ ALLOWED_DOMAINS: "a.com, b.com", DEFAULT_DOMAIN: "https://d.com" });
    expect(opts.allowedDomains).toEqual(["a.com", "b.com"]);
    expect(opts.defaultDomain).toBe("https://d.com");
  });

  it("uses defaults when env vars missing", () => {
    const opts = customDomainOptionsFromEnv({});
    expect(opts.allowedDomains).toEqual([]);
    expect(opts.defaultDomain).toBe("http://localhost");
  });
});
