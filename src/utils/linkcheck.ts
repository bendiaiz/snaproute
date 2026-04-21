/**
 * Link validation utilities for snaproute.
 * Checks URLs for allowed protocols, blocked domains, and general safety.
 */

const ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * Blocked hostnames / patterns (basic safelist — extend as needed).
 * These are well-known localhost / private network patterns.
 */
const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
];

export interface LinkCheckResult {
  valid: boolean;
  reason?: string;
}

/**
 * Returns true if the given protocol string is in the allowed list.
 */
export function isAllowedProtocol(protocol: string): boolean {
  return ALLOWED_PROTOCOLS.includes(protocol.toLowerCase());
}

/**
 * Returns true if the hostname is considered private / blocked.
 */
export function isBlockedHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
}

/**
 * Parses the raw URL string and validates it for use as a short-link target.
 *
 * Checks:
 *  - Must be a parseable URL
 *  - Protocol must be http or https
 *  - Hostname must not be a private / loopback address
 *  - URL must have a non-empty hostname
 */
export function validateTargetUrl(raw: string): LinkCheckResult {
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return { valid: false, reason: "URL is not parseable" };
  }

  if (!isAllowedProtocol(url.protocol)) {
    return {
      valid: false,
      reason: `Protocol "${url.protocol}" is not allowed; use http or https`,
    };
  }

  if (!url.hostname) {
    return { valid: false, reason: "URL has no hostname" };
  }

  if (isBlockedHostname(url.hostname)) {
    return {
      valid: false,
      reason: `Hostname "${url.hostname}" is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Normalises a target URL by stripping trailing slashes from the path
 * (unless the path is just "/") and ensuring consistent casing on the
 * scheme + host portion.
 */
export function normalizeTargetUrl(raw: string): string {
  const url = new URL(raw);
  // Lowercase scheme and host (spec-compliant, but let's be explicit)
  url.hostname = url.hostname.toLowerCase();
  url.protocol = url.protocol.toLowerCase();

  // Strip trailing slash from path when it is not the root
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}
