export interface BulkImportEntry {
  url: string;
  alias?: string;
  tags?: string[];
  ttl?: number;
}

export interface BulkImportResult {
  success: BulkImportEntry & { slug: string }[];
  failed: { entry: BulkImportEntry; reason: string }[];
}

export function parseBulkImportBody(raw: unknown): BulkImportEntry[] {
  if (!Array.isArray(raw)) throw new Error("Expected an array");
  if (raw.length > 500) throw new Error("Exceeds max 500 entries per import");
  return raw.map((item, i) => {
    if (typeof item !== "object" || item === null)
      throw new Error(`Entry ${i}: not an object`);
    const { url, alias, tags, ttl } = item as Record<string, unknown>;
    if (typeof url !== "string" || !url.startsWith("http"))
      throw new Error(`Entry ${i}: invalid url`);
    return {
      url,
      alias: typeof alias === "string" ? alias : undefined,
      tags: Array.isArray(tags) ? tags.map(String) : undefined,
      ttl: typeof ttl === "number" ? ttl : undefined,
    };
  });
}

export function buildBulkResultSummary(result: BulkImportResult) {
  return {
    total: result.success.length + result.failed.length,
    created: result.success.length,
    failed: result.failed.length,
    entries: result.success,
    errors: result.failed,
  };
}
