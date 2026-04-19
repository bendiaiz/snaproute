/**
 * Password protection utilities for shortened links.
 */

export interface PasswordOptions {
  password: string;
}

/**
 * Hash a password using SHA-256 (Web Crypto API, edge-compatible).
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a plaintext password against a stored hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const candidate = await hashPassword(password);
  return candidate === hash;
}

/**
 * Extract password from request (Authorization header or JSON body field).
 */
export async function extractPassword(
  request: Request
): Promise<string | null> {
  const auth = request.headers.get("Authorization");
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = await request.clone().json();
      if (typeof body?.password === "string") return body.password;
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Build a 401 response prompting for a password.
 */
export function passwordRequiredResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Password required" }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="snaproute"',
      },
    }
  );
}

/**
 * Build a 403 response for incorrect password.
 */
export function passwordForbiddenResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Invalid password" }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}
