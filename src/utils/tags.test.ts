import { describe, it, expect } from "vitest";
import {
  sanitizeTag,
  isValidTag,
  parseTags,
  serializeTags,
  filterByTag,
  tagsFromParams,
  MAX_TAGS,
} from "./tags";

describe("sanitizeTag", () => {
  it("lowercases and trims", () => {
    expect(sanitizeTag("  Hello  ")).toBe("hello");
  });
  it("replaces spaces with hyphens", () => {
    expect(sanitizeTag("my tag")).toBe("my-tag");
  });
});

describe("isValidTag", () => {
  it("accepts valid tags", () => {
    expect(isValidTag("marketing")).toBe(true);
    expect(isValidTag("q4-2024")).toBe(true);
    expect(isValidTag("my_tag")).toBe(true);
  });
  it("rejects empty string", () => {
    expect(isValidTag("")).toBe(false);
  });
  it("rejects tags with special chars", () => {
    expect(isValidTag("bad!")).toBe(false);
    expect(isValidTag("no spaces")).toBe(false);
  });
  it("rejects tags over max length", () => {
    expect(isValidTag("a".repeat(33))).toBe(false);
  });
});

describe("parseTags", () => {
  it("splits comma-separated tags", () => {
    expect(parseTags("foo,bar,baz")).toEqual(["foo", "bar", "baz"]);
  });
  it("returns empty array for null/undefined", () => {
    expect(parseTags(null)).toEqual([]);
    expect(parseTags(undefined)).toEqual([]);
  });
  it(`limits to ${MAX_TAGS} tags`, () => {
    const input = Array.from({ length: 15 }, (_, i) => `tag${i}`).join(",");
    expect(parseTags(input)).toHaveLength(MAX_TAGS);
  });
  it("filters invalid tags", () => {
    expect(parseTags("good,bad!,also-good")).toEqual(["good", "also-good"]);
  });
});

describe("serializeTags", () => {
  it("sorts and deduplicates tags", () => {
    expect(serializeTags(["b", "a", "a"])).toBe("a,b");
  });
});

describe("filterByTag", () => {
  const items = [
    { id: 1, tags: ["marketing", "q4"] },
    { id: 2, tags: ["dev"] },
    { id: 3, tags: ["marketing"] },
  ];
  it("returns items matching the tag", () => {
    expect(filterByTag(items, "marketing")).toHaveLength(2);
  });
  it("returns empty if no match", () => {
    expect(filterByTag(items, "unknown")).toHaveLength(0);
  });
});

describe("tagsFromParams", () => {
  it("parses tags from URLSearchParams", () => {
    const p = new URLSearchParams("tags=foo,bar");
    expect(tagsFromParams(p)).toEqual(["foo", "bar"]);
  });
  it("returns empty array when param missing", () => {
    expect(tagsFromParams(new URLSearchParams())).toEqual([]);
  });
});
