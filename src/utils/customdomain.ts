/**
 * Utilities for custom domain support
 */

export interface CustomDomainOptions {
  allowedDomains: string[];
  defaultDomain: string;
}

/**
 * Checks if a given hostname is an allowed custom domain
 */
export function isAllowedDomain(hostname: string, allowed: string[]): boolean {
  return allowed.some((d) => d.toLowerCase() === hostname.toLowerCase());
}

/**
 * Extracts the hostname from a Request
 */
export function hostnameFromRequest(request: Request): string {
  try {
    return new URL(request.url).hostname;
  } catch {
    return "";
  }
}

/**
 * Resolves the base URL to use for short link generation.
 * Prefers a matched custom domain over the default.
 */
export function resolveBaseUrl(
  hostname: string,
  options: CustomDomainOptions
): string {
  if (isAllowedDomain(hostname, options.allowedDomains)) {
    return `https://${hostname}`;
  }
  return options.defaultDomain.replace(/\/$/, "");
}

/**
 * Parses custom domain options from environment variables
 */
export function customDomainOptionsFromEnv(env: Record<string, string | undefined>): CustomDomainOptions {
  const raw = env["ALLOWED_DOMAINS"] ?? "";
  const allowedDomains = raw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  const defaultDomain = env["DEFAULT_DOMAIN"] ?? "http://localhost";
  return { allowedDomains, defaultDomain };
}
