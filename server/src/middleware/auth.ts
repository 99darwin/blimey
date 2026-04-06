import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const appSecret = process.env.APP_SECRET;

  if (!appSecret) {
    return c.json({ error: "Server misconfigured" }, 500);
  }

  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json({ error: "Missing Authorization header" }, 401);
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer" || !safeCompare(parts[1], appSecret)) {
    return c.json({ error: "Invalid authorization token" }, 401);
  }

  await next();
};
