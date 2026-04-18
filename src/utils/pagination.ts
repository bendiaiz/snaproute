export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function parsePaginationParams(url: URL): PaginationParams {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const rawLimit = parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit || DEFAULT_LIMIT));
  const cursor = url.searchParams.get("cursor") ?? undefined;
  return { page, limit, cursor };
}

export function paginateArray<T>(
  items: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const { page, limit } = params;
  const total = items.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const sliced = items.slice(start, end);

  return {
    items: sliced,
    total,
    page,
    limit,
    hasNext: end < total,
    hasPrev: page > 1,
    nextCursor: end < total ? String(end) : undefined,
  };
}

export function paginationMeta(result: PaginatedResult<unknown>): Record<string, unknown> {
  return {
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev,
    ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
  };
}
