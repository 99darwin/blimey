import type { MiddlewareHandler } from "hono";

interface RateLimitEntry {
  minuteCount: number;
  minuteReset: number;
  dayCount: number;
  dayReset: number;
}

const FREE_LIMITS = { perMinute: 5, perDay: 50 } as const;
const PREMIUM_LIMITS = { perMinute: 50, perDay: Infinity } as const;

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.dayReset) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

function getClientIp(headerValue: string | undefined, fallback: string): string {
  if (headerValue) {
    const first = headerValue.split(",")[0]?.trim();
    if (first) return first;
  }
  return fallback;
}

function getOrCreateEntry(ip: string): RateLimitEntry {
  const now = Date.now();
  const existing = store.get(ip);

  if (existing) {
    if (now > existing.minuteReset) {
      existing.minuteCount = 0;
      existing.minuteReset = now + 60_000;
    }
    if (now > existing.dayReset) {
      existing.dayCount = 0;
      existing.dayReset = now + 86_400_000;
    }
    return existing;
  }

  const entry: RateLimitEntry = {
    minuteCount: 0,
    minuteReset: now + 60_000,
    dayCount: 0,
    dayReset: now + 86_400_000,
  };
  store.set(ip, entry);
  return entry;
}

export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
  const ip = getClientIp(
    c.req.header("X-Forwarded-For"),
    c.req.header("X-Real-IP") ?? "unknown"
  );

  // TODO: Validate X-Premium-Token against RevenueCat REST API before granting premium limits.
  // Until RevenueCat is wired up, all users get free-tier rate limits.
  const limits = FREE_LIMITS;

  const entry = getOrCreateEntry(ip);

  if (entry.minuteCount >= limits.perMinute) {
    const retryAfter = Math.ceil((entry.minuteReset - Date.now()) / 1000);
    c.header("Retry-After", String(Math.max(retryAfter, 1)));
    return c.json({ error: "Rate limit exceeded. Try again shortly." }, 429);
  }

  if (entry.dayCount >= limits.perDay) {
    const retryAfter = Math.ceil((entry.dayReset - Date.now()) / 1000);
    c.header("Retry-After", String(Math.max(retryAfter, 1)));
    return c.json({ error: "Daily limit exceeded. Upgrade to premium for unlimited access." }, 429);
  }

  entry.minuteCount++;
  entry.dayCount++;

  await next();
};
