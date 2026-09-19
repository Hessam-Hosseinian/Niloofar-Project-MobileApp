import { addDays, getLocalDay, getRuleForDay, isScheduledOnDay } from "./habitRules";
import type { Habit, HabitLog, HabitRevision } from "./habitsRepository";

export function getHabitStats(habit: Habit, logs: HabitLog[], revisions: HabitRevision[], today = getLocalDay()) {
  const byDay = new Map(logs.map((log) => [log.day, log]));
  let current = 0;
  let best = 0;
  let run = 0;
  let total = 0;
  let due30 = 0;
  let done30 = 0;
  let currentOpen = true;
  const thirtyStart = addDays(today, -29);
  let day = today;
  while (day >= habit.start_day) {
    if (isScheduledOnDay(habit, revisions, day)) {
      const rule = getRuleForDay(habit, revisions, day);
      const log = byDay.get(day);
      const skipped = log?.skipped === 1;
      const done = !skipped && (log?.count || 0) >= rule.target_count;
      if (day >= thirtyStart && !skipped) {
        due30++;
        if (done) done30++;
      }
      if (done) {
        total++;
        run++;
        if (currentOpen) current++;
      } else if (!skipped) {
        best = Math.max(best, run);
        run = 0;
        // An unfinished current day does not break yesterday's streak.
        if (!(day === today && currentOpen)) currentOpen = false;
      }
    }
    day = addDays(day, -1);
  }
  return {
    currentStreak: current,
    bestStreak: Math.max(best, run),
    completedDays: total,
    consistency: due30 ? Math.round(done30 / due30 * 100) : 0,
    done30,
    due30,
  };
}
