export type SchedTask = { id: string; deadline: Date; weight: number; remainingMinutes: number };
export type Interval = { start: Date; end: Date };
export type Prefs = {
  tzOffsetMinutes: number;
  dayStartHour: number;
  dayEndHour: number;
  maxDailyMinutes: number;
  blockMinutes: number;
  breakMinutes: number;
};
export type PlannedBlock = { taskId: string; start: Date; end: Date };
export type PlanResult = {
  blocks: PlannedBlock[];
  unscheduled: { taskId: string; minutes: number }[];
};

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const MIN_BLOCK = 15;

/** Epoch ms of local midnight for the day containing `ms`, given a UTC offset in minutes. */
export function localMidnight(ms: number, offsetMin: number) {
  const shifted = ms + offsetMin * MIN;
  return Math.floor(shifted / DAY) * DAY - offsetMin * MIN;
}

/**
 * Greedy earliest-deadline-first scheduler.
 * Tasks are sorted by deadline (ties: higher weight first). For each task we walk forward
 * day by day from now, fill free time between dayStartHour and dayEndHour in blocks of at
 * most blockMinutes, leave breakMinutes after each block, and never exceed maxDailyMinutes
 * per day. Minutes that don't fit before the deadline are returned in `unscheduled`,
 * which drives the overload warning.
 */
export function schedule(tasks: SchedTask[], busy: Interval[], prefs: Prefs, now: Date): PlanResult {
  const nowMs = Math.ceil(now.getTime() / (15 * MIN)) * 15 * MIN;
  const taken = busy.map((b) => ({ start: b.start.getTime(), end: b.end.getTime() }));
  const dailyUsed = new Map<number, number>();
  const blocks: PlannedBlock[] = [];
  const unscheduled: PlanResult["unscheduled"] = [];

  const ordered = tasks
    .filter((t) => t.remainingMinutes > 0)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime() || b.weight - a.weight);

  for (const t of ordered) {
    let remaining = t.remainingMinutes;
    const horizon = Math.min(t.deadline.getTime(), nowMs + 120 * DAY);

    for (
      let day = localMidnight(nowMs, prefs.tzOffsetMinutes);
      day < horizon && remaining > 0;
      day += DAY
    ) {
      const winEnd = Math.min(day + prefs.dayEndHour * 60 * MIN, horizon);
      let cursor = Math.max(day + prefs.dayStartHour * 60 * MIN, nowMs);

      while (remaining > 0) {
        const used = dailyUsed.get(day) ?? 0;
        const room = prefs.maxDailyMinutes - used;
        const len = Math.min(prefs.blockMinutes, remaining, room, Math.floor((winEnd - cursor) / MIN));
        if (len < Math.min(MIN_BLOCK, remaining)) break; // no usable space left today

        const end = cursor + len * MIN;
        const clash = taken.find((iv) => iv.start < end && iv.end > cursor);
        if (clash) {
          cursor = clash.end; // jump past the conflict and try again
          continue;
        }

        blocks.push({ taskId: t.id, start: new Date(cursor), end: new Date(end) });
        taken.push({ start: cursor, end: end + prefs.breakMinutes * MIN });
        dailyUsed.set(day, used + len);
        remaining -= len;
        cursor = end + prefs.breakMinutes * MIN;
      }
    }
    if (remaining > 0) unscheduled.push({ taskId: t.id, minutes: remaining });
  }
  return { blocks, unscheduled };
}