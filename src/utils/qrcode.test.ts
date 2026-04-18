import { describe, it, expect } from "vitest";
import { buildQRCodeUrl, qrOptionsFromParams } from "./qrcode";

describe("buildQRCodeUrl", () => {
  it("returns a valid URL with defaults", () => {
    const url = buildQRCodeUrl("https://example.com");
    expect(url).toContain("api.qrserver.com");
    expect(url).toContain(encodeURIComponent("https://example.com"));
    expect(url).toContain("200x200");
    expect(url).toContain("format=png");
  });

  it("respects custom size and format", () => {
    const url = buildQRCodeUrl("https://snap.io/abc", { size: 400, format: "svg" });
    expect(url).toContain("400x400");
    expect(url).toContain("format=svg");
  });

  it("encodes special characters in URL", () => {
    const url = buildQRCodeUrl("https://example.com/path?foo=bar&baz=1");
    expect(url).not.toContain("&foo=bar");
    expect(url).toContain(encodeURIComponent("https://example.com/path?foo=bar&baz=1"));
  });
});

describe("qrOptionsFromParams", () => {
  it("parses valid size", () => {
    const p = new URLSearchParams("size=300");
    expect(qrOptionsFromParams(p).size).toBe(300);
  });

  it("ignores out-of-range size", () => {
    const p = new URLSearchParams("size=9999");
    expect(qrOptionsFromParams(p).size).toBeUndefined();
  });

  it("parses svg format", () => {
    const p = new URLSearchParams("format=svg");
    expect(qrOptionsFromParams(p).format).toBe("svg");
  });

  it("ignores unknown format", () => {
    const p = new URLSearchParams("format=gif");
    expect(qrOptionsFromParams(p).format).toBeUndefined();
  });

  it("parses margin", () => {
    const p = new URLSearchParams("margin=4");
    expect(qrOptionsFromParams(p).margin).toBe(4);
  });

  it("returns empty object for no params", () => {
    expect(qrOptionsFromParams(new URLSearchParams())).toEqual({});
  });
});
