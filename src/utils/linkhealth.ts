/**
 * linkhealth.ts
 * Utilities for checking the health/reachability of a target URL.
 */

export interface LinkHealthResult {
  url: string;
  reachable: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  redirectUrl: string | null;
  checkedAt: string;
  error?: string;
}

export interface LinkHealthOptions {
  timeoutMs?: number;
  followRedirects?: boolean;
  userAgent?: string;
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_USER_AGENT = "snaproute-healthcheck/1.0";

export async function checkLinkHealth(
  url: string,
  options: LinkHealthOptions = {},
  fetchFn: typeof fetch = fetch
): Promise<LinkHealthResult> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    followRedirects = false,
    userAgent = DEFAULT_USER_AGENT,
  } = options;

  const checkedAt = new Date().toISOString();
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetchFn(url, {
      method: "HEAD",
      redirect: followRedirects ? "follow" : "manual",
      signal: controller.signal,
      headers: { "User-Agent": userAgent },
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    const redirectUrl =
      !followRedirects && response.status >= 300 && response.status < 400
        ? response.headers.get("location")
        : null;

    return {
      url,
      reachable: response.status < 400,
      statusCode: response.status,
      latencyMs,
      redirectUrl,
      checkedAt,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const error =
      err instanceof Error ? err.message : "Unknown error";
    return {
      url,
      reachable: false,
      statusCode: null,
      latencyMs,
      redirectUrl: null,
      checkedAt,
      error,
    };
  }
}

export function linkHealthToJson(result: LinkHealthResult): Record<string, unknown> {
  return {
    url: result.url,
    reachable: result.reachable,
    status_code: result.statusCode,
    latency_ms: result.latencyMs,
    redirect_url: result.redirectUrl,
    checked_at: result.checkedAt,
    ...(result.error ? { error: result.error } : {}),
  };
}
