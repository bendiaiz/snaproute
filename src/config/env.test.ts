import { describe, it, expect } from "vitest";
import { parseEnv } from "./env";

const validEnv = {
  KV_NAMESPACE: "snaproute_kv",
  BASE_URL: "https://snap.route",
};

describe("parseEnv", () => {
  it("parses valid environment variables", () => {
    const env = parseEnv(validEnv);
    expect(env.KV_NAMESPACE).toBe("snaproute_kv");
    expect(env.BASE_URL).toBe("https://snap.route");
    expect(env.SHORT_ID_LENGTH).toBe(6);
    expect(env.ANALYTICS_RETENTION_DAYS).toBe(30);
  });

  it("respects custom SHORT_ID_LENGTH", () => {
    const env = parseEnv({ ...validEnv, SHORT_ID_LENGTH: "8" });
    expect(env.SHORT_ID_LENGTH).toBe(8);
  });

  it("respects custom ANALYTICS_RETENTION_DAYS", () => {
    const env = parseEnv({ ...validEnv, ANALYTICS_RETENTION_DAYS: "90" });
    expect(env.ANALYTICS_RETENTION_DAYS).toBe(90);
  });

  it("throws when KV_NAMESPACE is missing", () => {
    expect(() => parseEnv({ BASE_URL: "https://snap.route" })).toThrow(
      "Invalid environment configuration"
    );
  });

  it("throws when BASE_URL is not a valid URL", () => {
    expect(() =>
      parseEnv({ ...validEnv, BASE_URL: "not-a-url" })
    ).toThrow("Invalid environment configuration");
  });

  it("throws when KV_NAMESPACE is empty string", () => {
    expect(() =>
      parseEnv({ ...validEnv, KV_NAMESPACE: "" })
    ).toThrow("Invalid environment configuration");
  });
});
