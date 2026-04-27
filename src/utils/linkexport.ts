import type { LinkRecord } from "../store/kv";

export type ExportFormat = "json" | "csv";

export interface ExportOptions {
  format: ExportFormat;
  includeStats?: boolean;
}

export function exportFormatFromParams(params: URLSearchParams): ExportFormat {
  const fmt = params.get("format");
  if (fmt === "csv") return "csv";
  return "json";
}

export function linksToJson(links: LinkRecord[]): string {
  return JSON.stringify(
    links.map((l) => ({
      slug: l.slug,
      url: l.url,
      createdAt: l.createdAt,
      expiresAt: l.expiresAt ?? null,
      tags: l.tags ?? [],
      alias: l.alias ?? null,
    })),
    null,
    2
  );
}

export function linksToCsv(links: LinkRecord[]): string {
  const header = "slug,url,createdAt,expiresAt,tags,alias";
  const rows = links.map((l) => {
    const cols = [
      l.slug,
      l.url,
      l.createdAt,
      l.expiresAt ?? "",
      (l.tags ?? []).join("|"),
      l.alias ?? "",
    ];
    return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
  });
  return [header, ...rows].join("\n");
}

export function exportLinks(links: LinkRecord[], format: ExportFormat): string {
  return format === "csv" ? linksToCsv(links) : linksToJson(links);
}

export function exportContentType(format: ExportFormat): string {
  return format === "csv" ? "text/csv; charset=utf-8" : "application/json";
}

export function exportFilename(format: ExportFormat): string {
  const ts = new Date().toISOString().slice(0, 10);
  return `snaproute-export-${ts}.${format}`;
}
