import { NextResponse } from "next/server";
import { handle, requireUserId, HttpError } from "@/lib/api";
import { pdfToText } from "@/lib/pdf";
import { extractTasks } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = handle(async (req) => {
  await requireUserId();

  const form = await req.formData();
  let text = String(form.get("text") ?? "");
  const file = form.get("file");

  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) throw new HttpError(413, "PDF must be under 5 MB");
    if (file.type !== "application/pdf") throw new HttpError(415, "Only PDF files are supported");
    text += "\n" + (await pdfToText(await file.arrayBuffer()));
  }

  text = text.trim();
  if (text.length < 20) throw new HttpError(400, "Upload a PDF or paste at least a few lines of text");

  const result = await extractTasks(text.slice(0, 60_000));
  return NextResponse.json(result);
});