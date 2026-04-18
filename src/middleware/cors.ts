import { createCorsHeaders, handlePreflight, applyCors, CorsOptions } from "../utils/cors";

export type Handler = (request: Request, env: unknown) => Promise<Response>;

export function withCors(handler: Handler, options: CorsOptions): Handler {
  return async (request: Request, env: unknown): Promise<Response> => {
    const preflight = handlePreflight(request, options);
    if (preflight) return preflight;

    const response = await handler(request, env);
    return applyCors(response, request, options);
  };
}

export function corsOptionsFromEnv(env: Record<string, string | undefined>): CorsOptions {
  const raw = env["ALLOWED_ORIGINS"] ?? "*";
  const allowedOrigins = raw.split(",").map((o) => o.trim()).filter(Boolean);
  return {
    allowedOrigins,
    allowedMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  };
}
