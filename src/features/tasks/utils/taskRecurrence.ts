import type { RepeatType } from "./tasksRepository";

export function getNextDueDate(
  currentDueAt: string | null,
  repeatType: RepeatType,
  repeatInterval: number,
  now = new Date(),
) {
  const currentDate = currentDueAt ? new Date(currentDueAt) : now;
  const base = Number.isFinite(currentDate.getTime()) ? currentDate : now;
  const interval = Number.isFinite(repeatInterval)
    ? Math.max(1, Math.floor(repeatInterval))
    : 1;
  let occurrence = 0;
  let date: Date;

  do {
    occurrence += interval;
    date = new Date(base);
    if (repeatType === "daily") {
      date.setDate(base.getDate() + occurrence);
    } else if (repeatType === "weekly") {
      date.setDate(base.getDate() + 7 * occurrence);
    } else if (repeatType === "monthly") {
      date.setDate(1);
      date.setMonth(base.getMonth() + occurrence);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(base.getDate(), lastDay));
    } else {
      break;
    }
  } while (date.getTime() <= now.getTime());

  return date.toISOString();
}
