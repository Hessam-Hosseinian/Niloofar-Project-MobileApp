import { getDatabase } from "@/src/db/database";
import { getLocalDay, getRuleForDay, isScheduledOnDay } from "./habitRules";

export { addDays, dayToDate, getLocalDay, getRuleForDay, isScheduled, isScheduledOnDay } from "./habitRules";

export type Habit = {
  id: number; title: string; color: string; cue: string | null;
  weekdays: number; target_count: number; unit: string;
  reminder_time: string | null; notification_ids: string | null;
  archived: number; start_day: string; created_at: string;
};
export type HabitDraft = Pick<Habit, "title" | "color" | "cue" | "weekdays" | "target_count" | "unit" | "reminder_time">;
export type HabitRevision = { habit_id: number; effective_day: string; weekdays: number; target_count: number; unit: string; archived: number };
export type HabitWithStatus = Habit & { count: number; skipped: number; day_rule: HabitRevision };
export type HabitLog = { id: number; habit_id: number; day: string; count: number; skipped: number; completed: number; created_at: string };

export async function getHabitRevisions(habitId: number) {
  const db = await getDatabase();
  return db.getAllAsync<HabitRevision>(
    "SELECT * FROM habit_revisions WHERE habit_id = ? ORDER BY effective_day",
    habitId,
  );
}

export async function getHabitsForDay(day: string, includeArchived = false) {
  const db = await getDatabase();
  const habits = await db.getAllAsync<Habit & { count: number; skipped: number }>(
    `SELECT h.*, COALESCE(l.count, 0) AS count, COALESCE(l.skipped, 0) AS skipped
     FROM habits h LEFT JOIN habit_logs l ON l.habit_id = h.id AND l.day = ?
     ORDER BY h.created_at DESC`,
    day,
  );
  const revisions = await db.getAllAsync<HabitRevision>(
    "SELECT * FROM habit_revisions WHERE effective_day <= ? ORDER BY effective_day",
    day,
  );
  const byHabit = new Map<number, HabitRevision[]>();
  for (const revision of revisions) {
    const history = byHabit.get(revision.habit_id) ?? [];
    history.push(revision);
    byHabit.set(revision.habit_id, history);
  }
  return habits
    .filter((habit) => includeArchived || !habit.archived || day < getLocalDay())
    .map((habit) => ({ ...habit, day_rule: getRuleForDay(habit, byHabit.get(habit.id) ?? [], day) }));
}
export async function createHabit(draft: HabitDraft) {
  const db = await getDatabase();
  const day = getLocalDay();
  let id = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO habits (title, color, cue, weekdays, target_count, unit, reminder_time, start_day, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      draft.title.trim(), draft.color, draft.cue?.trim() || null, draft.weekdays,
      draft.target_count, draft.unit.trim() || "times", draft.reminder_time, day, new Date().toISOString(),
    );
    id = Number(result.lastInsertRowId);
    await db.runAsync(
      "INSERT INTO habit_revisions (habit_id, effective_day, weekdays, target_count, unit, archived) VALUES (?, ?, ?, ?, ?, 0)",
      id, day, draft.weekdays, draft.target_count, draft.unit.trim() || "times",
    );
  });
  return id;
}
export async function updateHabit(id: number, draft: HabitDraft) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "UPDATE habits SET title = ?, color = ?, cue = ?, weekdays = ?, target_count = ?, unit = ?, reminder_time = ? WHERE id = ?",
      draft.title.trim(), draft.color, draft.cue?.trim() || null, draft.weekdays,
      draft.target_count, draft.unit.trim() || "times", draft.reminder_time, id,
    );
    await db.runAsync(
      `INSERT INTO habit_revisions (habit_id, effective_day, weekdays, target_count, unit, archived)
       VALUES (?, ?, ?, ?, ?, (SELECT archived FROM habits WHERE id = ?))
       ON CONFLICT(habit_id, effective_day) DO UPDATE SET weekdays = excluded.weekdays, target_count = excluded.target_count, unit = excluded.unit`,
      id, getLocalDay(), draft.weekdays, draft.target_count, draft.unit.trim() || "times", id,
    );
    await db.runAsync("UPDATE habit_logs SET completed = CASE WHEN count >= ? AND skipped = 0 THEN 1 ELSE 0 END WHERE habit_id = ? AND day = ?", draft.target_count, id, getLocalDay());
  });
}
export async function setHabitProgress(habitId: number, day: string, count: number, skipped = false) {
  if (day > getLocalDay()) throw new Error("Future days cannot be logged.");
  const db = await getDatabase();
  const habit = await getHabitById(habitId);
  if (!habit || habit.archived) throw new Error("Habit is unavailable.");
  const revisions = await getHabitRevisions(habitId);
  if (!isScheduledOnDay(habit, revisions, day)) throw new Error("Habit is not scheduled for this day.");
  const target = getRuleForDay(habit, revisions, day).target_count;
  if (count <= 0 && !skipped) {
    await db.runAsync("DELETE FROM habit_logs WHERE habit_id = ? AND day = ?", habitId, day);
    return;
  }
  await db.runAsync(
    `INSERT INTO habit_logs (habit_id, day, count, skipped, completed, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(habit_id, day) DO UPDATE SET count = excluded.count, skipped = excluded.skipped,
       completed = excluded.completed`,
    habitId, day, Math.max(0, count), skipped ? 1 : 0,
    !skipped && count >= target ? 1 : 0, new Date().toISOString(),
  );
}
export async function getHabitById(id: number) {
  const db = await getDatabase();
  return db.getFirstAsync<Habit>("SELECT * FROM habits WHERE id = ? LIMIT 1", id);
}
export async function getHabitLogs(habitId: number) {
  const db = await getDatabase();
  return db.getAllAsync<HabitLog>("SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY day DESC", habitId);
}
export async function setHabitArchived(id: number, archived: boolean) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE habits SET archived = ? WHERE id = ?", archived ? 1 : 0, id);
    await db.runAsync(
      `INSERT INTO habit_revisions (habit_id, effective_day, weekdays, target_count, unit, archived)
       SELECT id, ?, weekdays, target_count, unit, ? FROM habits WHERE id = ?
       ON CONFLICT(habit_id, effective_day) DO UPDATE SET archived = excluded.archived`,
      getLocalDay(), archived ? 1 : 0, id,
    );
  });
}
export async function setHabitNotificationIds(id: number, ids: string[]) {
  const db = await getDatabase();
  await db.runAsync("UPDATE habits SET notification_ids = ? WHERE id = ?", JSON.stringify(ids), id);
}
export async function deleteHabit(id: number) {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM habits WHERE id = ?", id);
}
