import { describe, it, expect } from "vitest";
import {
  parsePaginationParams,
  paginateArray,
  paginationMeta,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "./pagination";

describe("parsePaginationParams", () => {
  it("returns defaults for empty params", () => {
    const url = new URL("https://example.com/list");
    const params = parsePaginationParams(url);
    expect(params.page).toBe(1);
    expect(params.limit).toBe(DEFAULT_LIMIT);
    expect(params.cursor).toBeUndefined();
  });

  it("parses page and limit", () => {
    const url = new URL("https://example.com/list?page=3&limit=10");
    const params = parsePaginationParams(url);
    expect(params.page).toBe(3);
    expect(params.limit).toBe(10);
  });

  it("clamps limit to MAX_LIMIT", () => {
    const url = new URL(`https://example.com/list?limit=9999`);
    const params = parsePaginationParams(url);
    expect(params.limit).toBe(MAX_LIMIT);
  });

  it("clamps page to minimum 1", () => {
    const url = new URL("https://example.com/list?page=-5");
    const params = parsePaginationParams(url);
    expect(params.page).toBe(1);
  });

  it("parses cursor", () => {
    const url = new URL("https://example.com/list?cursor=abc123");
    expect(parsePaginationParams(url).cursor).toBe("abc123");
  });
});

describe("paginateArray", () => {
  const items = Array.from({ length: 55 }, (_, i) => i + 1);

  it("returns first page", () => {
    const result = paginateArray(items, { page: 1, limit: 20 });
    expect(result.items).toHaveLength(20);
    expect(result.items[0]).toBe(1);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  it("returns last page", () => {
    const result = paginateArray(items, { page: 3, limit: 20 });
    expect(result.items).toHaveLength(15);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
    expect(result.nextCursor).toBeUndefined();
  });

  it("sets nextCursor when hasNext", () => {
    const result = paginateArray(items, { page: 1, limit: 20 });
    expect(result.nextCursor).toBe("20");
  });
});

describe("paginationMeta", () => {
  it("returns meta without nextCursor when not present", () => {
    const result = paginateArray([1, 2], { page: 1, limit: 10 });
    const meta = paginationMeta(result);
    expect(meta.total).toBe(2);
    expect(meta).not.toHaveProperty("nextCursor");
  });
});
