import { z } from "zod";

const envSchema = z.object({
  KV_NAMESPACE: z.string().min(1),
  BASE_URL: z.string().url(),
  SHORT_ID_LENGTH: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 6)),
  ANALYTICS_RETENTION_DAYS: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 30)),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

/**
 * Returns the list of required environment variable keys.
 * Useful for startup checks or diagnostic logging.
 */
export function getRequiredEnvKeys(): string[] {
  return Object.entries(envSchema.shape)
    .filter(([, field]) => !(field instanceof z.ZodOptional))
    .map(([key]) => key);
}
