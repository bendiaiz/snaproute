/**
 * Link cloning utilities — duplicate an existing short link with optional overrides.
 */

export interface LinkRecord {
  url: string;
  slug: string;
  createdAt: string;
  expiresAt?: string;
  tags?: string[];
  password?: string;
  utmParams?: Record<string, string>;
  alias?: string;
}

export interface CloneOptions {
  newSlug: string;
  overrides?: Partial<Omit<LinkRecord, 'slug' | 'createdAt'>>;
}

export interface CloneResult {
  original: LinkRecord;
  cloned: LinkRecord;
}

/**
 * Build a cloned link record from an existing one, applying optional overrides.
 */
export function cloneLink(original: LinkRecord, options: CloneOptions): CloneResult {
  const now = new Date().toISOString();

  const cloned: LinkRecord = {
    ...original,
    ...(options.overrides ?? {}),
    slug: options.newSlug,
    createdAt: now,
  };

  return { original, cloned };
}

/**
 * Serialize a CloneResult to a plain JSON-safe object for API responses.
 */
export function cloneResultToJson(result: CloneResult): Record<string, unknown> {
  return {
    original: {
      slug: result.original.slug,
      url: result.original.url,
      createdAt: result.original.createdAt,
    },
    cloned: {
      slug: result.cloned.slug,
      url: result.cloned.url,
      createdAt: result.cloned.createdAt,
      expiresAt: result.cloned.expiresAt ?? null,
      tags: result.cloned.tags ?? [],
      alias: result.cloned.alias ?? null,
    },
  };
}
