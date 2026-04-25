/**
 * Link archive utilities — soft-delete / restore support
 */

export interface ArchivedLink {
  slug: string;
  url: string;
  archivedAt: string; // ISO 8601
  originalCreatedAt?: string;
}

export function buildArchivedLink(
  slug: string,
  url: string,
  originalCreatedAt?: string
): ArchivedLink {
  return {
    slug,
    url,
    archivedAt: new Date().toISOString(),
    ...(originalCreatedAt ? { originalCreatedAt } : {}),
  };
}

export function archivedLinkToJson(link: ArchivedLink): Record<string, unknown> {
  return {
    slug: link.slug,
    url: link.url,
    archivedAt: link.archivedAt,
    ...(link.originalCreatedAt ? { originalCreatedAt: link.originalCreatedAt } : {}),
  };
}

export function isArchivedLink(value: unknown): value is ArchivedLink {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.slug === "string" &&
    typeof v.url === "string" &&
    typeof v.archivedAt === "string"
  );
}

export function archiveKey(slug: string): string {
  return `archive:${slug}`;
}
