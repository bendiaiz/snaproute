export interface CorsOptions {
  allowedOrigins: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  maxAge?: number;
}

const DEFAULT_METHODS = ["GET", "POST", "DELETE", "OPTIONS"];
const DEFAULT_HEADERS = ["Content-Type", "Authorization"];

export function createCorsHeaders(
  request: Request,
  options: CorsOptions
): Headers {
  const origin = request.headers.get("Origin") ?? "";
  const headers = new Headers();

  const allowed =
    options.allowedOrigins.includes("*") ||
    options.allowedOrigins.includes(origin);

  if (!allowed) return headers;

  headers.set("Access-Control-Allow-Origin", allowed ? origin : "");
  headers.set(
    "Access-Control-Allow-Methods",
    (options.allowedMethods ?? DEFAULT_METHODS).join(", ")
  );
  headers.set(
    "Access-Control-Allow-Headers",
    (options.allowedHeaders ?? DEFAULT_HEADERS).join(", ")
  );
  headers.set(
    "Access-Control-Max-Age",
    String(options.maxAge ?? 86400)
  );
  headers.set("Vary", "Origin");

  return headers;
}

export function handlePreflight(
  request: Request,
  options: CorsOptions
): Response | null {
  if (request.method !== "OPTIONS") return null;
  const corsHeaders = createCorsHeaders(request, options);
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function applyCors(
  response: Response,
  request: Request,
  options: CorsOptions
): Response {
  const corsHeaders = createCorsHeaders(request, options);
  const merged = new Headers(response.headers);
  corsHeaders.forEach((value, key) => merged.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: merged,
  });
}
