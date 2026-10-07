import { describe, it, expect } from "vitest";
import { schedule, type Prefs } from "./scheduler";

const prefs: Prefs = {
  tzOffsetMinutes: 0,
  dayStartHour: 9,
  dayEndHour: 17,
  maxDailyMinutes: 240,
  blockMinutes: 60,
  breakMinutes: 10,
};
const now = new Date("2026-10-05T00:00:00Z");

describe("scheduler", () => {
  it("schedules the earlier deadline first", () => {
    const r = schedule(
      [
        { id: "B", deadline: new Date("2026-10-10T20:00:00Z"), weight: 50, remainingMinutes: 60 },
        { id: "A", deadline: new Date("2026-10-06T20:00:00Z"), weight: 10, remainingMinutes: 60 },
      ],
      [],
      prefs,
      now,
    );
    expect(r.blocks[0].taskId).toBe("A");
    expect(r.unscheduled).toHaveLength(0);
  });

  it("reports minutes that cannot fit before the deadline", () => {
    const r = schedule(
      [{ id: "X", deadline: new Date("2026-10-05T12:00:00Z"), weight: 50, remainingMinutes: 600 }],
      [],
      prefs,
      now,
    );
    expect(r.unscheduled[0].minutes).toBeGreaterThan(0);
  });

  it("never exceeds the daily cap", () => {
    const r = schedule(
      [{ id: "Y", deadline: new Date("2026-10-20T00:00:00Z"), weight: 50, remainingMinutes: 1000 }],
      [],
      prefs,
      now,
    );
    const perDay = new Map<string, number>();
    for (const b of r.blocks) {
      const k = b.start.toISOString().slice(0, 10);
      perDay.set(k, (perDay.get(k) ?? 0) + (b.end.getTime() - b.start.getTime()) / 60000);
    }
    for (const v of perDay.values()) expect(v).toBeLessThanOrEqual(240);
  });
});