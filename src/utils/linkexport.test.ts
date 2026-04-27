import { describe, it, expect } from "vitest";
import {
  exportFormatFromParams,
  linksToJson,
  linksToCsv,
  exportLinks,
  exportContentType,
  exportFilename,
} from "./linkexport";
import type { LinkRecord } from "../store/kv";

const makeLink = (overrides: Partial<LinkRecord> = {}): LinkRecord => ({
  slug: "abc123",
  url: "https://example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("exportFormatFromParams", () => {
  it("defaults to json", () => {
    expect(exportFormatFromParams(new URLSearchParams())).toBe("json");
  });
  it("returns csv when specified", () => {
    expect(exportFormatFromParams(new URLSearchParams("format=csv"))).toBe("csv");
  });
  it("falls back to json for unknown format", () => {
    expect(exportFormatFromParams(new URLSearchParams("format=xml"))).toBe("json");
  });
});

describe("linksToJson", () => {
  it("serializes links to JSON string", () => {
    const result = JSON.parse(linksToJson([makeLink()]));
    expect(result[0].slug).toBe("abc123");
    expect(result[0].url).toBe("https://example.com");
  });
  it("includes null for missing optional fields", () => {
    const result = JSON.parse(linksToJson([makeLink()]));
    expect(result[0].expiresAt).toBeNull();
    expect(result[0].alias).toBeNull();
  });
});

describe("linksToCsv", () => {
  it("includes header row", () => {
    const csv = linksToCsv([]);
    expect(csv.startsWith("slug,url,createdAt")).toBe(true);
  });
  it("serializes a link as a CSV row", () => {
    const csv = linksToCsv([makeLink({ tags: ["promo", "social"] })]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("abc123");
    expect(lines[1]).toContain("promo|social");
  });
  it("escapes double quotes in values", () => {
    const csv = linksToCsv([makeLink({ url: 'https://ex.com/?a="1"' })]);
    expect(csv).toContain('""1""');
  });
});

describe("exportLinks", () => {
  it("delegates to JSON for json format", () => {
    expect(exportLinks([makeLink()], "json")).toContain("\"slug\"");
  });
  it("delegates to CSV for csv format", () => {
    expect(exportLinks([makeLink()], "csv")).toContain("slug,url");
  });
});

describe("exportContentType", () => {
  it("returns application/json for json", () => {
    expect(exportContentType("json")).toBe("application/json");
  });
  it("returns text/csv for csv", () => {
    expect(exportContentType("csv")).toContain("text/csv");
  });
});

describe("exportFilename", () => {
  it("includes date and format extension", () => {
    const name = exportFilename("csv");
    expect(name).toMatch(/snaproute-export-\d{4}-\d{2}-\d{2}\.csv/);
  });
});
