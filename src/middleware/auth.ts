import type { Env } from '../config/env'

export interface AuthOptions {
  apiKey: string
}

export function authOptionsFromEnv(env: Env): AuthOptions {
  return {
    apiKey: env.API_KEY ?? '',
  }
}

export function withAuth(
  handler: (req: Request, env: Env) => Promise<Response>,
  options?: Partial<AuthOptions>
) {
  return async (req: Request, env: Env): Promise<Response> => {
    const opts = options ?? authOptionsFromEnv(env)

    if (!opts.apiKey) {
      return handler(req, env)
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.headers.get('X-API-Key') ?? ''

    if (token !== opts.apiKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return handler(req, env)
  }
}
