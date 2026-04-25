import { describe, it, expect } from "vitest";
import {
  buildArchivedLink,
  archivedLinkToJson,
  isArchivedLink,
  archiveKey,
} from "./linkarchive";

describe("buildArchivedLink", () => {
  it("creates an archived link with archivedAt timestamp", () => {
    const link = buildArchivedLink("abc123", "https://example.com");
    expect(link.slug).toBe("abc123");
    expect(link.url).toBe("https://example.com");
    expect(link.archivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(link.originalCreatedAt).toBeUndefined();
  });

  it("preserves originalCreatedAt when provided", () => {
    const ts = "2024-01-01T00:00:00.000Z";
    const link = buildArchivedLink("abc123", "https://example.com", ts);
    expect(link.originalCreatedAt).toBe(ts);
  });
});

describe("archivedLinkToJson", () => {
  it("serialises all fields", () => {
    const link = buildArchivedLink("abc", "https://x.com", "2024-03-01T00:00:00.000Z");
    const json = archivedLinkToJson(link);
    expect(json.slug).toBe("abc");
    expect(json.url).toBe("https://x.com");
    expect(json.archivedAt).toBe(link.archivedAt);
    expect(json.originalCreatedAt).toBe("2024-03-01T00:00:00.000Z");
  });

  it("omits originalCreatedAt when absent", () => {
    const link = buildArchivedLink("abc", "https://x.com");
    const json = archivedLinkToJson(link);
    expect("originalCreatedAt" in json).toBe(false);
  });
});

describe("isArchivedLink", () => {
  it("returns true for valid archived link", () => {
    const link = buildArchivedLink("s", "https://s.io");
    expect(isArchivedLink(link)).toBe(true);
  });

  it("returns false for non-objects", () => {
    expect(isArchivedLink(null)).toBe(false);
    expect(isArchivedLink("string")).toBe(false);
    expect(isArchivedLink({ slug: 1, url: "u", archivedAt: "t" })).toBe(false);
  });
});

describe("archiveKey", () => {
  it("prefixes slug with archive:", () => {
    expect(archiveKey("foo")).toBe("archive:foo");
  });
});
