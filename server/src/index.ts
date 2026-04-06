import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { authMiddleware } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";
import { transcribe } from "./routes/transcribe.js";
import { translate } from "./routes/translate.js";
import { speak } from "./routes/speak.js";

const app = new Hono();

app.use("*", cors({ origin: [] }));

app.get("/api/health", (c) => c.json({ ok: true }));

app.use("/api/*", authMiddleware);
app.use("/api/*", rateLimitMiddleware);

app.route("/api/transcribe", transcribe);
app.route("/api/translate", translate);
app.route("/api/speak", speak);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  const status = "status" in err && typeof err.status === "number" ? err.status : 500;
  const rawMessage = err instanceof Error ? err.message : "Internal server error";
  const isClientError = status >= 400 && status < 500;
  const message = isClientError ? rawMessage : "Internal server error";

  if (status >= 500) {
    process.stderr.write(`[error] ${rawMessage}\n`);
  }

  return c.json({ error: message }, status as 500);
});

const port = parseInt(process.env.PORT ?? "3000", 10);

serve({ fetch: app.fetch, port }, (info) => {
  process.stdout.write(`Blimey server running on port ${info.port}\n`);
});
