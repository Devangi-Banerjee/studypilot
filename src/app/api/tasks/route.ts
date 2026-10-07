import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, requireUserId } from "@/lib/api";
import { CreateTasksSchema } from "@/lib/schemas";
import { replan } from "@/lib/plan";

export const GET = handle(async () => {
  const userId = await requireUserId();
  const tasks = await db.task.findMany({
    where: { userId },
    orderBy: { deadline: "asc" },
    include: { course: true },
  });
  return NextResponse.json({ tasks });
});

export const POST = handle(async (req) => {
  const userId = await requireUserId();
  const { tasks } = CreateTasksSchema.parse(await req.json());

  await db.$transaction(
    async (tx) => {
      for (const t of tasks) {
        let courseId: string | null = null;
        if (t.course) {
          const c = await tx.course.upsert({
            where: { userId_name: { userId, name: t.course } },
            update: {},
            create: { userId, name: t.course },
          });
          courseId = c.id;
        }
        await tx.task.create({
          data: {
            userId,
            courseId,
            title: t.title,
            notes: t.notes ?? null,
            deadline: new Date(t.deadline),
            estimatedMinutes: t.estimatedMinutes,
            weight: t.weight,
            source: t.source,
          },
        });
      }
    },
    { timeout: 20_000 },
  );

  const plan = await replan(userId);
  return NextResponse.json({ created: tasks.length, unscheduled: plan.unscheduled });
});