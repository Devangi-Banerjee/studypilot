import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, requireUserId, HttpError } from "@/lib/api";
import { UpdateTaskSchema } from "@/lib/schemas";
import { replan } from "@/lib/plan";

export const PATCH = handle(async (req, ctx) => {
  const userId = await requireUserId();
  const { id } = await ctx.params;
  const body = UpdateTaskSchema.parse(await req.json());

  const { count } = await db.task.updateMany({
    where: { id, userId }, // userId in the filter = ownership check
    data: {
      ...body,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    },
  });
  if (count === 0) throw new HttpError(404, "Task not found");

  const plan = await replan(userId);
  return NextResponse.json({ ok: true, unscheduled: plan.unscheduled });
});

export const DELETE = handle(async (_req, ctx) => {
  const userId = await requireUserId();
  const { id } = await ctx.params;
  const { count } = await db.task.deleteMany({ where: { id, userId } });
  if (count === 0) throw new HttpError(404, "Task not found");
  await replan(userId);
  return NextResponse.json({ ok: true });
});