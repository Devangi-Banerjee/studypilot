import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ExtractionSchema } from "./schemas";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

// Tried in order. If one is overloaded or unavailable, the next one is used.
const MODELS = Array.from(
  new Set([MODEL, "gemini-3.5-flash", "gemini-2.5-flash", "gemini-3-flash-preview"]),
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isBusy(e: unknown) {
  const s = String(e instanceof Error ? e.message : e);
  return /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|high demand/i.test(s);
}

/**
 * Asks the AI for JSON, describes the expected shape in the prompt,
 * then validates the answer with Zod.
 * For each model: up to 2 attempts (waits 2s when the model is busy), then falls back to the next model.
 * Part 2 reuses this for notes, flashcards and quizzes.
 * (toolName is kept only so the function signature stays the same.)
 */
export async function generateStructured<T extends z.ZodType>(opts: {
  system: string;
  user: string;
  schema: T;
  toolName?: string;
  maxTokens?: number;
}): Promise<z.infer<T>> {
  const shape = JSON.stringify(z.toJSONSchema(opts.schema));
  const system =
    opts.system +
    "\n\nReturn ONLY valid JSON (no markdown, no commentary) that matches this JSON Schema exactly:\n" +
    shape;

  let lastError: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: opts.user,
          config: {
            systemInstruction: system,
            responseMimeType: "application/json",
          },
        });
        let text = res.text ?? "";
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        if (!text) throw new Error("Model returned no output");
        return opts.schema.parse(JSON.parse(text));
      } catch (e) {
        lastError = e;
        console.warn(
          `AI call failed on ${model} (attempt ${attempt + 1}):`,
          e instanceof Error ? e.message.slice(0, 200) : e,
        );
        if (isBusy(e)) await sleep(2000);
      }
    }
  }
  throw lastError;
}

export async function extractTasks(text: string) {
  const today = new Date().toISOString().slice(0, 10);
  return generateStructured({
    toolName: "return_tasks",
    schema: ExtractionSchema,
    system: [
      "You extract actionable tasks from student documents (syllabi, assignment emails, schedules).",
      `Today's date is ${today}. Resolve relative dates ("next Friday", "Week 6") against it.`,
      "Create one task per assignment, exam, quiz, project milestone or reading deadline.",
      "Skip lectures, office hours and administrative text.",
      "Estimate realistic total effort in minutes (a 2-page essay ~ 180, an exam ~ 480 of revision, a problem set ~ 150).",
      "Weight: 1-100 reflecting grade impact (final exam 40-60, quiz 5-10, homework 5-15).",
      "Deadlines must be local datetimes in the exact format YYYY-MM-DDTHH:mm (use 23:59 if no time is given).",
      "If a date is missing, set deadline to null instead of guessing.",
    ].join("\n"),
    user: `Extract all tasks from this document:\n\n${text}`,
  });
}