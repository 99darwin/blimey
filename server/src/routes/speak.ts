import { Hono } from "hono";
import { openai } from "../lib/openai.js";

const speak = new Hono();

type Voice = "coral" | "alloy" | "ash" | "ballad" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer";

const VALID_VOICES: ReadonlySet<string> = new Set([
  "coral", "alloy", "ash", "ballad", "echo", "fable", "nova", "onyx", "sage", "shimmer",
]);

interface SpeakRequest {
  text: string;
  voice?: string;
  direction?: "UK_TO_US" | "US_TO_UK";
}

speak.post("/", async (c) => {
  const body = await c.req.json<SpeakRequest>();

  if (!body.text || typeof body.text !== "string") {
    return c.json({ error: "Missing or invalid 'text' field" }, 400);
  }

  if (body.text.length > 500) {
    return c.json({ error: "Text too long. Maximum 500 characters." }, 400);
  }

  const voice: Voice = (body.voice && VALID_VOICES.has(body.voice))
    ? body.voice as Voice
    : "coral";

  const instructions = body.direction === "US_TO_UK"
    ? "Speak with a natural British English accent."
    : "Speak with a natural American English accent.";

  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice,
    input: body.text,
    instructions,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());

  c.header("Content-Type", "audio/mpeg");
  c.header("Content-Length", buffer.length.toString());

  return c.body(buffer);
});

export { speak };
