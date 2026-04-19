/**
 * Middleware: inject alias from query params into request before shortening
 */

import { aliasFromParams } from '../utils/alias';

export type AliasedHandler = (request: Request) => Promise<Response>;

/**
 * Reads ?alias= or ?custom= from the URL and forwards it as X-Alias header
 * so downstream shorten handler can pick it up without re-parsing.
 */
export function withAlias(handler: AliasedHandler): AliasedHandler {
  return async function (request: Request): Promise<Response> {
    const url = new URL(request.url);
    const alias = aliasFromParams(url.searchParams);

    if (!alias) {
      return handler(request);
    }

    const modified = new Request(request, {
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'X-Alias': alias,
      },
    });

    return handler(modified);
  };
}

export function resolveAliasFromRequest(request: Request): string | null {
  // Prefer header set by middleware, fall back to query param
  const header = request.headers.get('X-Alias');
  if (header) return header;
  const url = new URL(request.url);
  return aliasFromParams(url.searchParams);
}
