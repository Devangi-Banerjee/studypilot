import { db } from "./db";
import { schedule } from "./scheduler";

export async function getPrefs(userId: string) {
  return db.preference.upsert({ where: { userId }, update: {}, create: { userId } });
}

/**
 * Rebuilds the future plan:
 *  1. PLANNED blocks whose end time has passed are marked MISSED
 *  2. remaining minutes per task = estimate minus minutes in DONE blocks
 *  3. all future PLANNED blocks are replaced by a fresh schedule
 * Tasks whose deadline already passed are not rescheduled.
 */
export async function replan(userId: string, now = new Date()) {
  const prefs = await getPrefs(userId);

  await db.studyBlock.updateMany({
    where: { userId, status: "PLANNED", end: { lte: now } },
    data: { status: "MISSED" },
  });

  const tasks = await db.task.findMany({
    where: { userId, status: { not: "DONE" }, deadline: { gt: now } },
    include: { blocks: { where: { status: "DONE" } } },
  });

  const input = tasks.map((t) => {
    const done = t.blocks.reduce((s, b) => s + (b.end.getTime() - b.start.getTime()) / 60000, 0);
    return {
      id: t.id,
      deadline: t.deadline,
      weight: t.weight,
      remainingMinutes: Math.max(0, t.estimatedMinutes - done),
    };
  });

  const result = schedule(input, [], prefs, now);

  await db.$transaction([
    db.studyBlock.deleteMany({ where: { userId, status: "PLANNED", end: { gt: now } } }),
    db.studyBlock.createMany({
      data: result.blocks.map((b) => ({ userId, taskId: b.taskId, start: b.start, end: b.end })),
    }),
  ]);

  return result;
}