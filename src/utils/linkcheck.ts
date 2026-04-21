/**
 * Utility to check if a destination URL is reachable and safe to shorten.
 */

export interface LinkCheckResult {
  ok: boolean;
  status?: number;
  finalUrl?: string;
  redirected?: boolean;
  error?: string;
}

export interface LinkCheckOptions {
  timeoutMs?: number;
  followRedirects?: boolean;
  allowedProtocols?: string[];
}

const DEFAULT_ALLOWED_PROTOCOLS = ["https:", "http:"];
const DEFAULT_TIMEOUT_MS = 5000;

export function isAllowedProtocol(
  url: string,
  allowed: string[] = DEFAULT_ALLOWED_PROTOCOLS
): boolean {
  try {
    const parsed = new URL(url);
    return allowed.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function checkLink(
  url: string,
  options: LinkCheckOptions = {}
): Promise<LinkCheckResult> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    followRedirects = true,
    allowedProtocols = DEFAULT_ALLOWED_PROTOCOLS,
  } = options;

  if (!isAllowedProtocol(url, allowedProtocols)) {
    return { ok: false, error: "protocol_not_allowed" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: followRedirects ? "follow" : "manual",
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      redirected: response.redirected,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown_error";
    const isTimeout = message.includes("abort") || message.includes("timed out");
    return { ok: false, error: isTimeout ? "timeout" : "fetch_error" };
  } finally {
    clearTimeout(timer);
  }
}
