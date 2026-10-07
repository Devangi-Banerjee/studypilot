import Link from "next/link";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import LocalTime from "@/components/LocalTime";

export default async function Dashboard() {
  const userId = await currentUserId();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 3600 * 1000);

  const [upcoming, next24] = await Promise.all([
    db.task.findMany({
      where: { userId, status: { not: "DONE" }, deadline: { gt: now } },
      orderBy: { deadline: "asc" },
      take: 5,
    }),
    db.studyBlock.findMany({
      where: { userId, status: "PLANNED", start: { gte: now, lt: in24h } },
      include: { task: true },
      orderBy: { start: "asc" },
    }),
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">Next 24 hours</h2>
        {next24.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing planned. <Link className="underline" href="/import">Import tasks</Link>.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {next24.map((b) => (
              <li key={b.id}>
                <LocalTime iso={b.start.toISOString()} /> · {b.task.title}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">Upcoming deadlines</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming deadlines.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {upcoming.map((t) => (
              <li key={t.id}>
                {t.title} · <LocalTime iso={t.deadline.toISOString()} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}