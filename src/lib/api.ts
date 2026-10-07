import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "./auth";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new HttpError(401, "Not signed in");
  return id;
}

type Ctx = { params: Promise<Record<string, string>> };

/** Wraps every API route: turns thrown errors into JSON { error } responses. */
export function handle(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      if (e instanceof ZodError) {
        return NextResponse.json({ error: "Invalid input", details: e.issues }, { status: 400 });
      }
      console.error(e);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  };
}