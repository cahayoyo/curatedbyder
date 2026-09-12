import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { emitLog } from "@/instrumentation";

// Issue #334: 10 attempts / 5 min (sliding window) per IP and per identifier.
// Fail-open policy: if the env vars are missing or Redis is unreachable, the
// login flow keeps working unthrottled and the failure is logged. A total login
// outage (admin can't manage orders) is worse than a temporary brute-force gap.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW = "5 m";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Instance is created at module scope so the ephemeral cache survives across
// requests while the serverless instance is hot.
const limiter =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({
          url: redisUrl,
          token: redisToken,
          // Fail fast instead of the default ~4s retry storm; a transient blip
          // is retried on the next login attempt anyway.
          retry: { retries: 1, backoff: () => 100 },
        }),
        limiter: Ratelimit.slidingWindow(LOGIN_LIMIT, LOGIN_WINDOW),
        prefix: "ratelimit:login",
        // Allow requests through if Redis does not answer in time (fail-open).
        timeout: 1000,
      })
    : null;

// Raw IPs/identifiers (emails, usernames) are hashed so Redis keys never
// contain personal data in plaintext.
function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getClientIp(headers: Record<string, unknown> | undefined) {
  const header = headers?.["x-forwarded-for"];
  const raw = Array.isArray(header) ? header[0] : typeof header === "string" ? header : "";
  const ip = raw.split(",")[0]?.trim();
  return ip || null;
}

export type LoginRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export async function checkLoginRateLimit(
  mode: "admin" | "buyer",
  ip: string | null,
  identifier: string,
): Promise<LoginRateLimitResult> {
  if (!limiter) return { allowed: true };

  const keys = [`${mode}:id:${hashKey(identifier)}`];
  if (ip) keys.push(`${mode}:ip:${hashKey(ip)}`);

  try {
    const results = await Promise.all(keys.map((key) => limiter.limit(key)));
    const blocked = results.find((result) => !result.success);
    if (!blocked) return { allowed: true };
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((blocked.reset - Date.now()) / 1000)),
    };
  } catch (error) {
    emitLog(
      "Login rate limit check failed (fail-open)",
      { scope: "rate_limit", mode, error: String(error) },
      SeverityNumber.ERROR,
    );
    return { allowed: true };
  }
}
