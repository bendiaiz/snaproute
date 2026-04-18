export interface Env {
  KV: KVNamespace
  BASE_URL: string
  API_KEY?: string
  CORS_ORIGINS?: string
  RATE_LIMIT_MAX?: string
  RATE_LIMIT_WINDOW?: string
}

export function getRequiredEnvKeys(): (keyof Env)[] {
  return ['KV', 'BASE_URL']
}

export function parseEnv(env: unknown): Env {
  const e = env as Record<string, unknown>

  for (const key of getRequiredEnvKeys()) {
    if (!e[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }

  return {
    KV: e['KV'] as KVNamespace,
    BASE_URL: e['BASE_URL'] as string,
    API_KEY: e['API_KEY'] as string | undefined,
    CORS_ORIGINS: e['CORS_ORIGINS'] as string | undefined,
    RATE_LIMIT_MAX: e['RATE_LIMIT_MAX'] as string | undefined,
    RATE_LIMIT_WINDOW: e['RATE_LIMIT_WINDOW'] as string | undefined,
  }
}
