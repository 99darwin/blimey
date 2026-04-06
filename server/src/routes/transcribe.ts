import { Hono } from "hono";
import { openai } from "../lib/openai.js";

const transcribe = new Hono();

transcribe.post("/", async (c) => {
  const body = await c.req.parseBody();
  const audioFile = body["file"];

  if (!audioFile || !(audioFile instanceof File)) {
    return c.json({ error: "Missing audio file. Send as multipart/form-data with key 'file'." }, 400);
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (audioFile.size > MAX_FILE_SIZE) {
    return c.json({ error: "Audio file too large. Maximum 10MB." }, 413);
  }

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: audioFile,
  });

  return c.json({ text: transcription.text });
});

export { transcribe };
