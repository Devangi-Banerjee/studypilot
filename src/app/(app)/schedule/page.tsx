import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import WeekCalendar from "@/components/WeekCalendar";
import ReplanButton from "@/components/ReplanButton";

export default async function SchedulePage() {
  const userId = await currentUserId();
  const blocks = await db.studyBlock.findMany({
    where: { userId },
    include: { task: true },
    orderBy: { start: "asc" },
  });

  const events = blocks.map((b) => ({
    id: b.id,
    title: b.task.title,
    start: b.start.toISOString(),
    end: b.end.toISOString(),
    status: b.status,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <ReplanButton />
      </div>
      <WeekCalendar events={events} />
    </div>
  );
}