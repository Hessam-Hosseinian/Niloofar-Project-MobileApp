import type { Habit, HabitLog, HabitRevision } from "./habitsRepository";

export type HabitBackup = {
  version: 1;
  exported_at: string;
  habits: Habit[];
  logs: HabitLog[];
  revisions: HabitRevision[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isId = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;
const isDay = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  (() => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
  })();
const isFlag = (value: unknown) => value === 0 || value === 1;
const isCount = (value: unknown) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 1_000_000;
const isText = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max;

export function parseHabitBackup(source: string): HabitBackup {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error("This is not a valid JSON backup.");
  }
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.habits) ||
      !Array.isArray(value.logs) || !Array.isArray(value.revisions) ||
      value.habits.length > 10000 || value.logs.length > 100000 || value.revisions.length > 100000) {
    throw new Error("This is not a supported habit backup.");
  }

  const habitIds = new Set<number>();
  const habitStarts = new Map<number, string>();
  for (const habit of value.habits) {
    if (!isObject(habit) || !isId(habit.id) || habitIds.has(habit.id) ||
        !isText(habit.title, 70) || !habit.title.trim() ||
        typeof habit.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(habit.color) ||
        !(habit.cue === null || isText(habit.cue, 100)) ||
        !Number.isInteger(habit.weekdays) || Number(habit.weekdays) < 1 || Number(habit.weekdays) > 127 ||
        !isCount(habit.target_count) || Number(habit.target_count) < 1 || Number(habit.target_count) > 999 ||
        !isText(habit.unit, 20) ||
        !(habit.reminder_time === null || (typeof habit.reminder_time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(habit.reminder_time))) ||
        !isFlag(habit.archived) || !isDay(habit.start_day) || !isText(habit.created_at, 50)) {
      throw new Error("The backup contains an invalid habit.");
    }
    habitIds.add(habit.id);
    habitStarts.set(habit.id, habit.start_day);
  }

  const revisionKeys = new Set<string>();
  const firstRevision = new Set<number>();
  const latestRevision = new Map<number, { day: string; archived: number }>();
  for (const revision of value.revisions) {
    if (!isObject(revision) || !isId(revision.habit_id) || !habitIds.has(revision.habit_id) ||
        !isDay(revision.effective_day) || !Number.isInteger(revision.weekdays) ||
        Number(revision.weekdays) < 1 || Number(revision.weekdays) > 127 ||
        !isCount(revision.target_count) || Number(revision.target_count) < 1 || Number(revision.target_count) > 999 ||
        !isText(revision.unit, 20) || !isFlag(revision.archived)) {
      throw new Error("The backup contains an invalid schedule.");
    }
    const key = `${revision.habit_id}:${revision.effective_day}`;
    if (revisionKeys.has(key)) throw new Error("The backup has duplicate schedule days.");
    revisionKeys.add(key);
    if (revision.effective_day <= habitStarts.get(revision.habit_id)!) firstRevision.add(revision.habit_id);
    const latest = latestRevision.get(revision.habit_id);
    if (!latest || revision.effective_day > latest.day) {
      latestRevision.set(revision.habit_id, { day: revision.effective_day, archived: revision.archived as number });
    }
  }
  if (firstRevision.size !== habitIds.size) throw new Error("The backup is missing schedule history.");
  for (const habit of value.habits as Habit[]) {
    if (latestRevision.get(habit.id)?.archived !== habit.archived) {
      throw new Error("The backup has an inconsistent pause state.");
    }
  }

  const logIds = new Set<number>();
  const logDays = new Set<string>();
  for (const log of value.logs) {
    if (!isObject(log) || !isId(log.id) || logIds.has(log.id) ||
        !isId(log.habit_id) || !habitIds.has(log.habit_id) || !isDay(log.day) ||
        !isCount(log.count) || !isFlag(log.skipped) || !isFlag(log.completed) ||
        !isText(log.created_at, 50)) {
      throw new Error("The backup contains an invalid progress record.");
    }
    const key = `${log.habit_id}:${log.day}`;
    if (logDays.has(key)) throw new Error("The backup has duplicate progress days.");
    logIds.add(log.id);
    logDays.add(key);
  }

  return value as HabitBackup;
}
