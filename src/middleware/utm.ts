import { parseUTMParams, appendUTMParams, hasUTMParams, UTMParams } from '../utils/utm';

export function utmParamsFromEnv(env: Record<string, string | undefined>): UTMParams {
  return {
    source: env['DEFAULT_UTM_SOURCE'],
    medium: env['DEFAULT_UTM_MEDIUM'],
    campaign: env['DEFAULT_UTM_CAMPAIGN'],
  };
}

/**
 * Middleware that injects default UTM params from env into redirect destinations
 * when the destination URL has no UTM params already set.
 */
export function withDefaultUTM(
  handler: (req: Request, ...args: unknown[]) => Promise<Response>,
  defaults: UTMParams
) {
  return async function (request: Request, ...args: unknown[]): Promise<Response> {
    const response = await handler(request, ...args);

    if (response.status !== 301 && response.status !== 302) {
      return response;
    }

    const location = response.headers.get('Location');
    if (!location || !hasUTMParams(defaults)) return response;

    try {
      const existing = new URL(location);
      const existingUTM = parseUTMParams(existing.searchParams);
      if (hasUTMParams(existingUTM)) return response; // already has utm
      const newLocation = appendUTMParams(location, defaults);
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Location', newLocation);
      return new Response(null, { status: response.status, headers: newHeaders });
    } catch {
      return response;
    }
  };
}
