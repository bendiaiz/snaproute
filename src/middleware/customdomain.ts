import { customDomainOptionsFromEnv, hostnameFromRequest, resolveBaseUrl } from "../utils/customdomain";

export type Handler = (request: Request, env: Record<string, string | undefined>) => Promise<Response>;

/**
 * Middleware that injects a resolved `baseUrl` into env before passing to the handler.
 * Downstream handlers can read `env.BASE_URL` to build short links correctly.
 */
export function withCustomDomain(handler: Handler): Handler {
  return async (request: Request, env: Record<string, string | undefined>): Promise<Response> => {
    const options = customDomainOptionsFromEnv(env);
    const hostname = hostnameFromRequest(request);
    const baseUrl = resolveBaseUrl(hostname, options);
    const enrichedEnv = { ...env, BASE_URL: baseUrl };
    return handler(request, enrichedEnv);
  };
}

/**
 * Rejects requests from domains not in the allowed list.
 * Useful when the worker is bound to multiple routes.
 */
export function withDomainGuard(handler: Handler): Handler {
  return async (request: Request, env: Record<string, string | undefined>): Promise<Response> => {
    const options = customDomainOptionsFromEnv(env);
    if (options.allowedDomains.length === 0) {
      return handler(request, env);
    }
    const hostname = hostnameFromRequest(request);
    const isDefault = new URL(options.defaultDomain).hostname === hostname;
    if (!isDefault && !options.allowedDomains.includes(hostname)) {
      return new Response(JSON.stringify({ error: "Domain not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return handler(request, env);
  };
}
