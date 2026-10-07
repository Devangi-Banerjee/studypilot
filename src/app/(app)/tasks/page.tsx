import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import LocalTime from "@/components/LocalTime";
import TaskActions from "@/components/TaskActions";

export default async function TasksPage() {
  const userId = await currentUserId();
  const tasks = await db.task.findMany({
    where: { userId },
    orderBy: { deadline: "asc" },
    include: { course: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tasks</h1>
      {tasks.length === 0 && <p className="text-slate-500">No tasks yet. Use Import to add some.</p>}
      <ul className="divide-y rounded-lg border">
        {tasks.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div>
              <p className={t.status === "DONE" ? "text-slate-400 line-through" : "font-medium"}>{t.title}</p>
              <p className="text-xs text-slate-500">
                {t.course?.name ?? "No course"} · due <LocalTime iso={t.deadline.toISOString()} /> ·{" "}
                {t.estimatedMinutes} min · weight {t.weight}
              </p>
            </div>
            <TaskActions id={t.id} done={t.status === "DONE"} />
          </li>
        ))}
      </ul>
    </div>
  );
}