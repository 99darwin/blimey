import { Hono } from "hono";
import { openai } from "../lib/openai.js";

const translate = new Hono();

type Direction = "UK_TO_US" | "US_TO_UK";

interface TranslateRequest {
  text: string;
  direction: Direction;
  dialect: string;
}

interface TranslationResponse {
  original: string;
  translated: string;
  context: string;
  literal_meaning: string;
  confidence: "high" | "medium" | "low";
}

const VALID_DIRECTIONS: ReadonlySet<string> = new Set(["UK_TO_US", "US_TO_UK"]);

const VALID_DIALECTS: ReadonlySet<string> = new Set([
  "general", "london", "scouse", "northern", "scottish",
  "welsh", "cockney", "southern", "new england", "midwest", "nyc",
]);

function buildSystemPrompt(direction: Direction, dialect: string): string {
  const targetCountry = direction === "UK_TO_US" ? "American" : "British";
  const dialectLabel = dialect === "general" ? `general ${targetCountry} English` : `${dialect} (a regional ${targetCountry} dialect)`;

  return `You are a British-American English translator specializing in regional dialects. You translate slang, idioms, terminology, and colloquialisms between UK and American English with strict attention to local vocabulary.

Direction: ${direction}
Target dialect: ${dialectLabel}

CRITICAL RULES FOR REGIONAL ACCURACY:
- You MUST use vocabulary that a native speaker of the ${dialect} dialect would actually use, not generic ${targetCountry} English.
- If the target dialect has a distinctive local word for something, use it. Examples:
  * Midwest US: "soda" → "pop" (NOT "soda")
  * Southern US: "you all" → "y'all", "shopping cart" → "buggy"
  * NYC: "sandwich" → "hero" or "hoagie", "sneakers" → "sneakers" (not "tennis shoes")
  * New England: "milkshake" → "frappe", "water fountain" → "bubbler"
  * Scouse (Liverpool): "friend" → "lad/la", "good" → "boss"
  * Cockney (London): use rhyming slang where natural ("stairs" → "apples and pears")
  * Scottish: "small" → "wee", "know" → "ken"
  * Welsh: "friend" → "butt", "now" → "now in a minute"
- If the word is the same in both general and regional dialect, still confirm it and note that it's universal in the context.
- The "context" field should explicitly mention the regional usage when relevant (e.g., "In the Midwest, carbonated drinks are called 'pop' rather than 'soda'.").

OTHER RULES:
- Respond ONLY with valid JSON. No markdown, no preamble.
- Keep cultural context to 1 sentence max.
- If you detect the user is speaking in the wrong direction, gently note this and translate anyway.

Response format:
{
  "original": "the exact phrase the user said",
  "translated": "the equivalent phrase in the target dialect, using region-specific vocabulary",
  "context": "brief cultural explanation, mentioning the regional usage",
  "literal_meaning": "what a native speaker of the target dialect would think you meant (if different/funny)",
  "confidence": "high" | "medium" | "low"
}`;
}

function isValidTranslation(data: unknown): data is TranslationResponse {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.original === "string" &&
    typeof obj.translated === "string" &&
    typeof obj.context === "string" &&
    typeof obj.literal_meaning === "string" &&
    (obj.confidence === "high" || obj.confidence === "medium" || obj.confidence === "low")
  );
}

translate.post("/", async (c) => {
  const body = await c.req.json<TranslateRequest>();

  if (!body.text || typeof body.text !== "string") {
    return c.json({ error: "Missing or invalid 'text' field" }, 400);
  }

  if (!body.direction || !VALID_DIRECTIONS.has(body.direction)) {
    return c.json({ error: "Invalid 'direction'. Must be 'UK_TO_US' or 'US_TO_UK'." }, 400);
  }

  if (body.text.length > 500) {
    return c.json({ error: "Text too long. Maximum 500 characters." }, 400);
  }

  const dialect = VALID_DIALECTS.has(body.dialect?.toLowerCase() ?? "") ? body.dialect.toLowerCase() : "general";
  const systemPrompt = buildSystemPrompt(body.direction, dialect);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 300,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: body.text },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    return c.json({ error: "No response from translation model" }, 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return c.json({ error: "Invalid JSON from translation model" }, 502);
  }

  if (!isValidTranslation(parsed)) {
    return c.json({ error: "Unexpected response shape from translation model" }, 502);
  }

  return c.json(parsed);
});

export { translate };
