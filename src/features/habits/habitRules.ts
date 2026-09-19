import type { Habit, HabitRevision } from "./habitsRepository";

export function getLocalDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dayToDate(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date, 12);
}

export function addDays(day: string, amount: number) {
  const date = dayToDate(day);
  date.setDate(date.getDate() + amount);
  return getLocalDay(date);
}

export function isScheduled(habit: Pick<Habit, "weekdays" | "start_day">, day: string) {
  return day >= habit.start_day && (habit.weekdays & (1 << dayToDate(day).getDay())) !== 0;
}

export function getRuleForDay(habit: Habit, revisions: HabitRevision[], day: string): HabitRevision {
  const revision = revisions.findLast((item) => item.effective_day <= day);
  return revision ?? {
    habit_id: habit.id, effective_day: habit.start_day, weekdays: habit.weekdays,
    target_count: habit.target_count, unit: habit.unit, archived: habit.archived,
  };
}

export function isScheduledOnDay(habit: Habit, revisions: HabitRevision[], day: string) {
  const rule = getRuleForDay(habit, revisions, day);
  return !rule.archived && isScheduled({ start_day: habit.start_day, weekdays: rule.weekdays }, day);
}
