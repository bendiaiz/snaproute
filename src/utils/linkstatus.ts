/**
 * Utilities for checking the health/reachability of a target URL.
 */

export type LinkStatus = "ok" | "redirect" | "broken" | "timeout" | "unknown";

export interface LinkStatusResult {
  url: string;
  status: LinkStatus;
  httpStatus?: number;
  latencyMs?: number;
  checkedAt: string;
}

const TIMEOUT_MS = 5_000;

export async function checkLinkStatus(url: string): Promise<LinkStatusResult> {
  const checkedAt = new Date().toISOString();
  const start = Date.now();

  let controller: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller!.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;
    const httpStatus = response.status;

    let status: LinkStatus;
    if (httpStatus >= 200 && httpStatus < 300) {
      status = "ok";
    } else if (httpStatus >= 300 && httpStatus < 400) {
      status = "redirect";
    } else {
      status = "broken";
    }

    return { url, status, httpStatus, latencyMs, checkedAt };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (err instanceof Error && err.name === "AbortError") {
      return { url, status: "timeout", latencyMs, checkedAt };
    }

    return { url, status: "unknown", latencyMs, checkedAt };
  }
}

export function linkStatusToJson(result: LinkStatusResult): Record<string, unknown> {
  return {
    url: result.url,
    status: result.status,
    http_status: result.httpStatus ?? null,
    latency_ms: result.latencyMs ?? null,
    checked_at: result.checkedAt,
  };
}
