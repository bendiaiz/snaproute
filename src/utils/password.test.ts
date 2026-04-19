import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  extractPassword,
  passwordRequiredResponse,
  passwordForbiddenResponse,
} from "./password";

describe("hashPassword", () => {
  it("returns a 64-char hex string", async () => {
    const hash = await hashPassword("secret");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic", async () => {
    expect(await hashPassword("abc")).toBe(await hashPassword("abc"));
  });

  it("differs for different inputs", async () => {
    expect(await hashPassword("a")).not.toBe(await hashPassword("b"));
  });
});

describe("verifyPassword", () => {
  it("returns true for matching password", async () => {
    const hash = await hashPassword("hunter2");
    expect(await verifyPassword("hunter2", hash)).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("hunter2");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("extractPassword", () => {
  it("extracts from Bearer header", async () => {
    const req = new Request("https://example.com", {
      headers: { Authorization: "Bearer mytoken" },
    });
    expect(await extractPassword(req)).toBe("mytoken");
  });

  it("extracts from JSON body", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "bodypass" }),
    });
    expect(await extractPassword(req)).toBe("bodypass");
  });

  it("returns null when no password present", async () => {
    const req = new Request("https://example.com");
    expect(await extractPassword(req)).toBeNull();
  });
});

describe("passwordRequiredResponse", () => {
  it("returns 401 with WWW-Authenticate header", () => {
    const res = passwordRequiredResponse();
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("Bearer");
  });
});

describe("passwordForbiddenResponse", () => {
  it("returns 403", () => {
    const res = passwordForbiddenResponse();
    expect(res.status).toBe(403);
  });
});
